import { transcribeAudio } from "@/lib/groq";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("audio");
  if (!(file instanceof File)) {
    return Response.json({ error: "audio file required" }, { status: 400 });
  }
  try {
    const text = await transcribeAudio(file);
    return Response.json({ text });
  } catch (err) {
    console.error("Transcription failed:", err);
    return Response.json({ error: "Transcription failed" }, { status: 500 });
  }
}
