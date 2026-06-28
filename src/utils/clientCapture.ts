import {
  createFallbackDraft,
  type CaptureInput,
  type EntryDraft,
} from "./extraction";

export async function getEntryDraft(input: CaptureInput): Promise<EntryDraft> {
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
