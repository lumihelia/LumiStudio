import { useMemo, useState } from "react";
import type { Entry, SourceType } from "../../data/types";
import { SOURCE_TYPE_LABEL } from "../../data/types";
import { useAppState } from "../../state/useAppState";
import { getEntryDraft } from "../../utils/clientCapture";
import { formatRelative } from "../../utils/format";
import { inferSourceType, type CaptureInput } from "../../utils/extraction";
import styles from "./MobileCaptureExperience.module.css";

type CaptureMode = "link" | "text";

const MODE_TO_SOURCE: Record<CaptureMode, SourceType> = {
  link: "webpage",
  text: "clue",
};

export function MobileCaptureExperience() {
  const { entries, dispatch } = useAppState();
  const activeTab = "capture";
  const [mode, setMode] = useState<CaptureMode>("link");
  const [rawInput, setRawInput] = useState("");
  const [captureNote, setCaptureNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");

  const recent = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
      .slice(0, 2);
  }, [entries]);

  const canSave = rawInput.trim().length > 0 || captureNote.trim().length > 0;

  const saveCapture = async (override?: { rawInput: string; captureNote: string }) => {
    const nextRaw = override?.rawInput ?? rawInput;
    const nextNote = override?.captureNote ?? captureNote;
    if ((!nextRaw.trim() && !nextNote.trim()) || isSaving) return;

    const sourceType = inferSourceType(nextRaw, MODE_TO_SOURCE[mode]);
    const input: CaptureInput = {
      rawInput: nextRaw,
      captureNote: nextNote,
      sourceType,
    };

    setIsSaving(true);
    setStatus("正在整理成材料");
    const draft = await getEntryDraft(input);
    dispatch({ type: "ADD_ENTRY", payload: draft });
    setRawInput("");
    setCaptureNote("");
    setIsSaving(false);
    setStatus("已进入电脑端待处理区");
  };

  return (
    <div className={styles.mobileShell}>
      <header className={styles.appHeader}>
        <span className={styles.brand}>LumiStudio</span>
        <button type="button" className={styles.iconButton} aria-label="收件箱">
          收
        </button>
      </header>

      <main className={styles.content}>
        {activeTab === "capture" && (
          <CaptureTab
            mode={mode}
            setMode={setMode}
            rawInput={rawInput}
            setRawInput={setRawInput}
            captureNote={captureNote}
            setCaptureNote={setCaptureNote}
            canSave={canSave}
            isSaving={isSaving}
            status={status}
            recent={recent}
            onSave={() => void saveCapture()}
          />
        )}
      </main>

      <nav className={styles.bottomTabs} aria-label="移动端主导航">
        <MobileTabButton
          label="收进来"
          active={activeTab === "capture"}
          onClick={() => undefined}
        />
      </nav>
    </div>
  );
}

function CaptureTab({
  mode,
  setMode,
  rawInput,
  setRawInput,
  captureNote,
  setCaptureNote,
  canSave,
  isSaving,
  status,
  recent,
  onSave,
}: {
  mode: CaptureMode;
  setMode: (mode: CaptureMode) => void;
  rawInput: string;
  setRawInput: (value: string) => void;
  captureNote: string;
  setCaptureNote: (value: string) => void;
  canSave: boolean;
  isSaving: boolean;
  status: string;
  recent: Entry[];
  onSave: () => void;
}) {
  return (
    <section className={styles.panel}>
      <h1>收进来</h1>
      <p className={styles.lede}>把有价值的材料先收进来，稍后再整理。</p>

      <div className={styles.modeTabs} role="tablist" aria-label="收集类型">
        {[
          ["link", "链接"],
          ["text", "文本"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            className={mode === value ? `${styles.modeTab} ${styles.modeTabActive}` : styles.modeTab}
            onClick={() => setMode(value as CaptureMode)}
          >
            {label}
          </button>
        ))}
      </div>

      <label className={styles.label} htmlFor="mobile-capture-raw">
        把你刚刚看到的、想到的，先收进来
      </label>
      <textarea
        id="mobile-capture-raw"
        className={styles.largeInput}
        value={rawInput}
        maxLength={2000}
        rows={7}
        placeholder={
          mode === "link"
            ? "粘贴文章、视频、播客或网页链接"
            : "写下一句话、一个标题，或还没想清的线索"
        }
        onChange={(event) => setRawInput(event.target.value)}
      />
      <p className={styles.counter}>{rawInput.length} / 2000</p>

      <label className={styles.label} htmlFor="mobile-capture-note">
        为什么想收进来？
      </label>
      <textarea
        id="mobile-capture-note"
        className={styles.noteInput}
        value={captureNote}
        maxLength={200}
        rows={3}
        placeholder="这可能和我最近在想的什么有关"
        onChange={(event) => setCaptureNote(event.target.value)}
      />
      <p className={styles.counter}>{captureNote.length} / 200</p>

      <button
        type="button"
        className={styles.primaryButton}
        disabled={!canSave || isSaving}
        onClick={onSave}
      >
        {isSaving ? "正在整理" : "收进来"}
      </button>
      <p className={styles.desktopHint}>稍后在电脑上捋</p>
      {status && <p className={styles.status}>{status}</p>}

      {recent.length > 0 && (
        <div className={styles.recentBlock}>
          <p className={styles.sectionLabel}>刚收进来的</p>
          {recent.map((entry) => (
            <article key={entry.id} className={styles.recentItem}>
              <p>{entry.title}</p>
              <span>
                {SOURCE_TYPE_LABEL[entry.sourceType]} · {formatRelative(entry.capturedAt)}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function MobileTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? `${styles.bottomTab} ${styles.bottomTabActive}` : styles.bottomTab}
      onClick={onClick}
    >
      <span aria-hidden="true" />
      {label}
    </button>
  );
}
