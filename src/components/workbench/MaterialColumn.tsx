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
        <p className={styles.label}>当前材料</p>
        <p className={styles.prompt}>选一条，看看它说了什么。</p>
      </div>
    );
  }

  const originIsUrl = entry.origin.startsWith("http://") || entry.origin.startsWith("https://");

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
          <p className={styles.label}>当前材料</p>
          <h2 className={styles.title}>{entry.title}</h2>
          <div className={styles.metaGrid}>
            <div>
              <span>类型</span>
              <p>{SOURCE_TYPE_LABEL[entry.sourceType]}</p>
            </div>
            <div>
              <span>来源 / 原始线索</span>
              {originIsUrl ? (
                <a href={entry.origin} target="_blank" rel="noreferrer">
                  打开原材料
                </a>
              ) : (
                <p>{entry.origin}</p>
              )}
            </div>
          </div>
          {entry.tags.length > 0 && (
            <div className={styles.tagRow}>
              {entry.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          {entry.captureNote && (
            <div className={styles.noteBlock}>
              <span>用户当时想到</span>
              <p>「{entry.captureNote}」</p>
            </div>
          )}
          {entry.whatItSays ? (
            <section className={styles.section}>
              <p className={styles.sectionLabel}>这篇讲了什么</p>
              <p className={styles.body}>{entry.whatItSays}</p>
            </section>
          ) : (
            <p className={styles.placeholder}>还没写它讲了什么，先去读一下原文。</p>
          )}
          {entry.coreBullets.length > 0 && (
            <section className={styles.bullets}>
              <p className={styles.bulletsLabel}>核心观点</p>
              <ul>
                {entry.coreBullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </section>
          )}
          {entry.origin && (
            <section className={styles.section}>
              <p className={styles.sectionLabel}>模拟正文 / 字幕片段</p>
              <p className={styles.body}>
                {entry.whatItSays ||
                  "真实正文或字幕会在未来由个人 agent 补齐。当前 demo 先保留来源、标题和用户当时的判断线索。"}
              </p>
            </section>
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
