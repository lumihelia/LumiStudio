import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  contextToMarkdown,
  DEFAULT_MY_CONTEXT,
  joinLines,
  loadMyContext,
  markdownToContext,
  saveMyContext,
  splitLines,
  type MyContext,
} from "../utils/myContext";
import styles from "./SettingsPage.module.css";

export function SettingsPage() {
  const [context, setContext] = useState<MyContext>(() => loadMyContext());
  const [savedState, setSavedState] = useState("已载入本机上下文");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const markdown = useMemo(() => contextToMarkdown(context), [context]);

  const updateList = (key: keyof Pick<MyContext, "current_projects" | "active_questions" | "existing_claims" | "output_goals" | "voice" | "intake_rules">, value: string) => {
    setContext((current) => ({ ...current, [key]: splitLines(value) }));
  };

  const save = () => {
    saveMyContext(context);
    setSavedState("已保存到本机");
  };

  const reset = () => {
    setContext(DEFAULT_MY_CONTEXT);
    saveMyContext(DEFAULT_MY_CONTEXT);
    setSavedState("已恢复模板内容");
  };

  const downloadTemplate = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "lumistudio-my-context.md";
    anchor.click();
    URL.revokeObjectURL(url);
    setSavedState("已生成 Markdown 模板");
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    const nextContext = file.name.endsWith(".json")
      ? (JSON.parse(text) as MyContext)
      : markdownToContext(text);
    setContext(nextContext);
    saveMyContext(nextContext);
    setSavedState("已从文件导入");
  };

  return (
    <main className={styles.shell}>
      <section className={styles.hero}>
        <p className={styles.kicker}>Settings / My Context</p>
        <h1>我的上下文</h1>
        <p>
          这是 LumiStudio 判断“这和我有什么关系、它该去哪、能不能公开”的底层配置。
          主工作流仍然是工作台、引力台、公开页和 Feed。
        </p>
        <div className={styles.heroActions}>
          <button type="button" className={styles.primaryButton} onClick={save}>
            保存上下文
          </button>
          <button type="button" onClick={downloadTemplate}>
            下载 Markdown 模板
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            上传 TXT / MD
          </button>
          <button type="button" onClick={reset}>
            恢复模板
          </button>
          <input
            ref={fileInputRef}
            className={styles.fileInput}
            type="file"
            accept=".md,.markdown,.txt,.json,text/markdown,text/plain,application/json"
            onChange={(event) => void importFile(event.target.files?.[0])}
          />
        </div>
        <p className={styles.status}>{savedState}</p>
      </section>

      <div className={styles.grid}>
        <section className={styles.editor} aria-label="我的上下文编辑区">
          <ContextBlock title="1. 我是谁" description="一句话说明当前身份和判断位置。">
            <textarea
              value={context.identity}
              onChange={(event) =>
                setContext((current) => ({ ...current, identity: event.target.value }))
              }
              rows={5}
            />
          </ContextBlock>

          <ListBlock
            title="2. 我现在在做什么"
            description="项目、实验、正在推进的工作线。"
            value={joinLines(context.current_projects)}
            onChange={(value) => updateList("current_projects", value)}
          />
          <ListBlock
            title="3. 我长期关心的问题"
            description="材料进入系统后，用来判断相关性的长期问题。"
            value={joinLines(context.active_questions)}
            onChange={(value) => updateList("active_questions", value)}
          />
          <ListBlock
            title="4. 我已有的判断"
            description="已有判断不等于绝对结论，但会影响材料去向。"
            value={joinLines(context.existing_claims)}
            onChange={(value) => updateList("existing_claims", value)}
          />
          <ListBlock
            title="5. 我希望材料最后流向哪里"
            description="工作台里的最终动作词汇。"
            value={joinLines(context.output_goals)}
            onChange={(value) => updateList("output_goals", value)}
          />
          <ListBlock
            title="6. 我的表达风格"
            description="写作、附注、公开表达时要遵守的风格边界。"
            value={joinLines(context.voice)}
            onChange={(value) => updateList("voice", value)}
          />

          <ContextBlock title="7. 我的公开边界" description="明确哪些可以公开，哪些默认私有。">
            <div className={styles.twoColumnInputs}>
              <label>
                可以公开
                <textarea
                  value={joinLines(context.privacy_rules.public)}
                  onChange={(event) =>
                    setContext((current) => ({
                      ...current,
                      privacy_rules: {
                        ...current.privacy_rules,
                        public: splitLines(event.target.value),
                      },
                    }))
                  }
                  rows={6}
                />
              </label>
              <label>
                默认私有
                <textarea
                  value={joinLines(context.privacy_rules.private)}
                  onChange={(event) =>
                    setContext((current) => ({
                      ...current,
                      privacy_rules: {
                        ...current.privacy_rules,
                        private: splitLines(event.target.value),
                      },
                    }))
                  }
                  rows={6}
                />
              </label>
            </div>
          </ContextBlock>

          <ListBlock
            title="8. 我的信息摄入规则"
            description="外部信息如何进入系统，哪些只能当线索，哪些能进证据池。"
            value={joinLines(context.intake_rules)}
            onChange={(value) => updateList("intake_rules", value)}
          />
        </section>
      </div>
    </main>
  );
}

function ListBlock({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ContextBlock title={title} description={description}>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={7} />
    </ContextBlock>
  );
}

function ContextBlock({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.contextBlock}>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}
