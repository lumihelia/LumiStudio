import { useEffect, useState } from "react";
import type { SourceType } from "../../data/types";
import { SOURCE_TYPE_LABEL } from "../../data/types";
import { useAppState } from "../../state/useAppState";
import styles from "./CaptureForm.module.css";

const SOURCE_TYPES: SourceType[] = ["article", "video", "podcast", "webpage", "clue"];

export function CaptureForm() {
  const { dispatch } = useAppState();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("clue");
  const [justCaptured, setJustCaptured] = useState(false);

  useEffect(() => {
    if (!justCaptured) return;
    const timer = setTimeout(() => setJustCaptured(false), 2000);
    return () => clearTimeout(timer);
  }, [justCaptured]);

  const canSubmit = title.trim().length > 0 || note.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    dispatch({ type: "ADD_ENTRY", payload: { title, captureNote: note, sourceType } });
    setTitle("");
    setNote("");
    setSourceType("clue");
    setJustCaptured(true);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="capture-title">
          叫什么 / 链接是什么
        </label>
        <input
          id="capture-title"
          className={styles.textInput}
          type="text"
          value={title}
          placeholder="标题，或者一句话描述"
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>它是什么</span>
        <div className={styles.typeRow}>
          {SOURCE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={
                sourceType === type
                  ? `${styles.typeChip} ${styles.typeChipActive}`
                  : styles.typeChip
              }
              onClick={() => setSourceType(type)}
            >
              {SOURCE_TYPE_LABEL[type]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="capture-note">
          记一下，为什么重要
        </label>
        <textarea
          id="capture-note"
          className={styles.textarea}
          rows={3}
          value={note}
          placeholder="哪句话、哪个想法让你想留下它"
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={!canSubmit}>
          收进来
        </button>
        {justCaptured && <span className={styles.confirmation}>收进来了</span>}
      </div>
    </form>
  );
}
