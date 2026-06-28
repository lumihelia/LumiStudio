import { useEffect, useState } from "react";
import type { SourceType } from "../../data/types";
import { SOURCE_TYPE_LABEL } from "../../data/types";
import { useAppState } from "../../state/useAppState";
import {
  createFallbackDraft,
  inferSourceType,
  type CaptureInput,
  type EntryDraft,
} from "../../utils/extraction";
import styles from "./CaptureForm.module.css";

const SOURCE_TYPES: SourceType[] = ["article", "video", "podcast", "webpage", "clue"];

export function CaptureForm() {
  const { dispatch } = useAppState();
  const [rawInput, setRawInput] = useState("");
  const [note, setNote] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("clue");
  const [justCaptured, setJustCaptured] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!justCaptured) return;
    const timer = setTimeout(() => setJustCaptured(false), 2000);
    return () => clearTimeout(timer);
  }, [justCaptured]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sheetOpen]);

  const canSubmit = rawInput.trim().length > 0 || note.trim().length > 0;

  const handleConfirm = async () => {
    if (!canSubmit || isExtracting) return;

    const input: CaptureInput = {
      rawInput,
      captureNote: note,
      sourceType: inferSourceType(rawInput, sourceType),
    };

    setIsExtracting(true);
    setStatus("正在把它整理成一条材料");
    const draft = await getEntryDraft(input);
    dispatch({ type: "ADD_ENTRY", payload: draft });
    setRawInput("");
    setNote("");
    setSourceType("clue");
    setSheetOpen(false);
    setIsExtracting(false);
    setStatus("已经收进来，稍后在电脑上捋");
    setJustCaptured(true);
  };

  return (
    <>
      <div className={styles.form}>
        <div className={styles.promptBlock}>
          <p className={styles.kicker}>Mobile Capture</p>
          <h2>今天想收什么？</h2>
          <p>粘贴链接、写一句线索，或者先留下一个还没想清的问题。</p>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="capture-raw">
            你刚刚看到 / 想到什么
          </label>
          <textarea
            id="capture-raw"
            className={styles.textarea}
            rows={4}
            value={rawInput}
            placeholder="粘贴 URL，或写下一个标题、一句话、模糊线索"
            onChange={(e) => setRawInput(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>先判断它大概是什么</span>
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

        <div className={styles.actions}>
          <button type="button" className={styles.submit} onClick={() => setSheetOpen(true)}>
            记一下
          </button>
          <button
            type="button"
            className={styles.secondaryAction}
            disabled={!canSubmit || isExtracting}
            onClick={handleConfirm}
          >
            稍后在电脑上捋
          </button>
        </div>
        {(status || justCaptured) && <p className={styles.confirmation}>{status || "收进来了"}</p>}
      </div>

      {sheetOpen && (
        <div className={styles.overlay} onClick={() => setSheetOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <span className={styles.sheetTitle}>记一下</span>
              <button
                type="button"
                className={styles.sheetClose}
                aria-label="关闭"
                onClick={() => setSheetOpen(false)}
              >
                ×
              </button>
            </div>
            <label className={styles.fieldLabel} htmlFor="capture-note">
              为什么想收进来
            </label>
            <textarea
              id="capture-note"
              className={styles.textarea}
              rows={4}
              autoFocus
              value={note}
              placeholder="哪句话、哪个想法、哪个问题让你想留下它"
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              type="button"
              className={styles.submit}
              disabled={!canSubmit || isExtracting}
              onClick={handleConfirm}
            >
              {isExtracting ? "正在整理" : "收进来"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

async function getEntryDraft(input: CaptureInput): Promise<EntryDraft> {
  try {
    const response = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) return createFallbackDraft(input);
    const data = (await response.json()) as { draft?: EntryDraft };
    return data.draft ?? createFallbackDraft(input);
  } catch {
    return createFallbackDraft(input);
  }
}
