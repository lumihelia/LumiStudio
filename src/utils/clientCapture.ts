import {
  createFallbackDraft,
  type CaptureInput,
  type CaptureMyContext,
  type EntryDraft,
} from "./extraction";
import { loadMyContext } from "./myContext";

function currentMyContext(): CaptureMyContext {
  const context = loadMyContext();
  return {
    currentProjects: context.current_projects,
    activeQuestions: context.active_questions,
    existingClaims: context.existing_claims,
  };
}

export async function getEntryDraft(input: CaptureInput): Promise<EntryDraft> {
  const payload: CaptureInput = { ...input, myContext: currentMyContext() };
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
