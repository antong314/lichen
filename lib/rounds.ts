import { loadRoundType, type RoundTypeName } from "./prompts";

export const ROUND_TYPES: RoundTypeName[] = [
  "admiration",
  "generosity_of_frame",
  "build_on",
  "memory",
  "guess_the_answer",
  "quiet",
];

export interface PlannedRound {
  ordinal: number;
  type: RoundTypeName;
  promptId: string;
  promptText: string;
  /** Player who answers (admiration, generosity_of_frame, memory). Not used for build_on or quiet (both play). */
  answeringPlayer?: "a" | "b";
  /** For guess_the_answer: which player predicts. The other is the partner-in-scope. */
  predictingPlayer?: "a" | "b";
}

export interface PlanInput {
  hasMemory: boolean;
  /** Round numbers played by this couple before, used to vary first-player pick */
  totalPriorRounds: number;
}

function pickPrompt(type: RoundTypeName): { id: string; text: string } {
  const def = loadRoundType(type);
  if (def.prompts.length === 0) {
    throw new Error(`No prompts defined for round type ${type}`);
  }
  const p = def.prompts[Math.floor(Math.random() * def.prompts.length)];
  return { id: p.id, text: p.text };
}

/**
 * Plan a 5-round session.
 *
 * Policy: open with admiration, end with admiration. Mix variety in middle.
 * Memory round only included when memory entries exist.
 */
export function planSession(input: PlanInput): PlannedRound[] {
  const middleOptions: RoundTypeName[] = ["generosity_of_frame", "build_on", "guess_the_answer"];
  if (input.hasMemory) middleOptions.push("memory");

  const middle = shuffle(middleOptions).slice(0, 3);
  const sequence: RoundTypeName[] = ["admiration", ...middle, "admiration"];

  // Alternate first answering player based on prior rounds (so couples don't always start with A)
  const firstPlayer: "a" | "b" = input.totalPriorRounds % 2 === 0 ? "a" : "b";
  const flip = (p: "a" | "b") => (p === "a" ? "b" : "a");

  let answering: "a" | "b" = firstPlayer;
  return sequence.map((type, idx) => {
    const ordinal = idx + 1;
    const prompt = pickPrompt(type);
    const round: PlannedRound = {
      ordinal,
      type,
      promptId: prompt.id,
      promptText: prompt.text,
    };
    if (type === "admiration" || type === "generosity_of_frame" || type === "memory") {
      round.answeringPlayer = answering;
      answering = flip(answering);
    } else if (type === "guess_the_answer") {
      round.predictingPlayer = answering;
      answering = flip(answering);
    }
    // build_on and quiet: both play
    return round;
  });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Used for the memory round prompt, fills in a reference. */
export function fillMemoryPromptTemplate(opts: {
  template: string;
  reference: string;
  partnerName: string;
  answeringPlayerName: string;
}): string {
  return opts.template
    .replace(/\{reference\}/g, opts.reference)
    .replace(/\{partner_name\}/g, opts.partnerName)
    .replace(/\{answering_player_name\}/g, opts.answeringPlayerName);
}
