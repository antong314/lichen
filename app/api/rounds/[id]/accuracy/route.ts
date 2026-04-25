import { sql } from "@/lib/db";
import { generateAccuracyReason } from "@/lib/claude";

export async function POST(req: Request, ctx: RouteContext<"/api/rounds/[id]/accuracy">) {
  const { id } = await ctx.params;
  const body = await req.json();
  const realAnswerText = (body.real_answer_text ?? "").toString();
  const accuracyHearts = body.accuracy_hearts as 1 | 2 | 3;
  const predictingPlayerName = body.predicting_player_name as string;
  const partnerName = body.partner_name as string;

  if (!realAnswerText || !accuracyHearts) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [round] = await sql<{ scores: Record<string, unknown>; prompt_text: string; answer_text: string }[]>`
    select scores, prompt_text, answer_text from rounds where id = ${id}
  `;
  if (!round) return Response.json({ error: "Not found" }, { status: 404 });

  const reason = await generateAccuracyReason({
    promptText: round.prompt_text,
    predictionText: round.answer_text,
    realAnswerText,
    predictingPlayerName,
    partnerName,
    accuracyHearts,
  });

  const updatedScores = {
    ...round.scores,
    accuracy: {
      hearts: accuracyHearts,
      reason,
      real_answer: realAnswerText,
    },
  };

  await sql`update rounds set scores = ${sql.json(updatedScores)} where id = ${id}`;

  return Response.json({ scores: updatedScores });
}
