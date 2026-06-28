import { useMemo, useState } from "react";
import type { Entry, SourceType } from "../../data/types";
import { SOURCE_TYPE_LABEL } from "../../data/types";
import { useAppState } from "../../state/useAppState";
import { getEntryDraft } from "../../utils/clientCapture";
import { formatRelative } from "../../utils/format";
import { inferSourceType, type CaptureInput } from "../../utils/extraction";
import styles from "./MobileCaptureExperience.module.css";

type MobileTab = "capture" | "reading" | "source";
type CaptureMode = "link" | "text" | "voice";

const MODE_TO_SOURCE: Record<CaptureMode, SourceType> = {
  link: "webpage",
  text: "clue",
  voice: "clue",
};

const SOURCE_CANDIDATES = [
  {
    id: "sam-altman-ai-world",
    title: "Sam Altman: How AI Will Change the World",
    source: "Stanford University",
    type: "YouTube",
    duration: "1:15:20",
    reason:
      "你提到 Sam Altman 和 AI 的未来，这条更像一次面向公众的长访谈。",
  },
  {
    id: "stanford-cs153-agents",
    title: "Stanford CS153 Lecture 1: Intro to Agents",
    source: "Stanford CS153",
    type: "YouTube",
    duration: "54:32",
    reason:
      "你之前记录过 CS153、Agent、记忆和长期上下文，可能与这条材料有关。",
  },
];

export function MobileCaptureExperience() {
  const { entries, dispatch } = useAppState();
  const [activeTab, setActiveTab] = useState<MobileTab>("capture");
  const [mode, setMode] = useState<CaptureMode>("link");
  const [rawInput, setRawInput] = useState("");
  const [captureNote, setCaptureNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");

  const latestPublic = useMemo(() => {
    return [...entries]
      .filter((entry) => entry.isPublic)
      .sort(
        (a, b) =>
          new Date(b.processedAt ?? b.capturedAt).getTime() -
          new Date(a.processedAt ?? a.capturedAt).getTime()
      )[0];
  }, [entries]);

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

  const confirmCandidate = (candidate: (typeof SOURCE_CANDIDATES)[number]) => {
    void saveCapture({
      rawInput: `${candidate.title} · ${candidate.source}`,
      captureNote: candidate.reason,
    });
    setActiveTab("capture");
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
        {activeTab === "reading" && <ReadingTab entry={latestPublic} />}
        {activeTab === "source" && (
          <SourceTab
            candidates={SOURCE_CANDIDATES}
            onConfirm={confirmCandidate}
            isSaving={isSaving}
          />
        )}
      </main>

      <nav className={styles.bottomTabs} aria-label="移动端主导航">
        <MobileTabButton
          label="收进来"
          active={activeTab === "capture"}
          onClick={() => setActiveTab("capture")}
        />
        <MobileTabButton
          label="公共阅读"
          active={activeTab === "reading"}
          onClick={() => setActiveTab("reading")}
        />
        <MobileTabButton
          label="找原材料"
          active={activeTab === "source"}
          onClick={() => setActiveTab("source")}
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
          ["voice", "语音线索"],
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
        {mode === "voice" ? "先把语音线索写下来" : "把你刚刚看到的、想到的，先收进来"}
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
            : mode === "voice"
              ? "比如：刚刚听到一个关于长期上下文的说法，和 agent 记忆有关"
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

function ReadingTab({ entry }: { entry?: Entry }) {
  if (!entry) {
    return (
      <section className={styles.panel}>
        <h1>公共阅读</h1>
        <p className={styles.lede}>还没有放到公开页的内容。电脑端确认后，这里会变成给人读的版本。</p>
      </section>
    );
  }

  return (
    <article className={styles.readingArticle}>
      <h1>{entry.title}</h1>
      <p className={styles.readingMeta}>
        {entry.origin} · {entry.processedAt ? formatRelative(entry.processedAt) : "刚刚更新"}
      </p>
      {entry.tags.length > 0 && (
        <div className={styles.tagRow}>
          {entry.tags.slice(0, 3).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}
      <p className={styles.sectionLabel}>这篇讲了什么</p>
      <p className={styles.readingBox}>{entry.whatItSays || "这条内容还没有整理摘要。"}</p>
      <p className={styles.sectionLabel}>作者附注</p>
      <p className={styles.readingBox}>{entry.relevanceToMe || "还没有作者附注。"}</p>
      <button type="button" className={styles.floatingNote}>
        记一下
      </button>
    </article>
  );
}

function SourceTab({
  candidates,
  onConfirm,
  isSaving,
}: {
  candidates: typeof SOURCE_CANDIDATES;
  onConfirm: (candidate: (typeof SOURCE_CANDIDATES)[number]) => void;
  isSaving: boolean;
}) {
  return (
    <section className={styles.panel}>
      <h1>找一下原材料</h1>
      <p className={styles.lede}>只记得一点线索，也可以先找回来。</p>
      <p className={styles.sectionLabel}>为你找到 2 条可能的内容</p>

      <div className={styles.candidateList}>
        {candidates.map((candidate) => (
          <article key={candidate.id} className={styles.candidateCard}>
            <div className={styles.thumb}>
              <span>{candidate.type}</span>
              <strong>{candidate.duration}</strong>
            </div>
            <div className={styles.candidateText}>
              <h2>{candidate.title}</h2>
              <p className={styles.candidateSource}>{candidate.source}</p>
              <p className={styles.matchLabel}>匹配理由</p>
              <p>{candidate.reason}</p>
            </div>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={isSaving}
              onClick={() => onConfirm(candidate)}
            >
              就是这个
            </button>
          </article>
        ))}
      </div>
      <button type="button" className={styles.secondaryButton}>
        再找找
      </button>
      <p className={styles.confirmHint}>确认后会进入电脑端待处理区</p>
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
