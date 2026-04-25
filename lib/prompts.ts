import { readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

const promptsDir = join(process.cwd(), "prompts");

export type AxisName =
  | "specificity"
  | "noticing"
  | "non_obviousness"
  | "groundedness"
  | "generosity_of_frame";

export type AxisWeight = "heavy" | "medium" | "bonus";

export type RoundTypeName =
  | "admiration"
  | "generosity_of_frame"
  | "build_on"
  | "memory"
  | "guess_the_answer"
  | "quiet";

export interface PromptEntry {
  id: string;
  text: string;
}

export interface RoundTypeDefinition {
  type: RoundTypeName;
  displayName: string;
  axisWeights: Partial<Record<AxisName, AxisWeight>>;
  description: string;
  prompts: PromptEntry[];
  scoringInstructions: string;
  judgingInstructions?: string;
  promptTemplates?: PromptEntry[];
  reasonGuidance?: string;
}

function parseTopSections(body: string): Map<string, string> {
  const lines = body.split("\n");
  const sections = new Map<string, string>();
  let currentTitle: string | null = null;
  let currentLines: string[] = [];
  const flush = () => {
    if (currentTitle !== null) {
      sections.set(currentTitle.toLowerCase(), currentLines.join("\n").trim());
    }
  };
  for (const line of lines) {
    const m = line.match(/^# (.+?)\s*$/);
    if (m) {
      flush();
      currentTitle = m[1].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  flush();
  return sections;
}

function parseSubsections(body: string): PromptEntry[] {
  if (!body.trim()) return [];
  const lines = body.split("\n");
  const items: PromptEntry[] = [];
  let currentId: string | null = null;
  let currentLines: string[] = [];
  const flush = () => {
    if (currentId !== null) {
      items.push({ id: currentId, text: currentLines.join("\n").trim() });
    }
  };
  for (const line of lines) {
    const m = line.match(/^## (.+?)\s*$/);
    if (m) {
      flush();
      currentId = m[1].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  flush();
  return items;
}

const fileForType: Record<RoundTypeName, string> = {
  admiration: "admiration.md",
  generosity_of_frame: "generosity-of-frame.md",
  build_on: "build-on.md",
  memory: "memory.md",
  guess_the_answer: "guess-the-answer.md",
  quiet: "quiet.md",
};

export function loadRoundType(type: RoundTypeName): RoundTypeDefinition {
  const filename = fileForType[type];
  if (!filename) throw new Error(`Unknown round type: ${type}`);
  const raw = readFileSync(join(promptsDir, "round-types", filename), "utf8");
  const { data, content } = matter(raw);
  const sections = parseTopSections(content);

  return {
    type,
    displayName: (data.display_name as string) ?? type,
    axisWeights: (data.axis_weights as Partial<Record<AxisName, AxisWeight>>) ?? {},
    description: sections.get("description") ?? "",
    prompts: parseSubsections(sections.get("user prompts") ?? sections.get("user prompt") ?? ""),
    scoringInstructions:
      sections.get("scoring instructions") ??
      sections.get("scoring instructions (attention score only — accuracy comes from the partner)") ??
      "",
    judgingInstructions: sections.get("judging instructions"),
    promptTemplates: parseSubsections(sections.get("prompt template") ?? ""),
    reasonGuidance: sections.get("reason text on a low accuracy score"),
  };
}

export function loadBaseRubric(): string {
  return readFileSync(join(promptsDir, "scoring", "base-rubric.md"), "utf8");
}

export function loadOutputFormat(): string {
  return readFileSync(join(promptsDir, "scoring", "output-format.md"), "utf8");
}
