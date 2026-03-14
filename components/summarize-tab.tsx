"use client";

import { useState } from "react";
import PaperWorkspace from "./paper-workspace";

interface Paper {
  text: string;
  summary: string;
  filename: string;
}

interface SummarizeTabProps {
  papers: { [key: string]: Paper | null };
  setPapers: React.Dispatch<React.SetStateAction<{ [key: string]: Paper | null }>>;
}

export default function SummarizeTab({ papers, setPapers }: SummarizeTabProps) {
  const [activeWorkspace, setActiveWorkspace] = useState("paper1");

  const workspaces = [
    { id: "paper1", label: "Paper 1" },
    { id: "paper2", label: "Paper 2" },
    { id: "paper3", label: "Paper 3" },
  ];

  const updatePaper = (id: string, paper: Paper | null) => {
    setPapers((prev) => ({ ...prev, [id]: paper }));
  };

  return (
    <div className="space-y-6">
      {/* Processing Flow */}
      <div className="bg-white rounded-xl border border-[var(--border)] p-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
          Processing Flow
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="bg-sky-100 text-sky-800 px-3 py-1.5 rounded-full">
            1. Upload PDF
          </span>
          <span className="text-[var(--muted-foreground)]">→</span>
          <span className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full">
            2. Extract text
          </span>
          <span className="text-[var(--muted-foreground)]">→</span>
          <span className="bg-rose-100 text-rose-800 px-3 py-1.5 rounded-full">
            3. Build prompt
          </span>
          <span className="text-[var(--muted-foreground)]">→</span>
          <span className="bg-violet-100 text-violet-800 px-3 py-1.5 rounded-full">
            4. Gemini summary
          </span>
          <span className="text-[var(--muted-foreground)]">→</span>
          <span className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full">
            5. Read by section
          </span>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Workspaces
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Each workspace is independent, so you can compare multiple papers side by side.
        </p>

        <div className="flex gap-2 mb-4">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => setActiveWorkspace(ws.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeWorkspace === ws.id
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-slate-200"
              }`}
            >
              {ws.label}
              {papers[ws.id] && (
                <span className="ml-2 w-2 h-2 bg-emerald-400 rounded-full inline-block" />
              )}
            </button>
          ))}
        </div>

        {/* Active Workspace */}
        <PaperWorkspace
          id={activeWorkspace}
          label={workspaces.find((w) => w.id === activeWorkspace)?.label || ""}
          paper={papers[activeWorkspace]}
          onPaperUpdate={(paper) => updatePaper(activeWorkspace, paper)}
        />
      </div>
    </div>
  );
}
