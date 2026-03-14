"use client";

import { useState } from "react";
import { Loader2, ExternalLink, BookOpen } from "lucide-react";

interface Citation {
  title: string;
  authors: { name: string }[];
  year: number | null;
  venue: string | null;
  doi: string | null;
  url: string | null;
  isOpenAccess: boolean;
}

export default function CitationsTab() {
  const [idea, setIdea] = useState("");
  const [maxResults, setMaxResults] = useState(8);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!idea.trim()) {
      setError("Please enter a research idea.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch("/api/find-citations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, limit: maxResults }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to find citations");
      }

      const data = await response.json();
      setCitations(data.citations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Find Citations for Your Idea
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Describe your research idea or paragraph in plain language. The tool will suggest recent, peer-reviewed papers as starting points.
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl border border-[var(--border)] p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Describe your research idea
          </label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Example: Investigating how large language models can help clinicians summarise patient histories more accurately..."
            className="w-full h-40 p-3 border border-[var(--border)] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Number of results
            </label>
            <input
              type="range"
              min={3}
              max={15}
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="w-32"
            />
            <span className="ml-2 text-sm text-[var(--muted-foreground)]">
              {maxResults}
            </span>
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 py-2.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-full font-semibold text-sm hover:bg-violet-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Find Citations
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {hasSearched && !isLoading && (
        <div className="bg-white rounded-xl border border-[var(--border)] p-4">
          <h3 className="font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Suggested Citations
          </h3>

          {citations.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              No matching papers were found for this query. Try rephrasing or broadening your idea.
            </p>
          ) : (
            <div className="space-y-4">
              {citations.map((citation, index) => (
                <div
                  key={index}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <h4 className="font-medium text-[var(--foreground)]">
                    {citation.title || "Untitled"}
                    {citation.year && (
                      <span className="ml-2 text-sm text-[var(--muted-foreground)]">
                        ({citation.year})
                      </span>
                    )}
                  </h4>

                  {citation.authors && citation.authors.length > 0 && (
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                      {citation.authors
                        .slice(0, 4)
                        .map((a) => a.name)
                        .join(", ")}
                      {citation.authors.length > 4 && " et al."}
                    </p>
                  )}

                  {citation.venue && (
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Venue: {citation.venue}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    {citation.doi && (
                      <span className="text-xs bg-slate-200 px-2 py-1 rounded font-mono">
                        DOI: {citation.doi}
                      </span>
                    )}
                    {citation.isOpenAccess && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                        Open Access
                      </span>
                    )}
                    {citation.url && (
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--primary)] flex items-center gap-1 hover:underline"
                      >
                        View Paper <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}

              <p className="text-xs text-[var(--muted-foreground)] italic mt-4">
                These suggestions come from the Semantic Scholar API and are intended as a starting point. Always read and verify each paper before citing it.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
