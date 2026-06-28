import type { Entry } from "./types";

export const SEED_ENTRIES: Entry[] = [
  {
    id: "e1",
    sourceType: "article",
    title: "《为什么我们越来越读不下长文章》",
    origin: "公众号「慢思考」",
    captureNote: "标题问的问题，我自己也想不清楚答案",
    whatItSays: "",
    relevanceToMe: "",
    projectTag: null,
    judgmentStatement: "",
    nextAction: "",
    status: "captured",
    isPublic: false,
    capturedAt: "2026-06-27T09:14:00+08:00",
    processedAt: null,
  },
  {
    id: "e2",
    sourceType: "video",
    title: "一段关于「注意力经济」的演讲剪辑",
    origin: "YouTube · 一次产品大会的演讲片段",
    captureNote: "他说的「被设计的分心」这个词，正好是我在想的东西",
    whatItSays:
      "演讲者认为，大部分应用并不是在抢用户的时间，而是在抢用户做决定的那一刻——把「要不要看」这个判断从用户手里拿走，替用户做了。",
    relevanceToMe:
      "和我们做收集页时一直在纠结的问题一样：收进来这个动作本身要不要有任何「建议」，还是必须保持空白。",
    projectTag: "LumiStudio 产品阅读",
    judgmentStatement:
      "收集这一步必须保持空白，不该有任何推荐或排序——一旦系统替用户做了「这个更重要」的判断，收集就不再是用户自己的判断，而是被系统接管的判断。",
    nextAction: "把这条判断写进收集页的设计原则里，作为以后加功能时的检查标准",
    status: "published",
    isPublic: true,
    capturedAt: "2026-06-22T21:40:00+08:00",
    processedAt: "2026-06-23T11:05:00+08:00",
  },
  {
    id: "e3",
    sourceType: "podcast",
    title: "播客《组织的暗面》第 34 期",
    origin: "播客 App · 34 期，主题是「沉默的代价」",
    captureNote: "讲到「沉默不是没有意见，是觉得说出来没用」这句话，停下来听了三遍",
    whatItSays:
      "嘉宾从多个真实案例出发，论证组织里的沉默往往不是缺乏判断，而是判断者认定说出来不会被处理，于是把判断默默收回，组织因此系统性地丢失了本来存在的信息。",
    relevanceToMe:
      "这正是 LumiStudio 想解决的另一半问题——不是没人有判断，是判断没有一个会被处理的去处。",
    projectTag: "组织设计研究",
    judgmentStatement:
      "一个记录系统如果只负责「存」而不负责「去处」，就会重复播客里说的那种沉默——用户会慢慢学会不再记录，因为记录了也没有下文。",
    nextAction: "检查 LumiStudio 的四个去处是不是都有清楚的下一步，而不是停在「已保存」",
    status: "connected",
    isPublic: false,
    capturedAt: "2026-06-20T08:02:00+08:00",
    processedAt: "2026-06-21T19:30:00+08:00",
  },
  {
    id: "e4",
    sourceType: "webpage",
    title: "一个关于城市步行性评分的工具页",
    origin: "walkscore 类工具页面",
    captureNote: "评分算法挺粗糙的，但「用一个数字代表一种生活方式」这个想法值得记一下",
    whatItSays:
      "工具用一个 0-100 的分数描述一个地址周边的步行便利程度，综合了到商店、学校、公园的步行距离，但没有把街道质量、安全感这些主观因素算进去。",
    relevanceToMe:
      "和我们纠结的「怎么用一个状态描述一条信息的处理程度」是同一类问题——单一数字省力但会丢掉重要的主观部分。",
    projectTag: null,
    judgmentStatement:
      "单一分数适合快速比较，不适合表达判断本身——LumiStudio 的状态字段应该保留文字判断，而不是退化成一个分数。",
    nextAction: "先放着，等设计状态展示的时候再回来对照",
    status: "parked",
    isPublic: false,
    capturedAt: "2026-06-18T15:50:00+08:00",
    processedAt: "2026-06-19T10:12:00+08:00",
  },
  {
    id: "e5",
    sourceType: "clue",
    title: "朋友提到的「非线性叙事」这个说法，还没找到原文",
    origin: "和朋友吃饭时听到的，没有链接",
    captureNote: "她说的时候我意识到自己一直在用线性方式记笔记，可能不够",
    whatItSays: "",
    relevanceToMe: "",
    projectTag: null,
    judgmentStatement: "",
    nextAction: "",
    status: "captured",
    isPublic: false,
    capturedAt: "2026-06-26T20:18:00+08:00",
    processedAt: null,
  },
  {
    id: "e6",
    sourceType: "article",
    title: "《知识管理工具的十年弯路》",
    origin: "个人博客",
    captureNote: "作者自己做了三个失败的笔记工具，这篇是复盘",
    whatItSays:
      "作者复盘了自己做过的三代笔记工具，结论是越想替用户「自动整理」，用户就越不信任系统，最后都退回手动整理——工具应该减少整理的成本，而不是替用户做整理的判断。",
    relevanceToMe:
      "这条结论直接支持我们的设计——PC 操作台不自动生成判断，只负责把判断写下来这件事变轻松。",
    projectTag: "LumiStudio 产品阅读",
    judgmentStatement:
      "自动整理是个陷阱——好的工具该做的是让用户更容易写下自己的判断，而不是替用户生成一个看起来像判断的东西。",
    nextAction: "对照这条，检查操作台有没有任何「自动生成判断」的设计倾向",
    status: "published",
    isPublic: true,
    capturedAt: "2026-06-15T13:25:00+08:00",
    processedAt: "2026-06-16T09:48:00+08:00",
  },
  {
    id: "e7",
    sourceType: "video",
    title: "一个关于「具身认知」的访谈片段",
    origin: "播客频道的视频剪辑",
    captureNote: "他说「思考不只发生在脑子里」，让我想到操作台的布局问题",
    whatItSays:
      "受访者讲具身认知的研究，论点是身体的姿态、环境的空间布局会实际影响人怎么思考，不只是大脑在单独运算。",
    relevanceToMe:
      "操作台的三栏布局不只是好看，空间上把「材料」「自己的位置」「判断」分开摆放，可能真的会让人更容易想清楚，而不只是视觉设计问题。",
    projectTag: "组织设计研究",
    judgmentStatement:
      "三栏的空间分隔是认知工具，不是装饰——保留这个结构，不要为了「简洁」把它压缩成一栏。",
    nextAction: "在操作台的设计说明里记下这条理由，避免以后被误删",
    status: "connected",
    isPublic: false,
    capturedAt: "2026-06-12T22:05:00+08:00",
    processedAt: "2026-06-13T08:40:00+08:00",
  },
];
