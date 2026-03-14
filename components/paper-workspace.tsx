"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Paper {
  text: string;
  summary: string;
  filename: string;
}

interface PaperWorkspaceProps {
  id: string;
  label: string;
  paper: Paper | null;
  onPaperUpdate: (paper: Paper | null) => void;
}

export default function PaperWorkspace({
  id,
  label,
  paper,
  onPaperUpdate,
}: PaperWorkspaceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/summarize", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to process PDF");
      }

      const data = await response.json();
      onPaperUpdate({
        text: "", // Text extraction handled by Gemini directly
        summary: data.summary,
        filename: data.filename || file.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50/50 to-slate-50 rounded-xl border border-indigo-100 p-4">
      <div className="mb-4">
        <h3 className="font-semibold text-indigo-900">Workspace: {label}</h3>
        <p className="text-sm text-slate-600">
          Upload a paper on the left and view its structured context on the right.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Left: Input Section */}
        <div className="bg-slate-100/80 rounded-lg p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-[var(--foreground)]">Inputs</h4>
            <p className="text-xs text-[var(--muted-foreground)]">
              Choose a PDF and optionally inspect the extracted text.
            </p>
          </div>

          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragActive
                ? "border-[var(--primary)] bg-indigo-50"
                : "border-slate-300 hover:border-[var(--primary)] hover:bg-slate-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="hidden"
            />
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                <p className="text-sm text-[var(--muted-foreground)]">
                  Processing PDF...
                </p>
              </div>
            ) : paper ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-emerald-600" />
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {paper.filename}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Click to upload a different PDF
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-[var(--muted-foreground)]" />
                <p className="text-sm text-[var(--foreground)]">
                  Drop a PDF here or click to browse
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Status indicator */}
          {paper && (
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
              <FileText className="w-4 h-4" />
              <span>PDF processed successfully</span>
            </div>
          )}
        </div>

        {/* Right: Summary Section */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
          <div className="mb-3">
            <h4 className="font-semibold text-orange-800">Context Summary</h4>
          </div>

          {paper?.summary ? (
            <div className="markdown-content prose prose-sm max-w-none">
              <ReactMarkdown>{paper.summary}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-sm text-[var(--muted-foreground)] bg-white/60 rounded-lg p-4">
              Upload a PDF to see the structured summary here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
