import { sql } from "@/lib/db";
import type { ScoreResult } from "@/lib/claude";
import type { AxisName } from "@/lib/prompts";

export async function POST(req: Request, ctx: RouteContext<"/api/rounds/[id]/tiebreaker">) {
  const { id } = await ctx.params;
  const body = await req.json();
  const knew = body.knew as "yes" | "no" | "sort_of";
  const specificity = body.specificity as 1 | 2 | 3 | undefined;

  const [round] = await sql<{ scores: ScoreResult & { tiebreaker_applied?: boolean } }[]>`
    select scores from rounds where id = ${id}
  `;
  if (!round) return Response.json({ error: "Not found" }, { status: 404 });

  const tiebreaker = { knew, specificity, applied_at: new Date().toISOString() };
  const original = round.scores;

  // Adjust hearts based on noticing tiebreaker.
  // - knew='no' → noticing surprise bonus: +1 heart (cap 3) and add 'noticing' to axes_fired if not present
  // - knew='yes' → no boost; if 'noticing' was claimed in axes, remove it
  // - knew='sort_of' → no change
  let hearts = original.hearts;
  let axes: AxisName[] = [...original.axes_fired];
  if (knew === "no") {
    hearts = Math.min(3, hearts + 1) as 1 | 2 | 3;
    if (!axes.includes("noticing")) {
      axes = ["noticing" as AxisName, ...axes].slice(0, 3);
    }
  } else if (knew === "yes") {
    axes = axes.filter((a) => a !== "noticing");
    if (axes.length === 0) axes = [...original.axes_fired];
  }

  // If receiver provided specificity rating, weight it: avg with current hearts when there's a clear delta
  if (specificity != null) {
    if (specificity > hearts) hearts = Math.min(3, hearts + 1) as 1 | 2 | 3;
    if (specificity < hearts && hearts > 1) hearts = (hearts - 1) as 1 | 2 | 3;
  }

  const adjusted: ScoreResult & { tiebreaker_applied: true; original: ScoreResult } = {
    hearts,
    axes_fired: axes,
    reason: original.reason,
    tiebreaker_applied: true,
    original: { hearts: original.hearts, axes_fired: original.axes_fired, reason: original.reason },
  };

  await sql`
    update rounds
    set scores = ${sql.json(adjusted as never)},
        receiver_tiebreaker = ${sql.json(tiebreaker as never)}
    where id = ${id}
  `;

  return Response.json({ scores: adjusted });
}
