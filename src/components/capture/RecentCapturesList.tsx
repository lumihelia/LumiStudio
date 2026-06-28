import { useMemo } from "react";
import { useAppState } from "../../state/useAppState";
import { SOURCE_TYPE_LABEL } from "../../data/types";
import { formatRelative } from "../../utils/format";
import styles from "./RecentCapturesList.module.css";

export function RecentCapturesList() {
  const { entries, dispatch } = useAppState();

  const recent = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
      .slice(0, 6);
  }, [entries]);

  return (
    <div className={styles.wrap}>
      <p className={styles.label}>最近收进来的</p>
      {recent.length === 0 ? (
        <p className={styles.empty}>还没有收进来的东西。</p>
      ) : (
        recent.map((entry) => (
          <div key={entry.id} className={styles.row}>
            <div className={styles.rowText}>
              <span className={styles.title}>{entry.title}</span>
              <span className={styles.note}>{entry.captureNote || entry.whatItSays}</span>
              <span className={styles.meta}>
                {SOURCE_TYPE_LABEL[entry.sourceType]} · {formatRelative(entry.capturedAt)}
              </span>
            </div>
            <button
              type="button"
              className={styles.deleteButton}
              aria-label={`从界面移除 ${entry.title}`}
              onClick={() => dispatch({ type: "DISCARD_ENTRY", payload: { id: entry.id } })}
            >
              删除
            </button>
          </div>
        ))
      )}
    </div>
  );
}
