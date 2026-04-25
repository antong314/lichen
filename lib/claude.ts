import Anthropic from "@anthropic-ai/sdk";
import {
  loadBaseRubric,
  loadRoundType,
  type AxisName,
  type RoundTypeName,
} from "./prompts";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

const MODEL = "claude-sonnet-4-6";

export interface ScoreResult {
  hearts: 1 | 2 | 3;
  axes_fired: AxisName[];
  reason: string;
}

const AXES: AxisName[] = [
  "specificity",
  "noticing",
  "non_obviousness",
  "groundedness",
  "generosity_of_frame",
];

const SCORE_TOOL = {
  name: "submit_score",
  description: "Submit the score for this answer.",
  input_schema: {
    type: "object" as const,
    properties: {
      hearts: { type: "integer", enum: [1, 2, 3] },
      axes_fired: {
        type: "array",
        items: { type: "string", enum: AXES },
        minItems: 1,
        maxItems: 3,
      },
      reason: { type: "string" },
    },
    required: ["hearts", "axes_fired", "reason"],
  },
};

function glossaryBlock(glossary?: string[]): string {
  if (!glossary || glossary.length === 0) return "";
  return [
    "",
    "## This couple's loaded references",
    "",
    glossary.map((g) => `- ${g}`).join("\n"),
    "",
    "Treat references to these as more specific than they would otherwise read. The receiver knows what they mean.",
  ].join("\n");
}

export async function scoreAnswer(input: {
  roundType: RoundTypeName;
  promptText: string;
  answerText: string;
  partnerName: string;
  answeringPlayerName: string;
  glossary?: string[];
}): Promise<ScoreResult> {
  const def = loadRoundType(input.roundType);
  const baseRubric = loadBaseRubric();

  const system = [
    baseRubric,
    "",
    "---",
    "",
    `# Round type: ${def.displayName}`,
    "",
    def.description,
    "",
    "## Scoring instructions for this round type",
    "",
    def.scoringInstructions,
    glossaryBlock(input.glossary),
  ].join("\n");

  const userMessage = [
    `Prompt asked of ${input.answeringPlayerName} (about their partner ${input.partnerName}):`,
    `> ${input.promptText}`,
    "",
    `${input.answeringPlayerName}'s answer:`,
    `> ${input.answerText}`,
    "",
    "Score this answer using the submit_score tool.",
  ].join("\n");

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: userMessage }],
    tools: [SCORE_TOOL],
    tool_choice: { type: "tool", name: "submit_score" },
  });

  const block = response.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("Claude did not return a tool_use block");
  }
  return block.input as ScoreResult;
}

const JUDGE_TOOL = {
  name: "submit_verdict",
  description: "Judge a build-on contribution.",
  input_schema: {
    type: "object" as const,
    properties: {
      verdict: { type: "string", enum: ["accept", "warning", "out"] },
      reason: { type: "string" },
    },
    required: ["verdict", "reason"],
  },
};

export async function judgeBuildOn(input: {
  promptText: string;
  contributions: Array<{ player: "a" | "b"; playerName: string; text: string }>;
  newContribution: { player: "a" | "b"; playerName: string; text: string };
  warningsIssued: { a: boolean; b: boolean };
}): Promise<{ verdict: "accept" | "warning" | "out"; reason: string }> {
  const def = loadRoundType("build_on");

  const system = [
    "You are judging a contribution in a build-on round of an admiration game.",
    "",
    def.description,
    "",
    "## Judging Instructions",
    "",
    def.judgingInstructions ?? "",
  ].join("\n");

  const history = input.contributions
    .map((c, i) => `${i + 1}. ${c.playerName}: ${c.text}`)
    .join("\n");

  const userMessage = [
    `Prompt: ${input.promptText}`,
    "",
    "Contributions so far:",
    history || "(none yet)",
    "",
    `New contribution from ${input.newContribution.playerName}: ${input.newContribution.text}`,
    "",
    `Warnings already issued: A=${input.warningsIssued.a ? "yes" : "no"}, B=${input.warningsIssued.b ? "yes" : "no"}.`,
    "",
    "Submit your verdict using the submit_verdict tool.",
  ].join("\n");

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 512,
    system,
    messages: [{ role: "user", content: userMessage }],
    tools: [JUDGE_TOOL],
    tool_choice: { type: "tool", name: "submit_verdict" },
  });

  const block = response.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("Claude did not return a verdict");
  }
  return block.input as { verdict: "accept" | "warning" | "out"; reason: string };
}

