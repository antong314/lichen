import { sql } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const coupleId = url.searchParams.get("couple_id");
  if (!coupleId) return Response.json({ error: "couple_id required" }, { status: 400 });
  const rows = await sql`
    select id, kind, content, source_round_id, created_at
    from memory_entries
    where couple_id = ${coupleId}
    order by created_at desc
  `;
  return Response.json(rows);
}
