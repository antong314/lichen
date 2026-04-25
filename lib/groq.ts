import Groq from "groq-sdk";

let _client: Groq | null = null;
function client(): Groq {
  if (!_client) _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _client;
}

export async function transcribeAudio(file: File): Promise<string> {
  const result = await client().audio.transcriptions.create({
    file,
    model: "whisper-large-v3-turbo",
    response_format: "text",
  });
  return typeof result === "string" ? result : (result as { text: string }).text;
}