const MEMORY_TOOL = {
  name: "submit_memory_entries",
  description:
    "Submit 0 to 3 new memory entries based on the round just played. Return an empty array if nothing is worth remembering.",
  input_schema: {
    type: "object" as const,
    properties: {
      entries: {
        type: "array",
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            kind: { type: "string", enum: ["glossary", "pattern", "reference"] },
            content: { type: "string" },
          },
          required: ["kind", "content"],
        },
      },
    },
    required: ["entries"],
  },
};

export async function extractMemoryEntries(input: {
  promptText: string;
  answerText: string;
  answeringPlayerName: string;
  partnerName: string;
  existingGlossary: string[];
}): Promise<Array<{ kind: "glossary" | "pattern" | "reference"; content: string }>> {
  const system = [
    "You are the memory engine for a couples admiration game. After each round you read the answer and propose 0 to 3 new memory entries about this couple.",
    "",
    "Three kinds of entry:",
    "- glossary: a loaded reference, name, place, or shorthand this couple uses (e.g. 'the lemon thing', 'Sunday mornings'). Short, 1–6 words.",
    "- pattern: a recurring way one partner attends to the other (e.g. 'tends to admire steady attention over big gestures'). One sentence.",
    "- reference: a shared experience or moment to recall in future rounds (e.g. 'Anton admired how Elvi handled her sister's wedding'). One sentence.",
    "",
    "Be conservative. Most rounds will produce 0 or 1 entries. Only propose an entry if it would help the AI understand this couple in future rounds. Do not propose entries that restate generic facts (names, ages, kids).",
    "",
    "Do not propose entries that overlap with the existing glossary.",
  ].join("\n");

  const userMessage = [
    `Existing glossary entries:`,
    input.existingGlossary.length > 0
      ? input.existingGlossary.map((g) => `- ${g}`).join("\n")
      : "(none yet)",
    "",
    `Prompt: ${input.promptText}`,
    `${input.answeringPlayerName}'s answer about ${input.partnerName}: ${input.answerText}`,
    "",
    "Submit any new memory entries using the submit_memory_entries tool.",
  ].join("\n");

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 512,
    system,
    messages: [{ role: "user", content: userMessage }],
    tools: [MEMORY_TOOL],
    tool_choice: { type: "tool", name: "submit_memory_entries" },
  });

  const block = response.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") return [];
  const out = block.input as { entries: Array<{ kind: "glossary" | "pattern" | "reference"; content: string }> };
  return out.entries ?? [];
}

export async function generateAccuracyReason(input: {
  promptText: string;
  predictionText: string;
  realAnswerText: string;
  predictingPlayerName: string;
  partnerName: string;
  accuracyHearts: 1 | 2 | 3;
}): Promise<string> {
  const def = loadRoundType("guess_the_answer");

  const system = [
    "You are writing the reason text for a guess-the-answer round in an admiration game.",
    "",
    def.reasonGuidance ?? "",
    "",
    "Rules:",
    "- 1 or 2 sentences max.",
    "- No coaching. Do not say what the predicting player should have said.",
    "- Do not assign blame.",
    "- For 1-heart accuracy, frame the gap as a gift — a small visible thing one of you didn't know about the other — and end with: 'Take as long as you need. Tap when ready.'",
    "- For 2-heart accuracy, name what landed and what didn't, briefly.",
    "- For 3-heart accuracy, name the attention without overpraising.",
    "- Do not use emotional language ('heartfelt', 'loving', 'beautiful').",
    "- Return only the reason text, no JSON, no markdown.",
  ].join("\n");

  const userMessage = [
    `Prompt: ${input.promptText}`,
    "",
    `${input.predictingPlayerName}'s prediction of what ${input.partnerName} would say: ${input.predictionText}`,
    "",
    `${input.partnerName}'s real answer: ${input.realAnswerText}`,
    "",
    `${input.partnerName} tapped ${input.accuracyHearts} heart${input.accuracyHearts === 1 ? "" : "s"} for accuracy.`,
    "",
    "Write the reason.",
  ].join("\n");

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 256,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return "";
  return block.text.trim();
}
