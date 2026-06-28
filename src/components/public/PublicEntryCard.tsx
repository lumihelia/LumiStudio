import type { Entry } from "../../data/types";
import { SOURCE_TYPE_LABEL } from "../../data/types";
import { formatDate } from "../../utils/format";
import styles from "./PublicEntryCard.module.css";

export function PublicEntryCard({ entry }: { entry: Entry }) {
  return (
    <article className={styles.entry}>
      <p className={styles.context}>
        {entry.title} · {SOURCE_TYPE_LABEL[entry.sourceType]}
      </p>
      <p className={styles.statement}>{entry.judgmentStatement}</p>
      {entry.relevanceToMe && (
        <p className={styles.relevance}>{entry.relevanceToMe}</p>
      )}
      <p className={styles.provenance}>
        来自 {entry.origin} · {formatDate(entry.processedAt)}
        {entry.projectTag ? ` · ${entry.projectTag}` : ""}
      </p>
    </article>
  );
}
