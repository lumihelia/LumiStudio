import { useMemo, useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { useAppState } from "../state/useAppState";
import { toAgentShape, toMarkdown } from "../utils/format";
import styles from "./AgentOutputPage.module.css";

type Format = "json" | "markdown";

export function AgentOutputPage() {
  const { entries } = useAppState();
  const [format, setFormat] = useState<Format>("json");

  const publicEntries = useMemo(() => entries.filter((entry) => entry.isPublic), [entries]);

  const output = useMemo(() => {
    if (format === "json") {
      return JSON.stringify({ entries: publicEntries.map(toAgentShape) }, null, 2);
    }
    return toMarkdown(publicEntries);
  }, [format, publicEntries]);

  return (
    <PageShell wide>
      <div className={styles.heading}>
        <h1>给 agent 看的版本</h1>
        <p>跟公开页同一批内容，换成 agent 能直接读的结构。</p>
      </div>
      <div className={styles.toggle}>
        <button
          type="button"
          className={
            format === "json" ? `${styles.toggleButton} ${styles.toggleButtonActive}` : styles.toggleButton
          }
          onClick={() => setFormat("json")}
        >
          JSON
        </button>
        <button
          type="button"
          className={
            format === "markdown"
              ? `${styles.toggleButton} ${styles.toggleButtonActive}`
              : styles.toggleButton
          }
          onClick={() => setFormat("markdown")}
        >
          Markdown
        </button>
      </div>
      <pre className={styles.output}>{output}</pre>
    </PageShell>
  );
}
