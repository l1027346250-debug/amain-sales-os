# Trade CRM AI Assistant (Floating Entry)

This note documents the phase-1 AI assistant entry pattern for the Trade CRM
project:

- A **global floating entry** inside `twenty-front` for quick access.
- A **lightweight suggestion API** inside `integration-hub` for cross-object
  guidance output.

This is intentionally designed as a minimal, safe starting point:

- AI returns suggestions/summaries/drafts/scores only.
- AI must not directly mutate critical CRM statuses (lead/opportunity/task
  states).

## Frontend behavior

`AIAssistantFloatingEntry` is mounted globally through the main container layout
that already owns the side panel.

What it does:

- Click the floating button to open a small popover.
- Popover shows:
  - "Open chat" which opens `SidePanelPages.AskAI`.
  - Context-aware suggested prompts (either from `integration-hub` or a local
    fallback list).
- Selecting a suggested prompt pre-fills `agentChatInputState` and opens the
  Ask AI side panel with the editor focused.

The entry respects the existing feature flag:

- Hidden unless `FeatureFlagKey.IS_AI_ENABLED` is enabled in the workspace.

## Backend behavior (integration-hub)

The phase-1 AI assistant endpoints live under:

- `GET /api/ai-assistant/capabilities`
- `POST /api/ai-assistant/suggestions`
- `POST /api/ai-assistant/generate`

`/suggestions` accepts `{ "context": "workbench|lead|company|people|opportunity|task|general" }`
and returns a list of suggested prompts.

`/generate` is a safe placeholder implementation that returns deterministic
outputs for:

- `summary`
- `next_action`
- `draft`
- `lead_score`

Wiring a real LLM later should happen inside `integration-hub` by extending
`AiAssistantService` without moving external integration logic into Twenty
core.

## Config

The frontend fetches `integration-hub` suggestions via:

- `REACT_APP_INTEGRATION_HUB_API_BASE_URL`

If not set, local dev defaults to:

- `http://127.0.0.1:3020/api`

## Extension points (phase 1)

- Update suggestions per context:
  - `packages/twenty-front/src/modules/ai/components/AIAssistantFloatingEntry.tsx`
  - `integration-hub/src/modules/ai-assistant/ai-assistant.service.ts`
- Add new safe generate types (read-only):
  - `integration-hub/src/modules/ai-assistant/ai-assistant.service.ts`

