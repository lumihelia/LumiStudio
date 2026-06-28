import { useMemo, useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { InboxColumn } from "../components/workbench/InboxColumn";
import { MaterialColumn } from "../components/workbench/MaterialColumn";
import { JudgmentColumn } from "../components/workbench/JudgmentColumn";
import { useAppState } from "../state/useAppState";
import styles from "./WorkbenchPage.module.css";

export function WorkbenchPage() {
  const { entries } = useAppState();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a.status === "captured" && b.status !== "captured") return -1;
      if (b.status === "captured" && a.status !== "captured") return 1;
      return new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime();
    });
  }, [entries]);

  const selectedEntry = entries.find((entry) => entry.id === selectedId) ?? null;

  return (
    <PageShell wide>
      <div className={styles.heading}>
        <h1>认知操作台</h1>
        <p>把收进来的东西，捋清楚它讲了什么、跟我有什么关系、接下来去哪儿。</p>
      </div>
      <div className={styles.grid}>
        <InboxColumn
          entries={sortedEntries}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <MaterialColumn entry={selectedEntry} />
        <JudgmentColumn entry={selectedEntry} onDiscarded={() => setSelectedId(null)} />
      </div>
    </PageShell>
  );
}
