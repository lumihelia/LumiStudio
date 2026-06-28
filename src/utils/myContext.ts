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
  identity:
    "我是一个关注 AI agents、长期上下文、个人成长和信息系统的产品型创作者，正在尝试把材料处理、判断生成、公开表达和 agent-readable web 连接起来。",
  current_projects: [
    "LumiStudio：把看到的东西变成判断、行动和可公开认知资产",
    "PodLens：把播客/访谈材料变成忠实解读和公开阅读页",
    "AI 产品实验：探索手机捕捉、PC 操作台、公开层、agent-readable 输出",
  ],
  active_questions: [
    "AI 时代，人如何处理信息、形成判断并行动？",
    "Agent 如何读取、调用和消化公开内容？",
    "私有认知如何变成可公开、可引用、可被 agents 读取的资产？",
    "手机端和 PC 端在认知工作流里应该分别承担什么？",
    "AI 如何帮助人成长，但不夺走人的主体性？",
  ],
  existing_claims: [
    "阅读不是把内容看完，而是让内容在我的系统里找到位置。",
    "收藏不是消化，摘要也不是洞察。",
    "手机端适合捕捉，PC 端适合判断和确认。",
    "Agent 可以主动补全材料，但关键状态变化必须由人确认。",
    "公开页未来不只是给人读，也要给 agents 读。",
  ],
  output_goals: [
    "接到项目",
    "形成判断",
    "打开问题",
    "变成任务",
    "写成一段",
    "放到公开页",
    "加入证据池",
    "先放着",
    "不留了",
  ],
  voice: [
    "中文自然、克制、清楚",
    "不要 AI 味",
    "不要过度夸张",
    "不要堆概念",
    "少用“不是 A，而是 B”式句子",
    "更喜欢共同观察式表达",
    "可以锋利，但要有证据边界",
  ],
  privacy_rules: {
    public: [
      "对材料的忠实解读",
      "成熟后的作者附注",
      "已确认的产品判断",
      "对公开材料的分析",
    ],
    private: [
      "还没想清楚的判断",
      "个人经历",
      "具体项目策略",
      "未确认的情绪化想法",
      "对他人或机构的敏感判断",
    ],
  },
  intake_rules: [
    "X / 社交媒体爆料只当线索，不直接当事实",
    "访谈适合看战略意图，不直接当证据",
    "论文可以进证据池，但需要保留来源",
    "别人的判断默认进入“外部判断”，不能直接写成“我的判断”",
    "AI 自动生成的关系必须等我确认",
  ],
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
