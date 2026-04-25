import { sql } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const a = (body.player_a_name ?? "").toString().trim();
  const b = (body.player_b_name ?? "").toString().trim();
  if (!a || !b) {
    return Response.json({ error: "Both names required" }, { status: 400 });
  }
  const [row] = await sql`
    insert into couples (player_a_name, player_b_name)
    values (${a}, ${b})
    returning id, player_a_name, player_b_name, created_at
  `;
  return Response.json(row);
}
