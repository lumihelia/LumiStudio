import { useState } from "react";
import type { Entry } from "../../data/types";
import { SOURCE_TYPE_LABEL } from "../../data/types";
import { PublicEntryCard } from "../public/PublicEntryCard";
import styles from "./MaterialColumn.module.css";

interface MaterialColumnProps {
  entry: Entry | null;
}

type Tab = "material" | "preview";

export function MaterialColumn({ entry }: MaterialColumnProps) {
  const [tab, setTab] = useState<Tab>("material");

  if (!entry) {
    return (
      <div className={styles.column}>
        <p className={styles.label}>材料</p>
        <p className={styles.prompt}>选一条，看看它说了什么。</p>
      </div>
    );
  }

  return (
    <div className={styles.column}>
      <div className={styles.tabRow}>
        <button
          type="button"
          className={tab === "material" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
          onClick={() => setTab("material")}
        >
          材料
        </button>
        <button
          type="button"
          className={tab === "preview" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
          onClick={() => setTab("preview")}
        >
          公开页预览
        </button>
      </div>

      {tab === "material" ? (
        <>
          <h2 className={styles.title}>{entry.title}</h2>
          <p className={styles.origin}>
            {SOURCE_TYPE_LABEL[entry.sourceType]} · {entry.origin}
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
          {entry.captureNote && <p className={styles.note}>「{entry.captureNote}」</p>}
          {entry.whatItSays ? (
            <p className={styles.body}>{entry.whatItSays}</p>
          ) : (
            <p className={styles.placeholder}>还没写它讲了什么，先去读一下原文。</p>
          )}
          {entry.coreBullets.length > 0 && (
            <div className={styles.bullets}>
              <p className={styles.bulletsLabel}>核心观点</p>
              <ul>
                {entry.coreBullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : entry.judgmentStatement ? (
        <PublicEntryCard entry={entry} />
      ) : (
        <p className={styles.placeholder}>
          还没有判断，写完「写成一段」之后，这里会显示公开页大概的样子。
        </p>
      )}
    </div>
  );
}
