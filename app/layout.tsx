import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Research Paper Context Builder",
  description: "Summarise PDFs, compare papers, and find citations for your research ideas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)]">{children}</body>
    </html>
  );
}
