import {
  createFallbackDraft,
  type CaptureInput,
  type EntryDraft,
} from "./extraction";
import { loadMyContext, toCaptureMyContext } from "./myContext";

export async function getEntryDraft(input: CaptureInput): Promise<EntryDraft> {
  const payload: CaptureInput = { ...input, myContext: toCaptureMyContext(loadMyContext()) };
  try {
    const response = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return createFallbackDraft(payload);
    const data = (await response.json()) as { draft?: EntryDraft };
    return data.draft ?? createFallbackDraft(payload);
  } catch {
    return createFallbackDraft(payload);
  }
}
