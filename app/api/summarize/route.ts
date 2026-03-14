import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Use Gemini to extract and summarize the PDF
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: base64
                }
              },
              {
                text: `You are an expert academic research assistant. Analyze this research paper and provide a comprehensive structured summary.

Please provide:
1. **Title**: The paper's title
2. **Authors**: List of authors (if identifiable)
3. **Abstract Summary**: A concise 2-3 sentence summary of the abstract
4. **Research Problem**: What problem or question does this research address?
5. **Methodology**: Describe the research methods, data sources, and analytical approaches used
6. **Key Findings**: List the main findings and results (bullet points)
7. **Contributions**: What are the novel contributions of this work?
8. **Limitations**: Any limitations mentioned or apparent
9. **Future Work**: Suggested future research directions
10. **Keywords**: 5-7 key terms that capture the essence of this paper

Format your response clearly with these section headers.`
              }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[v0] Gemini API error:', errorText);
      return NextResponse.json({ error: 'Failed to process PDF with AI' }, { status: 500 });
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate summary';

    return NextResponse.json({ summary, filename: file.name });
  } catch (error) {
    console.error('[v0] Summarize error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
