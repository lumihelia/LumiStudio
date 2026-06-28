import { Link } from "react-router-dom";
import type { Entry } from "../../data/types";
import { SOURCE_TYPE_LABEL } from "../../data/types";
import { formatDate } from "../../utils/format";
import styles from "./PublicEntryCard.module.css";

interface PublicEntryCardProps {
  entry: Entry;
  relatedTitles?: string[];
}

export function PublicEntryCard({ entry, relatedTitles }: PublicEntryCardProps) {
  return (
    <article className={styles.entry}>
      <p className={styles.context}>
        {entry.title} · {SOURCE_TYPE_LABEL[entry.sourceType]}
      </p>
      {entry.tags.length > 0 && (
        <div className={styles.tagRow}>
          {entry.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className={styles.statement}>{entry.judgmentStatement}</p>
      {entry.relevanceToMe && (
        <p className={styles.relevance}>{entry.relevanceToMe}</p>
      )}

      {entry.whatItSays && (
        <>
          <p className={styles.sectionLabel}>这篇讲了什么</p>
          <p className={styles.whatItSays}>{entry.whatItSays}</p>
        </>
      )}

      {entry.coreBullets.length > 0 && (
        <>
          <p className={styles.sectionLabel}>核心观点</p>
          <ul className={styles.bullets}>
            {entry.coreBullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </>
      )}

      {relatedTitles && relatedTitles.length > 0 && (
        <>
          <p className={styles.sectionLabel}>这篇还牵到了什么</p>
          <ul className={styles.relatedList}>
            {relatedTitles.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        </>
      )}

      <p className={styles.provenance}>
        来自 {entry.origin} · {formatDate(entry.processedAt)}
        {entry.projectTag ? ` · ${entry.projectTag}` : ""}
      </p>
      <div className={styles.agentLinks}>
        <Link className={styles.agentLink} to="/agent?format=markdown">
          Markdown
        </Link>
        <Link className={styles.agentLink} to="/agent?format=json">
          JSON
        </Link>
      </div>
    </article>
  );
}
