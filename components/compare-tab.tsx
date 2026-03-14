"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Paper {
  text: string;
  summary: string;
  filename: string;
}

interface CompareTabProps {
  papers: { [key: string]: Paper | null };
}

export default function CompareTab({ papers }: CompareTabProps) {
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  const [comparison, setComparison] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availablePapers = Object.entries(papers)
    .filter(([, paper]) => paper !== null)
    .map(([id, paper]) => ({
      id,
      label: id === "paper1" ? "Paper 1" : id === "paper2" ? "Paper 2" : "Paper 3",
      filename: paper!.filename,
      summary: paper!.summary,
    }));

  const togglePaper = (id: string) => {
    setSelectedPapers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleCompare = async () => {
    if (selectedPapers.length < 2) {
      setError("Please select at least 2 papers to compare.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const papersToCompare = selectedPapers.map((id) => {
        const paper = availablePapers.find((p) => p.id === id)!;
        return {
          label: paper.label,
          summary: paper.summary,
        };
      });

      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ papers: papersToCompare }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to compare papers");
      }

      const data = await response.json();
      setComparison(data.comparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (availablePapers.length < 2) {
    return (
      <div className="bg-white rounded-xl border border-[var(--border)] p-8 text-center">
        <p className="text-[var(--muted-foreground)]">
          Generate summaries for at least two papers in the &quot;Upload &amp; Summarise&quot; tab first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Compare Papers
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Select at least two papers with generated summaries to see similarities and differences.
        </p>
      </div>

      {/* Paper Selection */}
      <div className="bg-white rounded-xl border border-[var(--border)] p-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
          Select papers to compare
        </h3>
        <div className="flex flex-wrap gap-3">
          {availablePapers.map((paper) => (
            <button
              key={paper.id}
              onClick={() => togglePaper(paper.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPapers.includes(paper.id)
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-slate-200"
              }`}
            >
              {paper.label}: {paper.filename}
            </button>
          ))}
        </div>

        <button
          onClick={handleCompare}
          disabled={isLoading || selectedPapers.length < 2}
          className="mt-4 px-6 py-2.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-full font-semibold text-sm hover:bg-violet-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Compare Selected Papers
        </button>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
            {error}
          </div>
        )}
      </div>

      {/* Comparison Result */}
      {comparison && (
        <div className="bg-sky-50 rounded-xl border border-sky-200 p-4">
          <h3 className="font-semibold text-sky-800 mb-4">Comparison Overview</h3>
          <div className="markdown-content prose prose-sm max-w-none">
            <ReactMarkdown>{comparison}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
