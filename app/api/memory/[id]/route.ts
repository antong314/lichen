import { sql } from "@/lib/db";

export async function DELETE(_req: Request, ctx: RouteContext<"/api/memory/[id]">) {
  const { id } = await ctx.params;
  await sql`delete from memory_entries where id = ${id}`;
  return new Response(null, { status: 204 });
}
