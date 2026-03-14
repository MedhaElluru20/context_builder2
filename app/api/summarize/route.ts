import { generateText } from "ai";

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return Response.json({ error: "No text provided" }, { status: 400 });
  }

  const maxChars = 12000;
  const trimmedText = text.slice(0, maxChars);

  const prompt = `
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

Return the answer in **Markdown** with \`##\` headings for each section, clean spacing, and no duplicated headings.

Paper text:
"""${trimmedText}"""
`;

  try {
    const result = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      temperature: 0.2,
    });

    return Response.json({ summary: result.text });
  } catch (error) {
    console.error("Error generating summary:", error);
    return Response.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
