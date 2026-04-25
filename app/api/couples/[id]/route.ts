import { sql } from "@/lib/db";

export async function GET(_req: Request, ctx: RouteContext<"/api/couples/[id]">) {
  const { id } = await ctx.params;
  const [row] = await sql`
    select id, player_a_name, player_b_name, created_at
    from couples
    where id = ${id}
  `;
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/couples/[id]">) {
  const { id } = await ctx.params;
  await sql`delete from couples where id = ${id}`;
  return new Response(null, { status: 204 });
}
