import type { Entry } from "./types.js";

export interface EntryRow {
  id: string;
  source_type: string;
  title: string;
  origin: string;
  capture_note: string;
  what_it_says: string;
  relevance_to_me: string;
  project_tag: string | null;
  judgment_statement: string;
  next_action: string;
  status: string;
  is_public: boolean;
  captured_at: string;
  processed_at: string | null;
  tags: string[] | null;
  core_bullets: string[] | null;
  retell: string;
  publish_capture_note: boolean;
  publish_relevance_to_me: boolean;
}

export function rowToEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    sourceType: row.source_type as Entry["sourceType"],
    title: row.title,
    origin: row.origin,
    captureNote: row.capture_note,
    whatItSays: row.what_it_says,
    relevanceToMe: row.relevance_to_me,
    projectTag: row.project_tag,
    judgmentStatement: row.judgment_statement,
    nextAction: row.next_action,
    status: row.status as Entry["status"],
    isPublic: row.is_public,
    capturedAt: row.captured_at,
    processedAt: row.processed_at,
    tags: row.tags ?? [],
    coreBullets: row.core_bullets ?? [],
    retell: row.retell ?? "",
    publishCaptureNote: row.publish_capture_note ?? false,
    publishRelevanceToMe: row.publish_relevance_to_me ?? false,
  };
}

export function entryToRow(entry: Partial<Entry>): Partial<EntryRow> {
  const row: Partial<EntryRow> = {};
  if (entry.id !== undefined) row.id = entry.id;
  if (entry.sourceType !== undefined) row.source_type = entry.sourceType;
  if (entry.title !== undefined) row.title = entry.title;
  if (entry.origin !== undefined) row.origin = entry.origin;
  if (entry.captureNote !== undefined) row.capture_note = entry.captureNote;
  if (entry.whatItSays !== undefined) row.what_it_says = entry.whatItSays;
  if (entry.relevanceToMe !== undefined) row.relevance_to_me = entry.relevanceToMe;
  if (entry.projectTag !== undefined) row.project_tag = entry.projectTag;
  if (entry.judgmentStatement !== undefined) row.judgment_statement = entry.judgmentStatement;
  if (entry.nextAction !== undefined) row.next_action = entry.nextAction;
  if (entry.status !== undefined) row.status = entry.status;
  if (entry.isPublic !== undefined) row.is_public = entry.isPublic;
  if (entry.capturedAt !== undefined) row.captured_at = entry.capturedAt;
  if (entry.processedAt !== undefined) row.processed_at = entry.processedAt;
  if (entry.tags !== undefined) row.tags = entry.tags;
  if (entry.coreBullets !== undefined) row.core_bullets = entry.coreBullets;
  if (entry.retell !== undefined) row.retell = entry.retell;
  if (entry.publishCaptureNote !== undefined) row.publish_capture_note = entry.publishCaptureNote;
  if (entry.publishRelevanceToMe !== undefined) row.publish_relevance_to_me = entry.publishRelevanceToMe;
  return row;
}
