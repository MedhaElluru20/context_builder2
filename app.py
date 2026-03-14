import os
from textwrap import shorten

import streamlit as st
from dotenv import load_dotenv
from PyPDF2 import PdfReader
import google.generativeai as genai
import requests


load_dotenv()

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


@st.cache_data(show_spinner=False)
def extract_text_from_pdf(uploaded_file) -> str:
    reader = PdfReader(uploaded_file)
    pages_text = []
    for page in reader.pages:
        text = page.extract_text() or ""
        cleaned = " ".join(text.split())
        if cleaned:
            pages_text.append(cleaned)
    return "\n\n".join(pages_text)


def build_prompt(paper_text: str) -> str:
    # Truncate very long papers to keep within model limits
    # (rough heuristic; you can adjust this)
    max_chars = 12000
    trimmed_text = paper_text[:max_chars]

    return f"""
You are a research assistant. Read the following research paper text and create a **very concise, well‑written context summary**.

Summarise into the following sections. Each bullet should be short, specific, and easy to scan:

1. Key Findings
2. Evidence & Methodology
3. Limitations & Improvements
4. Future Work / Open Questions
5. Practical Implications / Applications

Rules:
- Use plain, grammatical English; avoid heavy jargon where possible.
- Prefer 3–6 bullets per section.
- Each bullet should be one short, complete sentence (not fragments).
- Do NOT restate the full abstract; focus on the most important points.
- If the information for a section is missing, write "Not clearly specified in the provided text."

Return the answer in **Markdown** with `##` headings for each section, clean spacing, and no duplicated headings.

Paper text:
\"\"\"{trimmed_text}\"\"\" 
"""


def generate_structured_summary(paper_text: str) -> str:
    if not GEMINI_API_KEY:
        return "Error: GEMINI_API_KEY is not set. Please add it to a .env file or your environment variables."

    genai.configure(api_key=GEMINI_API_KEY)

    prompt = build_prompt(paper_text)

    # #region agent log
    try:
        import json
        from datetime import datetime

        log_entry = {
            "sessionId": "e2eb50",
            "runId": "pre-fix",
            "hypothesisId": "H_model_name",
            "location": "app.py:generate_structured_summary",
            "message": "About to call Gemini model",
            "data": {
                "model": GEMINI_MODEL,
                "paper_text_chars": len(paper_text or ""),
            },
            "timestamp": int(datetime.utcnow().timestamp() * 1000),
        }
        with open("debug-e2eb50.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception:
        pass
    # #endregion agent log

    model = genai.GenerativeModel(GEMINI_MODEL)
    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.2,
        },
    )

    return (response.text or "").strip() if hasattr(response, "text") else "No text returned by Gemini."


def build_compare_prompt(papers: list[dict]) -> str:
    """
    Build a prompt to compare multiple papers.

    Each item in `papers` should have: id, label, summary.
    """
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


def generate_comparison(papers: list[dict]) -> str:
    if not GEMINI_API_KEY:
        return "Error: GEMINI_API_KEY is not set. Please add it to a .env file or your environment variables."

    genai.configure(api_key=GEMINI_API_KEY)

    prompt = build_compare_prompt(papers)

    model = genai.GenerativeModel(GEMINI_MODEL)
    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.2,
        },
    )

    return (response.text or "").strip() if hasattr(response, "text") else "No text returned by Gemini."


