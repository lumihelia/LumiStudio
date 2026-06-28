import type { Entry } from "../../data/types";
import { SOURCE_TYPE_LABEL } from "../../data/types";
import styles from "./MaterialColumn.module.css";

interface MaterialColumnProps {
  entry: Entry | null;
}

export function MaterialColumn({ entry }: MaterialColumnProps) {
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
      <p className={styles.label}>材料</p>
      <h2 className={styles.title}>{entry.title}</h2>
      <p className={styles.origin}>
        {SOURCE_TYPE_LABEL[entry.sourceType]} · {entry.origin}
      </p>
      {entry.captureNote && <p className={styles.note}>「{entry.captureNote}」</p>}
      {entry.whatItSays ? (
        <p className={styles.body}>{entry.whatItSays}</p>
      ) : (
        <p className={styles.placeholder}>还没写它讲了什么，先去读一下原文。</p>
      )}
    </div>
  );
}
