"use client";

import { useState, useCallback } from "react";
import { FileText, GitCompare, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaperWorkspace } from "@/components/paper-workspace";
import { PaperCompare } from "@/components/paper-compare";
import { CitationFinder } from "@/components/citation-finder";

type Tab = "summarize" | "compare" | "citations";
type PaperTab = "paper1" | "paper2" | "paper3";

interface PaperSummary {
  id: string;
  label: string;
  summary: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("summarize");
  const [activePaper, setActivePaper] = useState<PaperTab>("paper1");
  const [summaries, setSummaries] = useState<Record<string, PaperSummary>>({});

  const handleSummaryGenerated = useCallback(
    (id: string, summary: string, label: string) => {
      setSummaries((prev) => ({
        ...prev,
        [id]: { id, label, summary },
      }));
    },
    []
  );

  const paperSummariesArray = Object.values(summaries);

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#0ea5e9] text-lg font-bold text-white">
            R
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#0f172a]">
              Research Paper Context Builder
            </h1>
            <p className="text-sm text-[#64748b]">
              Choose a tool below: summarise PDFs, compare papers, or find
              citations for your own idea.
            </p>
          </div>
        </div>

        <hr className="mb-6 border-[#e2e8f0]" />

        {/* Main Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("summarize")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "summarize"
                ? "bg-[#4f46e5] text-white"
                : "bg-white text-[#0f172a] hover:bg-[#f1f5f9]"
            )}
          >
            <FileText className="h-4 w-4" />
            Upload & summarise
          </button>
          <button
            onClick={() => setActiveTab("compare")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "compare"
                ? "bg-[#4f46e5] text-white"
                : "bg-white text-[#0f172a] hover:bg-[#f1f5f9]"
            )}
          >
            <GitCompare className="h-4 w-4" />
            Compare papers
          </button>
          <button
            onClick={() => setActiveTab("citations")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "citations"
                ? "bg-[#4f46e5] text-white"
                : "bg-white text-[#0f172a] hover:bg-[#f1f5f9]"
            )}
          >
            <Search className="h-4 w-4" />
            Find citations from text
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "summarize" && (
          <div className="space-y-6">
            {/* Processing Flow */}
            <div className="rounded-xl border bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-[#0f172a]">
                Processing flow
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-[#e0f2fe] px-3 py-1">
                  1. Upload PDF
                </span>
                <span className="text-[#64748b]">&rarr;</span>
                <span className="rounded-full bg-[#dcfce7] px-3 py-1">
                  2. Extract & clean text
                </span>
                <span className="text-[#64748b]">&rarr;</span>
                <span className="rounded-full bg-[#fee2e2] px-3 py-1">
                  3. Build structured prompt
                </span>
                <span className="text-[#64748b]">&rarr;</span>
                <span className="rounded-full bg-[#ede9fe] px-3 py-1">
                  4. AI generates summary
                </span>
                <span className="text-[#64748b]">&rarr;</span>
                <span className="rounded-full bg-[#fef3c7] px-3 py-1">
                  5. Read context by section
                </span>
              </div>
            </div>

            {/* Workspaces Header */}
            <div>
              <h2 className="text-xl font-semibold text-[#0f172a]">Workspaces</h2>
              <p className="text-sm text-[#64748b]">
                Each workspace is independent, so you can compare multiple papers
                side by side.
              </p>
            </div>

            {/* Paper Tabs */}
            <div className="flex gap-2">
              {(["paper1", "paper2", "paper3"] as PaperTab[]).map(
                (paper, index) => (
                  <button
                    key={paper}
                    onClick={() => setActivePaper(paper)}
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      activePaper === paper
                        ? "bg-[#e9d5ff] text-[#312e81]"
                        : "bg-white text-[#0f172a] hover:bg-[#f1f5f9]"
                    )}
                  >
                    Paper {index + 1}
                    {summaries[paper] && (
                      <span className="ml-2 inline-block h-2 w-2 rounded-full bg-green-500" />
                    )}
                  </button>
                )
              )}
            </div>

            {/* Active Paper Workspace */}
            <PaperWorkspace
              id={activePaper}
              title={`Workspace: Paper ${activePaper.replace("paper", "")}`}
              onSummaryGenerated={handleSummaryGenerated}
            />
          </div>
        )}

        {activeTab === "compare" && (
          <PaperCompare papers={paperSummariesArray} />
        )}

        {activeTab === "citations" && <CitationFinder />}
      </div>
    </main>
  );
}
