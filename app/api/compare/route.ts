import { generateText } from "ai";

interface Paper {
  id: string;
  label: string;
  summary: string;
}

export async function POST(req: Request) {
  const { papers } = await req.json();

  if (!papers || !Array.isArray(papers) || papers.length < 2) {
    return Response.json(
      { error: "At least two papers are required" },
      { status: 400 }
    );
  }

  const numberedBlocks = papers
    .map(
      (p: Paper, idx: number) =>
        `Paper ${idx + 1} (${p.label}):\n\n${p.summary}\n`
    )
    .join("\n\n");

  const prompt = `
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

Return the answer in Markdown with \`##\` headings for each section.

Paper summaries:
${numberedBlocks}
`;

  try {
    const result = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      temperature: 0.2,
    });

    return Response.json({ comparison: result.text });
  } catch (error) {
    console.error("Error generating comparison:", error);
    return Response.json(
      { error: "Failed to generate comparison" },
      { status: 500 }
    );
  }
}
