import pdf from "pdf-parse";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdf(buffer);

    // Clean and join text
    const cleanedText = data.text
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
