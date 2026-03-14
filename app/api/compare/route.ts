import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

interface PaperSummary {
  label: string;
  summary: string;
}

export async function POST(request: NextRequest) {
  try {
    const { papers } = await request.json() as { papers: PaperSummary[] };
    
    if (!papers || papers.length < 2) {
      return NextResponse.json({ error: 'At least 2 papers required for comparison' }, { status: 400 });
    }

    if (papers.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 papers allowed' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Build the comparison prompt with all paper summaries
    const paperSummaries = papers.map((p, i) => 
      `=== ${p.label} ===\n${p.summary}`
    ).join('\n\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert academic research analyst. Compare and contrast these ${papers.length} research papers based on their summaries.

Here are the paper summaries:

${paperSummaries}

Provide a detailed comparative analysis including:

1. **Overview**: Brief description of each paper's focus
2. **Research Questions**: Compare the research questions or hypotheses
3. **Methodological Comparison**: Compare the methods, data sources, and analytical approaches
4. **Findings Comparison**: Compare and contrast the main findings
5. **Theoretical Frameworks**: Compare the theoretical underpinnings
6. **Strengths and Weaknesses**: Relative strengths and weaknesses of each paper
7. **Complementary Aspects**: How these papers complement each other
8. **Contradictions**: Any contradictory findings or claims
9. **Research Gaps**: Gaps that remain unaddressed across all papers
10. **Synthesis**: A synthesized understanding combining insights from all papers

Format your response with clear headers and use paper identifiers (Paper 1, Paper 2, etc.) when making comparisons.`
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[v0] Gemini comparison error:', errorText);
      return NextResponse.json({ error: 'Failed to compare papers with AI' }, { status: 500 });
    }

    const data = await response.json();
    const comparison = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate comparison';

    return NextResponse.json({ comparison });
  } catch (error) {
    console.error('[v0] Compare error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
