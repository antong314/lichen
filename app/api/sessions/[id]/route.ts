import { sql } from "@/lib/db";

export async function GET(_req: Request, ctx: RouteContext<"/api/sessions/[id]">) {
  const { id } = await ctx.params;
  const [session] = await sql`
    select id, couple_id, started_at, ended_at
    from sessions
    where id = ${id}
  `;
  if (!session) return Response.json({ error: "Not found" }, { status: 404 });
  const rounds = await sql`
    select id, ordinal, type, prompt_id, prompt_text, answering_player, answer_text, scores, receiver_tiebreaker, created_at
    from rounds
    where session_id = ${id}
    order by ordinal
  `;
  return Response.json({ session, rounds });
}