def fetch_citations_from_semantic_scholar(idea_text: str, limit: int = 8) -> list[dict]:
    """Fetch candidate citations from Semantic Scholar API with simple fallbacks.

    Strategy:
    - Try the full idea (trimmed) as a query.
    - If nothing is found, try the first sentence.
    - If still nothing is found, keep the first 10–15 content words.
    """

    base_url = "https://api.semanticscholar.org/graph/v1/paper/search"

    def _run_query(q: str, tag: str) -> list[dict]:
        q_clean = " ".join(q.split())
        if not q_clean:
            return []

        params = {
            "query": q_clean,
            "limit": limit,
            "fields": "title,authors,year,venue,doi,url,isOpenAccess",
        }

        # #region agent log
        try:
            import json
            from datetime import datetime

            log_entry = {
                "sessionId": "e2eb50",
                "runId": "citations",
                "hypothesisId": "H_semantic_scholar_query",
                "location": "app.py:fetch_citations_from_semantic_scholar",
                "message": "Calling Semantic Scholar",
                "data": {
                    "query_tag": tag,
                    "query_preview": q_clean[:120],
                },
                "timestamp": int(datetime.utcnow().timestamp() * 1000),
            }
            with open("debug-e2eb50.log", "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry) + "\n")
        except Exception:
            pass
        # #endregion agent log

        try:
            resp = requests.get(base_url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", [])
        except Exception:
            return []

    # Candidate queries
    trimmed = idea_text.strip()
    queries: list[tuple[str, str]] = []

    # 1) Full idea, truncated to a reasonable length
    if trimmed:
        queries.append((trimmed[:400], "full_idea"))

    # 2) First sentence only
    sep_idx = min(
        [idx for idx in (trimmed.find("."), trimmed.find("?"), trimmed.find("!")) if idx != -1],
        default=-1,
    )
    if sep_idx != -1:
        first_sentence = trimmed[: sep_idx + 1]
        queries.append((first_sentence, "first_sentence"))

    # 3) Heuristic keywords (first ~15 words)
    words = trimmed.split()
    if words:
        keywords = " ".join(words[:15])
        queries.append((keywords, "first_keywords"))

    seen_ids = set()
    combined_results: list[dict] = []

    for q, tag in queries:
        if len(combined_results) >= limit:
            break
        results = _run_query(q, tag)
        for paper in results:
            paper_id = paper.get("paperId") or paper.get("doi") or paper.get("url")
            if not paper_id or paper_id in seen_ids:
                continue
            seen_ids.add(paper_id)
            combined_results.append(paper)
            if len(combined_results) >= limit:
                break

    return combined_results


def format_citation_results(results: list[dict]) -> str:
    if not results:
        return "No matching papers were found for this query. Try rephrasing or broadening your idea."

    # Sort by year (desc) so recent work appears first when the field is present
    results_sorted = sorted(
        results,
        key=lambda r: r.get("year") or 0,
        reverse=True,
    )

    lines = ["## Suggested citations\n"]
    for paper in results_sorted:
        title = paper.get("title") or "Untitled"
        year = paper.get("year") or "n.d."
        venue = paper.get("venue") or "Venue not specified"
        authors = paper.get("authors") or []
        author_names = ", ".join(a.get("name") for a in authors[:4] if a.get("name"))
        if len(authors) > 4:
            author_names += " et al."

        doi = paper.get("doi")
        url = paper.get("url")

        lines.append(f"- **{title}** ({year})")
        if author_names:
            lines.append(f"  - Authors: {author_names}")
        lines.append(f"  - Venue: {venue}")
        if doi:
            lines.append(f"  - DOI: `{doi}`")
        if url:
            lines.append(f"  - Link: {url}")
        lines.append("")  # blank line between entries

    lines.append(
        "> These suggestions come from the Semantic Scholar API and are intended as a starting point. "
        "Always read and verify each paper before citing it."
    )

    return "\n".join(lines)


def render_paper_workspace(slot_id: str, title: str) -> None:
    """One independent 'window' for a single paper."""
    upload_key = f"upload_{slot_id}"
    toggle_key = f"show_raw_{slot_id}"
    summary_key = f"summary_md_{slot_id}"

    st.markdown(
        f"""
        <div style='background:linear-gradient(90deg,#eff3ff,#fdfbff);
                    border-radius:0.75rem;
                    padding:0.85rem 1.1rem;
                    margin-bottom:0.9rem;
                    border:1px solid #dde3ff;'>
            <div style="font-weight:650;color:#1e3a8a;font-size:0.98rem;">
                {title}
            </div>
            <div style="font-size:0.8rem;color:#475569;margin-top:0.1rem;">
                Upload a paper on the left and view its structured context on the right.
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    col_left, col_right = st.columns([1.05, 1.95])

    with col_left:
        st.markdown(
            """
            <div style="background-color:#f1f5f9;border-radius:0.6rem;
                        padding:0.75rem 0.9rem;margin-bottom:0.55rem;">
                <div style="font-size:0.85rem;font-weight:600;color:#0f172a;">
                    Inputs
                </div>
                <div style="font-size:0.78rem;color:#64748b;margin-top:0.2rem;">
                    Choose a PDF and (optionally) inspect the extracted text before creating the summary.
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        uploaded_file = st.file_uploader(
            "Upload a PDF",
            type=["pdf"],
            key=upload_key,
            help="Upload a research article in PDF format.",
        )
        show_raw_preview = st.toggle(
            "Show extracted text preview",
            value=False,
            key=toggle_key,
        )

        if not uploaded_file:
            st.info("Upload a PDF in this workspace to get started.")
            return

        with st.spinner("Extracting text from PDF..."):
            paper_text = extract_text_from_pdf(uploaded_file)
            # Remember raw text for possible future comparison
            st.session_state[f"text_{slot_id}"] = paper_text

        if not paper_text.strip():
            st.error("Could not extract text from this PDF. It may be scanned or image-only.")
            return

        if show_raw_preview:
            with st.expander("Extracted text (cleaned)"):
                st.text_area(
                    "Extracted text",
                    value=paper_text,
                    height=350,
                )

        if st.button("Generate Context Summary", type="primary", key=f"generate_{slot_id}"):
            with st.spinner("Generating structured summary..."):
                summary_md = generate_structured_summary(paper_text)
            st.session_state[summary_key] = summary_md

    with col_right:
        st.markdown(
            """
            <div style="background:linear-gradient(90deg,#fff7ed,#fffbeb);
                        border-radius:0.6rem;
                        padding:0.55rem 0.95rem;
                        margin-bottom:0.45rem;
                        border:1px solid #fed7aa;">
                <span style="font-weight:650;color:#9a3412;">Context Summary</span>
            </div>
            """,
            unsafe_allow_html=True,
        )

        if summary_key in st.session_state:
            st.markdown(st.session_state[summary_key])
        else:
            st.info(
                "Click **Generate Context Summary** after uploading a PDF in this panel to see the structured summary here."
            )


def main():
    st.set_page_config(
        page_title="Research Paper Context Builder",
        page_icon="📚",
        layout="wide",
    )

    # Global button style (lavender)
    st.markdown(
        """
        <style>
        div.stButton > button {
            background-color:#e9d5ff;
            color:#312e81;
            border-radius:999px;
            border:1px solid #c4b5fd;
            padding:0.35rem 0.9rem;
            font-weight:600;
        }
        div.stButton > button:hover {
            background-color:#ddd6fe;
            color:#1e1b4b;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

    st.markdown(
        """
        <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.4rem;">
            <div style="width:2.1rem;height:2.1rem;border-radius:0.75rem;
                        background:radial-gradient(circle at 30% 20%,#4f46e5,#0ea5e9);
                        display:flex;align-items:center;justify-content:center;
                        color:white;font-weight:700;font-size:1.1rem;">
                R
            </div>
            <div>
                <div style="font-size:1.25rem;font-weight:650;color:#0f172a;">
                    Research Paper Context Builder
                </div>
                <div style="font-size:0.85rem;color:#64748b;">
                    Choose a tool below: summarise PDFs, compare papers, or find citations for your own idea.
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown("---")

    tabs = st.tabs(["📄 Upload & summarise", "🧩 Compare papers", "🔍 Find citations from text"])

    # --- Tab 1: Summarise PDFs ---
    with tabs[0]:
        st.markdown(
            """
            <div style="background-color:#f8fafc;border-radius:0.9rem;padding:0.75rem 0.9rem;
                        border:1px solid #e2e8f0;margin-bottom:0.8rem;">
                <div style="font-size:0.85rem;font-weight:600;color:#0f172a;margin-bottom:0.3rem;">
                    Processing flow
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:0.4rem;font-size:0.8rem;color:#0f172a;">
                    <div style="background-color:#e0f2fe;border-radius:999px;padding:0.3rem 0.7rem;">1. Upload PDF</div>
                    <div>→</div>
                    <div style="background-color:#dcfce7;border-radius:999px;padding:0.3rem 0.7rem;">2. Extract & clean text</div>
                    <div>→</div>
                    <div style="background-color:#fee2e2;border-radius:999px;padding:0.3rem 0.7rem;">3. Build structured prompt</div>
                    <div>→</div>
                    <div style="background-color:#ede9fe;border-radius:999px;padding:0.3rem 0.7rem;">4. Gemini generates summary</div>
                    <div>→</div>
                    <div style="background-color:#fef3c7;border-radius:999px;padding:0.3rem 0.7rem;">5. Read context by section</div>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        st.subheader("Workspaces")
        st.caption("Each workspace is independent, so you can compare multiple papers side by side.")

        tab1, tab2, tab3 = st.tabs(["Paper 1", "Paper 2", "Paper 3"])

        with tab1:
            render_paper_workspace("paper1", "Workspace: Paper 1")

        with tab2:
            render_paper_workspace("paper2", "Workspace: Paper 2")

        with tab3:
            render_paper_workspace("paper3", "Workspace: Paper 3")

    # --- Tab 2: Compare existing summaries ---
    with tabs[1]:
        st.subheader("Compare papers")
        st.caption("Select at least two workspaces with generated summaries to see similarities and differences.")

        slots = [
            ("paper1", "Paper 1"),
            ("paper2", "Paper 2"),
            ("paper3", "Paper 3"),
        ]
        available = []
        for slot_id, label in slots:
            summary_key = f"summary_md_{slot_id}"
            if summary_key in st.session_state:
                available.append(
                    {
                        "id": slot_id,
                        "label": label,
                        "summary": st.session_state[summary_key],
                    }
                )

        if len(available) < 2:
            st.info("Generate summaries for at least two papers in the 'Upload & summarise' tab first.")
        else:
            option_labels = [p["label"] for p in available]
            selected_labels = st.multiselect(
                "Choose which papers to compare",
                options=option_labels,
                default=option_labels,
            )

            label_to_paper = {p["label"]: p for p in available}
            selected_papers = [label_to_paper[lbl] for lbl in selected_labels if lbl in label_to_paper]

            if len(selected_papers) < 2:
                st.warning("Select at least two papers for a meaningful comparison.")
            else:
                if st.button("Compare selected papers", type="primary", key="compare_button"):
                    with st.spinner("Generating comparison..."):
                        comparison_md = generate_comparison(selected_papers)
                    st.session_state["comparison_md"] = comparison_md

                if "comparison_md" in st.session_state:
                    st.markdown(
                        """
                        <div style="background-color:#f0f9ff;border-radius:0.6rem;
                                    padding:0.55rem 0.95rem;margin:0.4rem 0 0.6rem 0;
                                    border:1px solid #bae6fd;">
                            <span style="font-weight:650;color:#0369a1;">Comparison overview</span>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )
                    st.markdown(st.session_state["comparison_md"])

    # --- Tab 3: Find citations for a free‑text idea ---
    with tabs[2]:
        st.subheader("Find citations for your idea")
        st.caption(
            "Describe your research idea or paragraph in plain language. "
            "The tool will suggest recent, peer‑reviewed papers as starting points."
        )

        idea_text = st.text_area(
            "Describe your research idea or write a short paragraph:",
            height=180,
            placeholder="Example: Investigating how large language models can help clinicians summarise patient histories more accurately...",
        )

        col_a, col_b = st.columns([1, 3])
        with col_a:
            max_results = st.slider("Number of suggested papers", 3, 15, 8)
        with col_b:
            st.write("")

        if st.button("Find citations", type="primary", key="find_citations"):
            if not idea_text.strip():
                st.warning("Please enter a short description of your idea first.")
            else:
                with st.spinner("Searching for relevant papers..."):
                    raw_results = fetch_citations_from_semantic_scholar(idea_text, limit=max_results)
                    citations_md = format_citation_results(raw_results)
                st.session_state["citations_md"] = citations_md

        if "citations_md" in st.session_state:
            st.markdown(st.session_state["citations_md"])


if __name__ == "__main__":
    main()

