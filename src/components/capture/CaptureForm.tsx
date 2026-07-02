import { useEffect, useRef, useState } from "react";
import { useAppState } from "../../state/useAppState";
import { capture, isYouTubeUrl, type CaptureError } from "../../utils/clientCapture";
import styles from "./CaptureForm.module.css";

type Mode = "text" | "file" | "youtube";

const ACCEPTED_FILE_TYPES = ".txt,.md,.pdf,.srt,.vtt";
const ACCEPTED_EXTENSIONS = new Set(["txt", "md", "pdf", "srt", "vtt"]);

const ERROR_MESSAGES: Record<CaptureError, string> = {
  no_transcript: "这个视频没有字幕，或者字幕暂时抓不到。LumiStudio 目前只支持有字幕的 YouTube 视频。",
  parse_failed: "文件解析失败，请检查文件格式或内容是否正确。",
  file_too_large: "文件太大了，文本文件最大 2MB，PDF 最大 5MB。",
  network_error: "网络有点问题，稍后再试试。",
};

export function CaptureForm() {
  const { dispatch } = useAppState();
  const [mode, setMode] = useState<Mode>("text");
  const [textInput, setTextInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [captureNote, setCaptureNote] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear error/status when user switches mode or changes input
  useEffect(() => { setErrorMsg(""); setStatusMsg(""); }, [mode]);
  useEffect(() => { setErrorMsg(""); }, [textInput, file, youtubeUrl]);

  const isValidYouTube = isYouTubeUrl(youtubeUrl.trim());

  const canSubmit =
    !isCapturing &&
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0] ?? null;
    handleFileSelect(dropped);
  };

  const handleCapture = async () => {
    if (!canSubmit) return;
    setIsCapturing(true);
    setErrorMsg("");
    setStatusMsg(mode === "youtube" ? "正在抓取字幕" : "正在整理成材料");

    const result = await capture(
      mode === "text"
        ? { mode: "text", rawInput: textInput, captureNote }
        : mode === "file"
          ? { mode: "file", file: file!, captureNote }
          : { mode: "youtube", url: youtubeUrl.trim(), captureNote }
    );

    setIsCapturing(false);

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
    setStatusMsg("已经收进来，稍后在电脑上捋");
    setTimeout(() => setStatusMsg(""), 3000);
  };

  return (
    <div className={styles.form}>
      <div className={styles.promptBlock}>
        <p className={styles.kicker}>收进来</p>
        <h2>今天想留下什么？</h2>
        <p>粘贴文字、上传文件，或者收一个有字幕的 YouTube 视频。</p>
      </div>

      {/* Mode tabs */}
      <div className={styles.modeTabs} role="tablist">
        {([
          ["text", "粘贴文字"],
          ["file", "上传文件"],
          ["youtube", "YouTube 链接"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            className={mode === value ? `${styles.modeTab} ${styles.modeTabActive}` : styles.modeTab}
            onClick={() => setMode(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Mode content */}
      {mode === "text" && (
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="capture-text">
            粘贴你想收进来的文字内容
          </label>
          <textarea
            id="capture-text"
            className={styles.textarea}
            rows={7}
            value={textInput}
            placeholder="粘贴文章正文、笔记、书摘……"
            onChange={(e) => setTextInput(e.target.value)}
          />
        </div>
      )}

      {mode === "file" && (
        <div className={styles.field}>
          <span className={styles.fieldLabel}>上传文件</span>
          <div
            className={isDragOver ? `${styles.fileZone} ${styles.fileZoneDragOver}` : styles.fileZone}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
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
                <span className={styles.fileSize}>
                  {file.size < 1024 * 1024
                    ? `${Math.round(file.size / 1024)} KB`
                    : `${(file.size / 1024 / 1024).toFixed(1)} MB`}
                </span>
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
                <span>拖拽文件到这里，或点击选择</span>
                <small>支持 TXT、Markdown、PDF、SRT、VTT</small>
              </div>
            )}
          </div>
        </div>
      )}

      {mode === "youtube" && (
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="capture-youtube">
            粘贴 YouTube 视频链接
          </label>
          <input
            id="capture-youtube"
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
            <small className={styles.urlHint}>请粘贴完整的 YouTube 视频链接</small>
          )}
          {isValidYouTube && (
            <small className={styles.urlHintOk}>已识别为 YouTube 视频，点击收进来后会自动抓取字幕</small>
          )}
        </div>
      )}

      {/* Note field — shared across all modes */}
      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="capture-note">
          为什么想收进来？
        </label>
        <textarea
          id="capture-note"
          className={styles.noteArea}
          rows={2}
          value={captureNote}
          placeholder="哪句话、哪个想法、哪个问题让你想留下它"
          onChange={(e) => setCaptureNote(e.target.value)}
        />
      </div>

      <button
        type="button"
        className={styles.submit}
        disabled={!canSubmit}
        onClick={() => void handleCapture()}
      >
        {isCapturing
          ? mode === "youtube" ? "正在抓取字幕" : "正在整理"
          : "收进来"}
      </button>

      {statusMsg && <p className={styles.statusOk}>{statusMsg}</p>}
      {errorMsg && <p className={styles.statusError}>{errorMsg}</p>}
    </div>
  );
}
