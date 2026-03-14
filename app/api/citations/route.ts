import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 });
    }

    // Search Semantic Scholar API
    const searchUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=20&fields=paperId,title,abstract,authors,year,citationCount,url,openAccessPdf,venue,publicationTypes`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.error('[v0] Semantic Scholar error:', response.status);
      return NextResponse.json({ error: 'Failed to search citations' }, { status: 500 });
    }

    const data = await response.json();
    
    const papers = (data.data || []).map((paper: any) => ({
      id: paper.paperId,
      title: paper.title,
      abstract: paper.abstract,
      authors: paper.authors?.map((a: any) => a.name) || [],
      year: paper.year,
      citationCount: paper.citationCount || 0,
      url: paper.url,
      pdfUrl: paper.openAccessPdf?.url,
      venue: paper.venue,
      publicationTypes: paper.publicationTypes
    }));

    return NextResponse.json({ papers, total: data.total || papers.length });
  } catch (error) {
    console.error('[v0] Citations error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
