"use client";

import { useState, useCallback } from "react";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Paper {
  id: string;
  label: string;
  summary: string;
}

interface PaperCompareProps {
  papers: Paper[];
}

export function PaperCompare({ papers }: PaperCompareProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    papers.map((p) => p.id)
  );
  const [comparison, setComparison] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState("");

  const togglePaper = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

  const handleCompare = useCallback(async () => {
    const selectedPapers = papers.filter((p) => selectedIds.includes(p.id));

    if (selectedPapers.length < 2) return;

    setIsComparing(true);
    setError("");

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ papers: selectedPapers }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate comparison");
      }

      setComparison(data.comparison);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate comparison"
      );
    } finally {
      setIsComparing(false);
    }
  }, [papers, selectedIds]);

  if (papers.length < 2) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-[#0f172a]">Compare papers</h2>
          <p className="mt-1 text-sm text-[#64748b]">
            Select at least two workspaces with generated summaries to see
            similarities and differences.
          </p>
        </div>

        <div className="rounded-lg bg-[#e0f2fe] p-4 text-sm text-[#0369a1]">
          Generate summaries for at least two papers in the &quot;Upload &
          summarise&quot; tab first.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#0f172a]">Compare papers</h2>
        <p className="mt-1 text-sm text-[#64748b]">
          Select at least two workspaces with generated summaries to see
          similarities and differences.
        </p>
      </div>

      {/* Paper Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#0f172a]">
          Choose which papers to compare
        </label>
        <div className="flex flex-wrap gap-2">
          {papers.map((paper) => {
            const isSelected = selectedIds.includes(paper.id);
            return (
              <button
                key={paper.id}
                onClick={() => togglePaper(paper.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-[#4f46e5] text-white"
                    : "bg-[#f1f5f9] text-[#0f172a] hover:bg-[#e2e8f0]"
                )}
              >
                {isSelected && <Check className="h-4 w-4" />}
                {paper.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Warning if less than 2 selected */}
      {selectedIds.length < 2 && (
        <div className="rounded-lg bg-[#fef3c7] p-3 text-sm text-[#92400e]">
          Select at least two papers for a meaningful comparison.
        </div>
      )}

      {/* Compare Button */}
      <button
        onClick={handleCompare}
        disabled={isComparing || selectedIds.length < 2}
        className="flex items-center gap-2 rounded-full bg-[#e9d5ff] px-6 py-2.5 font-semibold text-[#312e81] transition-colors hover:bg-[#ddd6fe] disabled:opacity-50"
      >
        {isComparing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Comparing...
          </>
        ) : (
          "Compare selected papers"
        )}
      </button>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[#f0f9ff] border border-[#bae6fd] px-4 py-2">
            <span className="font-semibold text-[#0369a1]">
              Comparison overview
            </span>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div
              className="prose prose-sm max-w-none prose-headings:text-[#0f172a] prose-p:text-[#334155] prose-li:text-[#334155]"
              dangerouslySetInnerHTML={{
                __html: comparison
                  .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
                  .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n\n/g, '<br/>')
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
