import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

// Disable worker in serverless environment
GlobalWorkerOptions.workerSrc = "";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const pdf = await getDocument({
      data: uint8Array,
      useSystemFonts: true,
      disableFontFace: true,
    }).promise;

    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      textParts.push(pageText);
    }

    // Clean and join text
    const cleanedText = textParts
      .join("\n\n")
      .split(/\n+/)
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .join("\n\n");

    return Response.json({ text: cleanedText });
  } catch (error) {
    console.error("Error parsing PDF:", error);
    return Response.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}
