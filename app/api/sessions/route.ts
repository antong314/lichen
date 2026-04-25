import { sql } from "@/lib/db";
import { planSession, fillMemoryPromptTemplate } from "@/lib/rounds";
import { loadRoundType } from "@/lib/prompts";

export async function POST(req: Request) {
  const body = await req.json();
  const coupleId = body.couple_id as string;
  if (!coupleId) {
    return Response.json({ error: "couple_id required" }, { status: 400 });
  }

  const [couple] = await sql<{ player_a_name: string; player_b_name: string }[]>`
    select player_a_name, player_b_name from couples where id = ${coupleId}
  `;
  if (!couple) return Response.json({ error: "Couple not found" }, { status: 404 });

  const [{ count }] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from rounds r
    join sessions s on s.id = r.session_id
    where s.couple_id = ${coupleId}
  `;
  const memEntries = await sql<{ id: string; kind: string; content: string }[]>`
    select id, kind, content
    from memory_entries
    where couple_id = ${coupleId}
    order by random()
    limit 10
  `;

  const plan = planSession({ hasMemory: memEntries.length > 0, totalPriorRounds: count });

  // Resolve memory rounds with concrete entries.
  const memoryDef = loadRoundType("memory");
  const usedMemIds = new Set<string>();
  for (const round of plan) {
    if (round.type !== "memory") continue;
    const entry = memEntries.find((e) => !usedMemIds.has(e.id));
    if (!entry) continue;
    usedMemIds.add(entry.id);
    const template = memoryDef.promptTemplates?.find((t) => t.id === entry.kind);
    if (!template) continue;
    const partnerName =
      round.answeringPlayer === "a" ? couple.player_b_name : couple.player_a_name;
    const answeringName =
      round.answeringPlayer === "a" ? couple.player_a_name : couple.player_b_name;
    round.promptId = `memory:${entry.kind}:${entry.id}`;
    round.promptText = fillMemoryPromptTemplate({
      template: template.text,
      reference: entry.content,
      partnerName,
      answeringPlayerName: answeringName,
    });
  }

  const [session] = await sql`
    insert into sessions (couple_id)
    values (${coupleId})
    returning id, started_at
  `;

  return Response.json({ session_id: session.id, plan, couple });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const coupleId = url.searchParams.get("couple_id");
  if (!coupleId) return Response.json({ error: "couple_id required" }, { status: 400 });
  const rows = await sql`
    select id, started_at, ended_at,
      (select count(*)::int from rounds where session_id = sessions.id) as round_count
    from sessions
    where couple_id = ${coupleId}
    order by started_at desc
    limit 50
  `;
  return Response.json(rows);
}
