import { useMemo, useRef, useState } from "react";
import type { Entry } from "../../data/types";
import { SOURCE_TYPE_LABEL } from "../../data/types";
import { useAppState } from "../../state/useAppState";
import { capture, isYouTubeUrl, type CaptureError } from "../../utils/clientCapture";
import { formatRelative } from "../../utils/format";
import styles from "./MobileCaptureExperience.module.css";

type CaptureMode = "text" | "file" | "youtube";

const ACCEPTED_FILE_TYPES = ".txt,.md,.pdf,.srt,.vtt";
const ACCEPTED_EXTENSIONS = new Set(["txt", "md", "pdf", "srt", "vtt"]);

const ERROR_MESSAGES: Record<CaptureError, string> = {
  no_transcript: "这个视频没有字幕，或者字幕暂时抓不到。",
  parse_failed: "文件解析失败，请检查格式。",
  file_too_large: "文件太大，文本最大 2MB，PDF 最大 5MB。",
  network_error: "网络有点问题，稍后再试试。",
};

export function MobileCaptureExperience() {
  const { entries, dispatch } = useAppState();
  const [mode, setMode] = useState<CaptureMode>("text");
  const [textInput, setTextInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [captureNote, setCaptureNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recent = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
      .slice(0, 2);
  }, [entries]);

  const isValidYouTube = isYouTubeUrl(youtubeUrl.trim());

  const canSave =
    !isSaving &&
    (mode === "text"
      ? textInput.trim().length > 0
      : mode === "file"
        ? file !== null
        : isValidYouTube);

  const handleFileSelect = (selected: File | null) => {
    if (!selected) { setFile(null); return; }
    const ext = selected.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED_EXTENSIONS.has(ext)) {
      setErrorMsg("只支持 TXT、Markdown、PDF、SRT 或 VTT 格式的文件。");
      return;
    }
    setFile(selected);
    setErrorMsg("");
  };

  const discardEntry = (id: string) => {
    dispatch({ type: "DISCARD_ENTRY", payload: { id } });
  };

  const saveCapture = async () => {
    if (!canSave) return;
    setIsSaving(true);
    setErrorMsg("");
    setStatusMsg(mode === "youtube" ? "正在抓取字幕" : "正在整理成材料");

    const result = await capture(
      mode === "text"
        ? { mode: "text", rawInput: textInput, captureNote }
        : mode === "file"
          ? { mode: "file", file: file!, captureNote }
          : { mode: "youtube", url: youtubeUrl.trim(), captureNote }
    );

    setIsSaving(false);

    if (!result.ok) {
      setStatusMsg("");
      setErrorMsg(ERROR_MESSAGES[result.error]);
      return;
    }

    dispatch({ type: "ADD_ENTRY", payload: result.draft });
    setTextInput("");
    setFile(null);
    setYoutubeUrl("");
    setCaptureNote("");
    setStatusMsg("已进入电脑端待处理区");
    setTimeout(() => setStatusMsg(""), 3000);
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
        <section className={styles.panel}>
          <h1>收进来</h1>
          <p className={styles.lede}>把有价值的材料先收进来，稍后再整理。</p>

          {/* Mode tabs */}
          <div className={styles.modeTabs} role="tablist" aria-label="收集方式">
            {([
              ["text", "粘贴文字"],
              ["file", "上传文件"],
              ["youtube", "YouTube"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                className={
                  mode === value
                    ? `${styles.modeTab} ${styles.modeTabActive}`
                    : styles.modeTab
                }
                onClick={() => { setMode(value); setErrorMsg(""); setStatusMsg(""); }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Text mode */}
          {mode === "text" && (
            <>
              <label className={styles.label} htmlFor="m-capture-text">
                粘贴文字内容
              </label>
              <textarea
                id="m-capture-text"
                className={styles.largeInput}
                value={textInput}
                maxLength={8000}
                rows={7}
                placeholder="粘贴文章正文、书摘、笔记……"
                onChange={(e) => setTextInput(e.target.value)}
              />
              <p className={styles.counter}>{textInput.length} / 8000</p>
            </>
          )}

          {/* File mode */}
          {mode === "file" && (
            <>
              <label className={styles.label}>上传文件</label>
              <div
                className={styles.fileZone}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  className={styles.fileInputHidden}
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <div className={styles.fileSelected}>
                    <span className={styles.fileName}>{file.name}</span>
                    <button
                      type="button"
                      className={styles.fileRemove}
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    >
                      删除
                    </button>
                  </div>
                ) : (
                  <div className={styles.filePrompt}>
                    <span>点击选择文件</span>
                    <small>TXT、Markdown、PDF、SRT、VTT</small>
                  </div>
                )}
              </div>
            </>
          )}

          {/* YouTube mode */}
          {mode === "youtube" && (
            <>
              <label className={styles.label} htmlFor="m-capture-youtube">
                粘贴 YouTube 链接
              </label>
              <input
                id="m-capture-youtube"
                type="url"
                className={
                  youtubeUrl && !isValidYouTube
                    ? `${styles.urlInput} ${styles.urlInputInvalid}`
                    : styles.urlInput
                }
                value={youtubeUrl}
                placeholder="https://www.youtube.com/watch?v=..."
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
              {youtubeUrl && !isValidYouTube && (
                <small className={styles.urlHint}>请粘贴完整的 YouTube 链接</small>
              )}
              {isValidYouTube && (
                <small className={styles.urlHintOk}>识别到 YouTube 视频，会自动抓取字幕</small>
              )}
            </>
          )}

          {/* Shared note field */}
          <label className={styles.label} htmlFor="m-capture-note">
            为什么想收进来？
          </label>
          <textarea
            id="m-capture-note"
            className={styles.noteInput}
            value={captureNote}
            maxLength={200}
            rows={3}
            placeholder="这可能和我最近在想的什么有关"
            onChange={(e) => setCaptureNote(e.target.value)}
          />
          <p className={styles.counter}>{captureNote.length} / 200</p>

          <button
            type="button"
            className={styles.primaryButton}
            disabled={!canSave}
            onClick={() => void saveCapture()}
          >
            {isSaving
              ? mode === "youtube" ? "正在抓取字幕" : "正在整理"
              : "收进来"}
          </button>
          <p className={styles.desktopHint}>稍后在电脑上捋</p>

          {statusMsg && <p className={styles.statusOk}>{statusMsg}</p>}
          {errorMsg && <p className={styles.statusError}>{errorMsg}</p>}

          {recent.length > 0 && (
            <div className={styles.recentBlock}>
              <p className={styles.sectionLabel}>刚收进来的</p>
              {recent.map((entry) => (
                <RecentItem key={entry.id} entry={entry} onDiscard={discardEntry} />
              ))}
            </div>
          )}
        </section>
      </main>

      <nav className={styles.bottomTabs} aria-label="移动端主导航">
        <button type="button" className={`${styles.bottomTab} ${styles.bottomTabActive}`}>
          <span aria-hidden="true" />
          收进来
        </button>
      </nav>
    </div>
  );
}

function RecentItem({ entry, onDiscard }: { entry: Entry; onDiscard: (id: string) => void }) {
  return (
    <article className={styles.recentItem}>
      <div>
        <p>{entry.title}</p>
        <span>
          {SOURCE_TYPE_LABEL[entry.sourceType]} · {formatRelative(entry.capturedAt)}
        </span>
      </div>
      <button
        type="button"
        aria-label={`从界面移除 ${entry.title}`}
        onClick={() => onDiscard(entry.id)}
      >
        删除
      </button>
    </article>
  );
}
