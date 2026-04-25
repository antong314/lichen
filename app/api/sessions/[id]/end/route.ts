import { sql } from "@/lib/db";

export async function POST(_req: Request, ctx: RouteContext<"/api/sessions/[id]/end">) {
  const { id } = await ctx.params;
  await sql`update sessions set ended_at = now() where id = ${id} and ended_at is null`;
  return new Response(null, { status: 204 });
}
