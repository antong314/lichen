import { judgeBuildOn } from "@/lib/claude";

export async function POST(req: Request) {
  const body = await req.json();
  const promptText = body.prompt_text as string;
  const contributions = body.contributions as Array<{ player: "a" | "b"; playerName: string; text: string }>;
  const newContribution = body.new_contribution as { player: "a" | "b"; playerName: string; text: string };
  const warningsIssued = body.warnings_issued as { a: boolean; b: boolean };

  if (!promptText || !newContribution) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const result = await judgeBuildOn({
    promptText,
    contributions: contributions ?? [],
    newContribution,
    warningsIssued: warningsIssued ?? { a: false, b: false },
  });

  return Response.json(result);
}
