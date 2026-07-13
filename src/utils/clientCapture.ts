import { isYouTubeUrl, type EntryDraft } from "./extraction";
import { loadMyContext, toCaptureMyContext } from "./myContext";
import { supabase } from "../lib/supabaseClient";

export type CaptureError = "no_transcript" | "parse_failed" | "file_too_large" | "analysis_unavailable" | "network_error";

export type CaptureResult =
  | { ok: true; draft: EntryDraft }
  | { ok: false; error: CaptureError };

export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

// ---------------------------------------------------------------------------
// Unified capture entry point — used by both CaptureForm and Mobile
// ---------------------------------------------------------------------------

type CaptureSource =
  | { mode: "text"; rawInput: string; captureNote: string }
  | { mode: "file"; file: File; captureNote: string }
  | { mode: "youtube"; url: string; captureNote: string };

export async function capture(source: CaptureSource): Promise<CaptureResult> {
  const myContext = toCaptureMyContext(loadMyContext());

  if (source.mode === "text") {
    const payload = {
      mode: "text",
      rawInput: source.rawInput,
      captureNote: source.captureNote,
      myContext,
    };
    return postExtract(payload);
  }

  if (source.mode === "youtube") {
    const payload = {
      mode: "youtube",
      url: source.url,
      captureNote: source.captureNote,
      myContext,
    };
    return postExtract(payload);
  }

  // mode === "file"
  const { file, captureNote } = source;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  const MAX_PDF = 5 * 1024 * 1024;       // 5 MB
  const MAX_TEXT = 2 * 1024 * 1024;      // 2 MB

  const isPdf = ext === "pdf";
  const maxSize = isPdf ? MAX_PDF : MAX_TEXT;
  if (file.size > maxSize) {
    return { ok: false, error: "file_too_large" };
  }

  let fileContent: string;
  if (isPdf) {
    // PDF → base64
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    fileContent = btoa(binary);
  } else {
    fileContent = await file.text();
  }

  const payload = {
    mode: "file",
    fileType: ext,
    fileContent,
    fileName: file.name,
    captureNote,
    myContext,
  };
  return postExtract(payload);
}

async function postExtract(payload: Record<string, unknown>): Promise<CaptureResult> {
  try {
    const response = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(payload),
    });

    if (response.status === 422 || response.status === 503) {
      const data = (await response.json()) as { error?: string };
      if (data.error === "no_transcript") return { ok: false, error: "no_transcript" };
      if (data.error === "file_too_large") return { ok: false, error: "file_too_large" };
      if (data.error === "analysis_unavailable") return { ok: false, error: "analysis_unavailable" };
      return { ok: false, error: "parse_failed" };
    }

    if (!response.ok) return { ok: false, error: "network_error" };

    const data = (await response.json()) as { draft?: EntryDraft };
    if (!data.draft) return { ok: false, error: "parse_failed" };
    return { ok: true, draft: data.draft };
  } catch {
    return { ok: false, error: "network_error" };
  }
}

// Re-export so existing import sites still compile
export { isYouTubeUrl };
