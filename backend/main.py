import os
from io import BytesIO
from typing import Optional

import fastapi
import fastapi.middleware.cors
from fastapi import UploadFile, File, HTTPException
from pydantic import BaseModel
from PyPDF2 import PdfReader
import google.generativeai as genai
import requests

app = fastapi.FastAPI()

app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


# ============ PDF Text Extraction ============

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract and clean text from a PDF file."""
    reader = PdfReader(BytesIO(file_bytes))
    pages_text = []
    for page in reader.pages:
        text = page.extract_text() or ""
        cleaned = " ".join(text.split())
        if cleaned:
            pages_text.append(cleaned)
    return "\n\n".join(pages_text)


# ============ Prompt Builders ============

def build_summary_prompt(paper_text: str) -> str:
    max_chars = 12000
    trimmed_text = paper_text[:max_chars]

    return f"""
You are a research assistant. Read the following research paper text and create a **very concise, well-written context summary**.

Summarise into the following sections. Each bullet should be short, specific, and easy to scan:

1. Key Findings
2. Evidence & Methodology
3. Limitations & Improvements
4. Future Work / Open Questions
5. Practical Implications / Applications

Rules:
- Use plain, grammatical English; avoid heavy jargon where possible.
- Prefer 3-6 bullets per section.
- Each bullet should be one short, complete sentence (not fragments).
- Do NOT restate the full abstract; focus on the most important points.
- If the information for a section is missing, write "Not clearly specified in the provided text."

Return the answer in **Markdown** with `##` headings for each section, clean spacing, and no duplicated headings.

Paper text:
\"\"\"{trimmed_text}\"\"\" 
"""


def build_compare_prompt(papers: list[dict]) -> str:
    numbered_blocks = []
    for idx, p in enumerate(papers, start=1):
        numbered_blocks.append(
            f"Paper {idx} ({p['label']}):\n\n{p['summary']}\n"
        )

    joined = "\n\n".join(numbered_blocks)

    return f"""
You are helping a researcher quickly understand **relationships between multiple research papers**.
Each paper below is already summarised into key findings, evidence, limitations, and implications.

Using only the information provided, create a clear, structured comparison.

Required sections (in this order):
1. Overall Topic Similarity
2. Shared Ideas / Overlaps
3. Key Differences in Findings
4. Differences in Methods / Evidence
5. Complementary Insights (how they reinforce each other)
6. Conflicts or Tensions (where they disagree or diverge)
7. Common Technologies / Techniques / Domains

Rules:
- Use skimmable bullet points for each section.
- Keep language precise and neutral.
- Call the papers "Paper 1", "Paper 2", "Paper 3" (matching the order below).
- If something is not clear from the summaries, say "Not specified in the summaries."

Return the answer in Markdown with `##` headings for each section.

Paper summaries:
{joined}
"""


# ============ AI Generation ============

def generate_with_gemini(prompt: str) -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not set. Please add it to your environment variables."
        )

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)
    response = model.generate_content(
        prompt,
        generation_config={"temperature": 0.2},
    )

    return (response.text or "").strip() if hasattr(response, "text") else "No text returned by Gemini."


# ============ Semantic Scholar API ============

def fetch_citations_from_semantic_scholar(idea_text: str, limit: int = 8) -> list[dict]:
    """Fetch candidate citations from Semantic Scholar API."""
    base_url = "https://api.semanticscholar.org/graph/v1/paper/search"

    def _run_query(q: str) -> list[dict]:
        q_clean = " ".join(q.split())
        if not q_clean:
            return []

        params = {
            "query": q_clean,
            "limit": limit,
            "fields": "title,authors,year,venue,doi,url,isOpenAccess",
        }

        try:
            resp = requests.get(base_url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", [])
        except Exception:
            return []

    trimmed = idea_text.strip()
    queries: list[tuple[str, str]] = []

    if trimmed:
        queries.append((trimmed[:400], "full_idea"))

    sep_idx = min(
        [idx for idx in (trimmed.find("."), trimmed.find("?"), trimmed.find("!")) if idx != -1],
        default=-1,
    )
    if sep_idx != -1:
        first_sentence = trimmed[: sep_idx + 1]
        queries.append((first_sentence, "first_sentence"))

    words = trimmed.split()
    if words:
        keywords = " ".join(words[:15])
        queries.append((keywords, "first_keywords"))

    seen_ids = set()
    combined_results: list[dict] = []

    for q, _ in queries:
        if len(combined_results) >= limit:
            break
        results = _run_query(q)
        for paper in results:
            paper_id = paper.get("paperId") or paper.get("doi") or paper.get("url")
            if not paper_id or paper_id in seen_ids:
                continue
            seen_ids.add(paper_id)
            combined_results.append(paper)
            if len(combined_results) >= limit:
                break

    return combined_results


# ============ API Models ============

class SummarizeResponse(BaseModel):
    text: str
    summary: str


class CompareRequest(BaseModel):
    papers: list[dict]


class CompareResponse(BaseModel):
    comparison: str


class CitationRequest(BaseModel):
    idea: str
    limit: int = 8


class CitationResponse(BaseModel):
    citations: list[dict]


# ============ API Endpoints ============

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)) -> dict[str, str]:
    """Extract text from an uploaded PDF."""
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")
    
    file_bytes = await file.read()
    text = extract_text_from_pdf(file_bytes)
    
    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from this PDF. It may be scanned or image-only."
        )
    
    return {"text": text}


@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(file: UploadFile = File(...)) -> SummarizeResponse:
    """Extract text from PDF and generate a structured summary."""
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")
    
    file_bytes = await file.read()
    text = extract_text_from_pdf(file_bytes)
    
    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from this PDF. It may be scanned or image-only."
        )
    
    prompt = build_summary_prompt(text)
    summary = generate_with_gemini(prompt)
    
    return SummarizeResponse(text=text, summary=summary)


@app.post("/compare", response_model=CompareResponse)
async def compare(request: CompareRequest) -> CompareResponse:
    """Compare multiple paper summaries."""
    if len(request.papers) < 2:
        raise HTTPException(
            status_code=400,
            detail="Please provide at least 2 papers to compare."
        )
    
    prompt = build_compare_prompt(request.papers)
    comparison = generate_with_gemini(prompt)
    
    return CompareResponse(comparison=comparison)


@app.post("/find-citations", response_model=CitationResponse)
async def find_citations(request: CitationRequest) -> CitationResponse:
    """Find citations for a research idea."""
    if not request.idea.strip():
        raise HTTPException(
            status_code=400,
            detail="Please provide a research idea."
        )
    
    citations = fetch_citations_from_semantic_scholar(request.idea, limit=request.limit)
    
    # Sort by year (desc)
    citations_sorted = sorted(
        citations,
        key=lambda r: r.get("year") or 0,
        reverse=True,
    )
    
    return CitationResponse(citations=citations_sorted)
