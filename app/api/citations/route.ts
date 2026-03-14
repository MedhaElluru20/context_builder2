interface SemanticScholarPaper {
  paperId?: string;
  title?: string;
  authors?: { name?: string }[];
  year?: number;
  venue?: string;
  doi?: string;
  url?: string;
  isOpenAccess?: boolean;
}

async function runQuery(
  query: string,
  limit: number
): Promise<SemanticScholarPaper[]> {
  const cleanQuery = query.split(/\s+/).join(" ").trim();
  if (!cleanQuery) return [];

  const params = new URLSearchParams({
    query: cleanQuery,
    limit: String(limit),
    fields: "title,authors,year,venue,doi,url,isOpenAccess",
  });

  try {
    const resp = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?${params}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!resp.ok) return [];
    const data = await resp.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const { ideaText, limit = 8 } = await req.json();

  if (!ideaText || typeof ideaText !== "string") {
    return Response.json({ error: "No idea text provided" }, { status: 400 });
  }

  const trimmed = ideaText.trim();
  const queries: string[] = [];

  // Full idea (truncated)
  if (trimmed) {
    queries.push(trimmed.slice(0, 400));
  }

  // First sentence
  const sepIdx = Math.min(
    ...[trimmed.indexOf("."), trimmed.indexOf("?"), trimmed.indexOf("!")].filter(
      (i) => i !== -1
    )
  );
  if (sepIdx !== Infinity && sepIdx !== -1) {
    queries.push(trimmed.slice(0, sepIdx + 1));
  }

  // First 15 words
  const words = trimmed.split(/\s+/);
  if (words.length > 0) {
    queries.push(words.slice(0, 15).join(" "));
  }

  const seenIds = new Set<string>();
  const combinedResults: SemanticScholarPaper[] = [];

  for (const q of queries) {
    if (combinedResults.length >= limit) break;

    const results = await runQuery(q, limit);
    for (const paper of results) {
      const paperId = paper.paperId || paper.doi || paper.url;
      if (!paperId || seenIds.has(paperId)) continue;

      seenIds.add(paperId);
      combinedResults.push(paper);

      if (combinedResults.length >= limit) break;
    }
  }

  // Sort by year descending
  combinedResults.sort((a, b) => (b.year || 0) - (a.year || 0));

  return Response.json({ citations: combinedResults });
}
