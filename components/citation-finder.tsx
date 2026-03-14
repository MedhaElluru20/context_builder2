"use client";

import { useState, useCallback } from "react";
import { Loader2, ExternalLink } from "lucide-react";

interface Citation {
  paperId?: string;
  title?: string;
  authors?: { name?: string }[];
  year?: number;
  venue?: string;
  doi?: string;
  url?: string;
  isOpenAccess?: boolean;
}

export function CitationFinder() {
  const [ideaText, setIdeaText] = useState("");
  const [maxResults, setMaxResults] = useState(8);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!ideaText.trim()) return;

    setIsSearching(true);
    setError("");
    setHasSearched(true);

    try {
      const response = await fetch("/api/citations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaText, limit: maxResults }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch citations");
      }

      setCitations(data.citations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch citations");
      setCitations([]);
    } finally {
      setIsSearching(false);
    }
  }, [ideaText, maxResults]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#0f172a]">
          Find citations for your idea
        </h2>
        <p className="mt-1 text-sm text-[#64748b]">
          Describe your research idea or paragraph in plain language. The tool
          will suggest recent, peer-reviewed papers as starting points.
        </p>
      </div>

      <textarea
        value={ideaText}
        onChange={(e) => setIdeaText(e.target.value)}
        placeholder="Example: Investigating how large language models can help clinicians summarise patient histories more accurately..."
        className="h-44 w-full rounded-lg border bg-white p-4 text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#4f46e5] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]"
      />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[#0f172a]">
            Number of suggested papers
          </label>
          <input
            type="range"
            min={3}
            max={15}
            value={maxResults}
            onChange={(e) => setMaxResults(Number(e.target.value))}
            className="w-32 accent-[#4f46e5]"
          />
          <span className="w-6 text-sm font-medium text-[#0f172a]">
            {maxResults}
          </span>
        </div>

        <button
          onClick={handleSearch}
          disabled={isSearching || !ideaText.trim()}
          className="flex items-center gap-2 rounded-full bg-[#e9d5ff] px-6 py-2.5 font-semibold text-[#312e81] transition-colors hover:bg-[#ddd6fe] disabled:opacity-50"
        >
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            "Find Citations"
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {hasSearched && !isSearching && citations.length === 0 && !error && (
        <div className="rounded-lg bg-[#fef3c7] p-4 text-sm text-[#92400e]">
          No matching papers were found for this query. Try rephrasing or
          broadening your idea.
        </div>
      )}

      {citations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#0f172a]">
            Suggested Citations
          </h3>

          <div className="space-y-3">
            {citations.map((paper, index) => {
              const authorNames =
                paper.authors
                  ?.slice(0, 4)
                  .map((a) => a.name)
                  .filter(Boolean)
                  .join(", ") || "";
              const hasMoreAuthors = (paper.authors?.length || 0) > 4;

              return (
                <div
                  key={paper.paperId || index}
                  className="rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <h4 className="font-semibold text-[#0f172a]">
                        {paper.title || "Untitled"}{" "}
                        <span className="font-normal text-[#64748b]">
                          ({paper.year || "n.d."})
                        </span>
                      </h4>

                      {authorNames && (
                        <p className="text-sm text-[#64748b]">
                          Authors: {authorNames}
                          {hasMoreAuthors && " et al."}
                        </p>
                      )}

                      <p className="text-sm text-[#64748b]">
                        Venue: {paper.venue || "Venue not specified"}
                      </p>

                      {paper.doi && (
                        <p className="text-sm text-[#64748b]">
                          DOI: <code className="text-[#4f46e5]">{paper.doi}</code>
                        </p>
                      )}
                    </div>

                    {paper.url && (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg bg-[#f1f5f9] px-3 py-1.5 text-sm font-medium text-[#0f172a] transition-colors hover:bg-[#e2e8f0]"
                      >
                        View
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-sm text-[#64748b] italic">
            These suggestions come from the Semantic Scholar API and are intended
            as a starting point. Always read and verify each paper before citing
            it.
          </p>
        </div>
      )}
    </div>
  );
}
