import { useMemo } from "react";
import { PageShell } from "../components/layout/PageShell";
import { PublicEntryCard } from "../components/public/PublicEntryCard";
import { useAppState } from "../state/useAppState";
import styles from "./PublicPage.module.css";

export function PublicPage() {
  const { entries } = useAppState();

  const publicEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.isPublic)
      .sort(
        (a, b) =>
          new Date(b.processedAt ?? b.capturedAt).getTime() -
          new Date(a.processedAt ?? a.capturedAt).getTime()
      );
  }, [entries]);

  const relatedTitlesFor = (entryId: string, projectTag: string | null) => {
    if (!projectTag) return [];
    return entries
      .filter((e) => e.id !== entryId && e.projectTag === projectTag)
      .map((e) => e.title);
  };

  return (
    <PageShell>
      <div className={styles.heading}>
        <h1>公开页</h1>
        <p>这里只放经过判断、决定公开的部分。</p>
      </div>
      {publicEntries.length === 0 ? (
        <p className={styles.empty}>还没有什么被放到这里。</p>
      ) : (
        publicEntries.map((entry) => (
          <PublicEntryCard
            key={entry.id}
            entry={entry}
            relatedTitles={relatedTitlesFor(entry.id, entry.projectTag)}
          />
        ))
      )}
    </PageShell>
  );
}
