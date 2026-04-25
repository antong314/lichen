import { sql } from "@/lib/db";
import { scoreAnswer, extractMemoryEntries } from "@/lib/claude";
import type { RoundTypeName } from "@/lib/prompts";

export async function POST(req: Request) {
  const body = await req.json();
  const sessionId = body.session_id as string;
  const ordinal = body.ordinal as number;
  const type = body.type as RoundTypeName;
  const promptId = body.prompt_id as string;
  const promptText = body.prompt_text as string;
  const answeringPlayer = body.answering_player as "a" | "b";
  const answerText = (body.answer_text ?? "").toString();
  const partnerName = body.partner_name as string;
  const answeringPlayerName = body.answering_player_name as string;

  if (!sessionId || !type || !promptId || !promptText || !answeringPlayer) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [session] = await sql<{ couple_id: string }[]>`
    select couple_id from sessions where id = ${sessionId}
  `;
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });

  // Quiet round: no scoring, no memory extraction.
  if (type === "quiet") {
    const [round] = await sql`
      insert into rounds (session_id, ordinal, type, prompt_id, prompt_text, answering_player, answer_text, scores)
      values (${sessionId}, ${ordinal}, ${type}, ${promptId}, ${promptText}, ${answeringPlayer}, ${answerText}, ${sql.json({} as never)})
      returning id, scores
    `;
    return Response.json({ round_id: round.id, scores: round.scores });
  }

  // Build_on: client computed the winner; just persist.
  if (type === "build_on") {
    const scoresPayload = body.scores ?? {};
    const [round] = await sql`
      insert into rounds (session_id, ordinal, type, prompt_id, prompt_text, answering_player, answer_text, scores)
      values (${sessionId}, ${ordinal}, ${type}, ${promptId}, ${promptText}, ${answeringPlayer}, ${answerText}, ${sql.json(scoresPayload as never)})
      returning id, scores
    `;
    return Response.json({ round_id: round.id, scores: round.scores });
  }

  // Default scoring path (admiration, generosity_of_frame, memory, guess_the_answer attention stage)
  const glossaryRows = await sql<{ content: string }[]>`
    select content from memory_entries
    where couple_id = ${session.couple_id} and kind = 'glossary'
    order by created_at desc
    limit 30
  `;
  const glossary = glossaryRows.map((r) => r.content);

  const score = await scoreAnswer({
    roundType: type,
    promptText,
    answerText,
    partnerName,
    answeringPlayerName,
    glossary,
  });

  const scoresJson: unknown = type === "guess_the_answer" ? { attention: score } : score;

  const [round] = await sql<{ id: string }[]>`
    insert into rounds (session_id, ordinal, type, prompt_id, prompt_text, answering_player, answer_text, scores)
    values (${sessionId}, ${ordinal}, ${type}, ${promptId}, ${promptText}, ${answeringPlayer}, ${answerText}, ${sql.json(scoresJson as never)})
    returning id
  `;

  // Memory extraction (skip for guess_the_answer — accuracy comes later)
  let memoryAdded = 0;
  if (type !== "guess_the_answer") {
    try {
      const entries = await extractMemoryEntries({
        promptText,
        answerText,
        answeringPlayerName,
        partnerName,
        existingGlossary: glossary,
      });
      for (const entry of entries) {
        await sql`
          insert into memory_entries (couple_id, kind, content, source_round_id)
          values (${session.couple_id}, ${entry.kind}, ${entry.content}, ${round.id})
        `;
      }
      memoryAdded = entries.length;
    } catch (err) {
      console.error("Memory extraction failed:", err);
    }
  }

  return Response.json({
    round_id: round.id,
    scores: scoresJson,
    memory_added: memoryAdded,
  });
}
