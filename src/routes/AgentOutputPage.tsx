import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { useAppState } from "../state/useAppState";
import { toAgentShape, toMarkdown } from "../utils/format";
import styles from "./AgentOutputPage.module.css";

type Format = "json" | "markdown";

export function AgentOutputPage() {
  const { entries } = useAppState();
  const [searchParams] = useSearchParams();
  const initialFormat = searchParams.get("format") === "markdown" ? "markdown" : "json";
  const [format, setFormat] = useState<Format>(initialFormat);

  const publicEntries = useMemo(() => entries.filter((entry) => entry.isPublic), [entries]);

  const output = useMemo(() => {
    if (format === "json") {
      return JSON.stringify(
        { entries: publicEntries.map((entry) => toAgentShape(entry, publicEntries)) },
        null,
        2
      );
    }
    return toMarkdown(publicEntries);
  }, [format, publicEntries]);

  return (
    <PageShell wide>
      <div className={styles.heading}>
        <h1>给 agent 看的版本</h1>
        <p>跟公开页同一批内容，换成 agent 能直接读的结构。下面是预览。</p>
        <p className={styles.realUrl}>
          全网的 agent 真正能直接抓取的地址（不用跑 JS，纯 HTTP 就能读）：
          <br />
          <a href="/api/agent?format=json">/api/agent?format=json</a>
          {" · "}
          <a href="/api/agent?format=markdown">/api/agent?format=markdown</a>
        </p>
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
