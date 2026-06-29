export interface MyContext {
  identity: string;
  current_projects: string[];
  active_questions: string[];
  existing_claims: string[];
  output_goals: string[];
  voice: string[];
  privacy_rules: {
    public: string[];
    private: string[];
  };
  intake_rules: string[];
}

const STORAGE_KEY = "lumistudio.myContext.v1";

export const DEFAULT_MY_CONTEXT: MyContext = {
  identity: "",
  current_projects: [],
  active_questions: [],
  existing_claims: [],
  output_goals: [],
  voice: [],
  privacy_rules: {
    public: [],
    private: [],
  },
  intake_rules: [],
};

export function loadMyContext(): MyContext {
  if (typeof window === "undefined") return DEFAULT_MY_CONTEXT;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_MY_CONTEXT;
  try {
    return normalizeContext(JSON.parse(raw));
  } catch {
    return DEFAULT_MY_CONTEXT;
  }
}

export function toCaptureMyContext(context: MyContext): {
  currentProjects: string[];
  activeQuestions: string[];
  existingClaims: string[];
} {
  return {
    currentProjects: context.current_projects,
    activeQuestions: context.active_questions,
    existingClaims: context.existing_claims,
  };
}

export function saveMyContext(context: MyContext): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeContext(context)));
  window.dispatchEvent(new Event("my-context-updated"));
}

export function contextToMarkdown(context: MyContext): string {
  return [
    "# 我的上下文",
    "",
    "## 我是谁",
    context.identity,
    "",
    listSection("我现在在做什么", context.current_projects),
    listSection("我长期关心的问题", context.active_questions),
    listSection("我已有的判断", context.existing_claims),
    listSection("我希望材料最后流向哪里", context.output_goals),
    listSection("我的表达风格", context.voice),
    listSection("可以公开", context.privacy_rules.public),
    listSection("默认私有", context.privacy_rules.private),
    listSection("我的信息摄入规则", context.intake_rules),
  ].join("\n");
}

export function markdownToContext(markdown: string): MyContext {
  return normalizeContext({
    identity: sectionText(markdown, "我是谁") || DEFAULT_MY_CONTEXT.identity,
    current_projects: sectionList(markdown, "我现在在做什么"),
    active_questions: sectionList(markdown, "我长期关心的问题"),
    existing_claims: sectionList(markdown, "我已有的判断"),
    output_goals: sectionList(markdown, "我希望材料最后流向哪里"),
    voice: sectionList(markdown, "我的表达风格"),
    privacy_rules: {
      public: sectionList(markdown, "可以公开"),
      private: sectionList(markdown, "默认私有"),
    },
    intake_rules: sectionList(markdown, "我的信息摄入规则"),
  });
}

export function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

export function joinLines(values: string[]): string {
  return values.join("\n");
}

function normalizeContext(value: unknown): MyContext {
  const partial = value as Partial<MyContext>;
  const privacy = (partial.privacy_rules ?? {}) as Partial<MyContext["privacy_rules"]>;
  return {
    identity: stringOr(partial.identity, DEFAULT_MY_CONTEXT.identity),
    current_projects: listOr(partial.current_projects, DEFAULT_MY_CONTEXT.current_projects),
    active_questions: listOr(partial.active_questions, DEFAULT_MY_CONTEXT.active_questions),
    existing_claims: listOr(partial.existing_claims, DEFAULT_MY_CONTEXT.existing_claims),
    output_goals: listOr(partial.output_goals, DEFAULT_MY_CONTEXT.output_goals),
    voice: listOr(partial.voice, DEFAULT_MY_CONTEXT.voice),
    privacy_rules: {
      public: listOr(privacy.public, DEFAULT_MY_CONTEXT.privacy_rules.public),
      private: listOr(privacy.private, DEFAULT_MY_CONTEXT.privacy_rules.private),
    },
    intake_rules: listOr(partial.intake_rules, DEFAULT_MY_CONTEXT.intake_rules),
  };
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function listOr(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value.map((item) => String(item).trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : fallback;
}

function listSection(title: string, values: string[]): string {
  return [`## ${title}`, ...values.map((value) => `- ${value}`), ""].join("\n");
}

function sectionText(markdown: string, title: string): string {
  return sectionBody(markdown, title)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("- "))
    .join("\n")
    .trim();
}

function sectionList(markdown: string, title: string): string[] {
  return splitLines(sectionBody(markdown, title));
}

function sectionBody(markdown: string, title: string): string {
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(new RegExp(`##\\s+${escapedTitle}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, "i"));
  return match?.[1]?.trim() ?? "";
}
