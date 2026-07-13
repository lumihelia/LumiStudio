# Context Delta

Date: 2026-07-13
Agent: Codex
Task: Correct material-extraction provider and remove silent fallback output

## Proposed Updates

### `.context/02_decision_log.md`

Proposed change: Supersede the historical Gemini-only extraction decision. Material extraction and relation discovery use the configured server-side DeepSeek API through the OpenAI-compatible chat-completions endpoint, with JSON output and thinking disabled for bounded interactive latency.

Reason: The user confirmed that this project is configured for DeepSeek. The previous extraction path used Gemini while relation discovery already used DeepSeek, creating an unintended provider split and a silent fallback path that stored raw source text as if it were an interpretation.

Evidence: User instruction on 2026-07-13; `api/relations.ts`; DeepSeek official model and thinking-mode documentation.

Risk level: high

## Requires User Confirmation

- Confirm this is the intended durable provider boundary before updating the decision log.

## Safe to Apply

- Code uses only `DEEPSEEK_API_KEY` and `DEEPSEEK_MODEL` server-side.
- Failed or incomplete structured extraction returns an explicit error and does not create a misleading entry.
