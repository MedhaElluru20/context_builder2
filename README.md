# Research Paper Context Builder

A Next.js web application that helps you quickly understand research papers by generating structured AI-powered summaries.

## Features

- **PDF Upload & Summarize**: Upload research papers and get AI-generated structured summaries with Key Findings, Evidence & Methodology, Limitations, Future Work, and Practical Implications
- **Compare Papers**: Compare multiple papers side-by-side to identify similarities, differences, and complementary insights
- **Find Citations**: Search for related academic papers using the Semantic Scholar API

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

The app uses the Vercel AI Gateway by default, which requires no additional configuration when deployed on Vercel.

## Tech Stack

- Next.js 16
- React 19
- AI SDK 6
- Tailwind CSS 4
- PDF.js for PDF parsing
