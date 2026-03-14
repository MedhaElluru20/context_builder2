"use client";

import { useState } from "react";
import { FileText, GitCompare, Search } from "lucide-react";
import SummarizeTab from "@/components/summarize-tab";
import CompareTab from "@/components/compare-tab";
import CitationsTab from "@/components/citations-tab";

type Tab = "summarize" | "compare" | "citations";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("summarize");
  const [papers, setPapers] = useState<{
    [key: string]: { text: string; summary: string; filename: string } | null;
  }>({
    paper1: null,
    paper2: null,
    paper3: null,
  });

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "summarize", label: "Upload & Summarise", icon: <FileText className="w-4 h-4" /> },
    { id: "compare", label: "Compare Papers", icon: <GitCompare className="w-4 h-4" /> },
    { id: "citations", label: "Find Citations", icon: <Search className="w-4 h-4" /> },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-200">
              R
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[var(--foreground)]">
                Research Paper Context Builder
              </h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Summarise PDFs, compare papers, or find citations for your ideas
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex gap-2 border-b border-[var(--border)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "summarize" && (
          <SummarizeTab papers={papers} setPapers={setPapers} />
        )}
        {activeTab === "compare" && <CompareTab papers={papers} />}
        {activeTab === "citations" && <CitationsTab />}
      </div>
    </main>
  );
}
