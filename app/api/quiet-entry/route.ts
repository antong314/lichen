import { sql } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const roundId = body.round_id as string;
  const player = body.player as "a" | "b";
  const photoDataUrl = body.photo_data_url as string;
  const voiceNoteText = (body.voice_note_text ?? null) as string | null;

  if (!roundId || !player || !photoDataUrl) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [row] = await sql`
    insert into quiet_round_entries (round_id, player, photo_data_url, voice_note_text)
    values (${roundId}, ${player}, ${photoDataUrl}, ${voiceNoteText})
    returning id, player, photo_data_url, voice_note_text
  `;
  return Response.json(row);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const roundId = url.searchParams.get("round_id");
  if (!roundId) return Response.json({ error: "round_id required" }, { status: 400 });
  const rows = await sql`
    select id, player, photo_data_url, voice_note_text, created_at
    from quiet_round_entries
    where round_id = ${roundId}
    order by created_at
  `;
  return Response.json(rows);
}
