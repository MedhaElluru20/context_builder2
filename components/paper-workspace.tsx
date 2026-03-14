"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaperWorkspaceProps {
  id: string;
  title: string;
  onSummaryGenerated: (id: string, summary: string, label: string) => void;
}

export function PaperWorkspace({
  id,
  title,
  onSummaryGenerated,
}: PaperWorkspaceProps) {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      setFile(selectedFile);
      setError("");
      setSummary("");
      setIsExtracting(true);

      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const response = await fetch("/api/parse-pdf", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to parse PDF");
        }

        if (!data.text?.trim()) {
          throw new Error(
            "Could not extract text from this PDF. It may be scanned or image-only."
          );
        }

        setExtractedText(data.text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse PDF");
        setExtractedText("");
      } finally {
        setIsExtracting(false);
      }
    },
    []
  );

  const handleGenerateSummary = useCallback(async () => {
    if (!extractedText) return;

    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }

      setSummary(data.summary);
      onSummaryGenerated(id, data.summary, file?.name || title);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate summary"
      );
    } finally {
      setIsGenerating(false);
    }
  }, [extractedText, id, file, title, onSummaryGenerated]);

  return (
    <div className="rounded-xl border bg-gradient-to-r from-[#eff3ff] to-[#fdfbff] p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#1e3a8a]">{title}</h3>
        <p className="text-sm text-[#475569]">
          Upload a paper on the left and view its structured context on the
          right.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Left Column - Inputs */}
        <div className="space-y-4">
          <div className="rounded-lg bg-[#f1f5f9] p-4">
            <h4 className="text-sm font-semibold text-[#0f172a]">Inputs</h4>
            <p className="mt-1 text-xs text-[#64748b]">
              Choose a PDF and (optionally) inspect the extracted text before
              creating the summary.
            </p>
          </div>

          {/* File Upload */}
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
              file
                ? "border-[#4f46e5] bg-[#f5f3ff]"
                : "border-[#cbd5e1] bg-white hover:border-[#4f46e5] hover:bg-[#f8fafc]"
            )}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {isExtracting ? (
              <Loader2 className="h-8 w-8 animate-spin text-[#4f46e5]" />
            ) : file ? (
              <FileText className="h-8 w-8 text-[#4f46e5]" />
            ) : (
              <Upload className="h-8 w-8 text-[#64748b]" />
            )}
            <span className="mt-2 text-sm font-medium text-[#0f172a]">
              {isExtracting
                ? "Extracting text..."
                : file
                  ? file.name
                  : "Upload a PDF"}
            </span>
            {!file && (
              <span className="mt-1 text-xs text-[#64748b]">
                Click or drag and drop
              </span>
            )}
          </label>

          {/* Show Raw Text Toggle */}
          {extractedText && (
            <button
              onClick={() => setShowRawText(!showRawText)}
              className="flex w-full items-center justify-between rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#0f172a] shadow-sm transition-colors hover:bg-[#f8fafc]"
            >
              <span>Show extracted text preview</span>
              {showRawText ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}

          {showRawText && extractedText && (
            <textarea
              readOnly
              value={extractedText}
              className="h-64 w-full rounded-lg border bg-white p-3 text-sm text-[#0f172a]"
            />
          )}

          {/* Generate Button */}
          {extractedText && (
            <button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#e9d5ff] px-4 py-2.5 font-semibold text-[#312e81] transition-colors hover:bg-[#ddd6fe] disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Context Summary"
              )}
            </button>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Info Message */}
          {!file && !error && (
            <div className="rounded-lg bg-[#e0f2fe] p-3 text-sm text-[#0369a1]">
              Upload a PDF in this workspace to get started.
            </div>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-4">
          <div className="rounded-lg bg-gradient-to-r from-[#fff7ed] to-[#fffbeb] border border-[#fed7aa] px-4 py-2">
            <span className="font-semibold text-[#9a3412]">Context Summary</span>
          </div>

          <div className="min-h-[300px] rounded-lg border bg-white p-4">
            {summary ? (
              <div
                className="prose prose-sm max-w-none prose-headings:text-[#0f172a] prose-p:text-[#334155] prose-li:text-[#334155]"
                dangerouslySetInnerHTML={{
                  __html: summary
                    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
                    .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n\n/g, '<br/>')
                }}
              />
            ) : (
              <div className="flex h-full min-h-[250px] items-center justify-center text-sm text-[#64748b]">
                Click <strong className="mx-1">Generate Context Summary</strong> after uploading a
                PDF to see the structured summary here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
