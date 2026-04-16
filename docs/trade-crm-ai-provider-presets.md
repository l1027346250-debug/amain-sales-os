# Trade CRM AI Provider Presets

The admin AI provider setup now supports an OpenClaw-style preset directory on
top of Twenty's existing provider registry.

## Goal

Make provider onboarding fast for operations teams:

- choose a known provider card first
- auto-fill `npm`, `label`, and `baseUrl`
- keep the existing custom-provider and model-management flow

## Presets included

- Anthropic
- OpenAI
- Google
- OpenRouter
- MiniMax (CN)
- Moonshot (CN)
- SiliconFlow (CN)
- MiniMax (Global)
- ByteDance Ark
- Ollama
- Custom

## Notes

- Native SDK presets use the existing Twenty AI SDK provider flow.
- Aggregator and China-market presets use `@ai-sdk/openai-compatible` with a
  default `baseUrl`.
- Ollama uses an OpenAI-compatible local endpoint preset:
  `http://127.0.0.1:11434/v1`
- Teams can still use the dynamic provider catalog and fully custom setup.
- Some regional endpoints can vary by provider plan or account region. The
  preset values are intended as fast-start defaults and can be edited after
  selection.

## Main extension points

- Preset directory:
  `packages/twenty-front/src/modules/settings/admin-panel/ai/constants/OpenClawProviderPresets.ts`
- Icon mapping:
  `packages/twenty-front/src/modules/settings/admin-panel/ai/constants/ProviderConfig.ts`
- Provider setup page:
  `packages/twenty-front/src/pages/settings/admin-panel/SettingsAdminNewAiProvider.tsx`
- Provider detail edit/test page:
  `packages/twenty-front/src/pages/settings/admin-panel/SettingsAdminAiProviderDetail.tsx`
- Admin GraphQL mutations for provider update/test:
  `packages/twenty-server/src/engine/core-modules/admin-panel/admin-panel.resolver.ts`

## Current connection test behavior

- Custom providers can now be edited in the provider detail page.
- Connection test currently performs a real model-list probe for:
  - `@ai-sdk/openai`
  - `@ai-sdk/openai-compatible`
  - endpoint: `/models`
  - auth: `Authorization: Bearer <apiKey>`
- `@ai-sdk/anthropic`
  - endpoint: `/v1/models`
  - auth: `x-api-key` + `anthropic-version: 2023-06-01`
- `@ai-sdk/google`
  - endpoint: `/models?key=<apiKey>`
  - default base URL: `https://generativelanguage.googleapis.com/v1beta`
- Other SDKs currently validate configuration by building the provider instance
  and return a warning that live probing is not yet implemented.
- The provider detail page now also shows:
  - HTTP status when the endpoint answers with an error
  - detected auth mode/header when available
  - sample model names from the probe response
  - provider-specific next-step hints for Ollama, OpenRouter, Anthropic, and Google
- Saving a custom provider now automatically triggers a lightweight connection
  test, so teams can validate credentials without a second manual action.
- The provider list now shows readiness-oriented labels such as `Ready`,
  `Needs API key`, `Needs endpoint`, and `Local runtime` to speed up setup
  review from the overview page.
- The overview page now supports one-click provider testing from the list, so
  teams can run a lightweight connectivity check without opening the detail
  page first.
- The overview page also provides `Test All` actions for built-in providers and
  custom providers, making it easier to run a quick readiness sweep after
  configuration changes.
- The overview list now keeps the latest in-session test result for each
  provider, including the last checked time and model count when available.
- The overview groups also provide `Test Unready`, so operations teams can
  focus on providers that still show setup warnings before re-testing the full
  list.
- The overview groups also provide `Retest Failed`, which re-runs probes only
  for providers that failed in the current browser session.
- When a provider probe fails, the overview list now shows the latest failure
  reason inline, so teams can spot auth or endpoint issues without opening the
  detail page first.
- The latest overview probe results are also persisted in the browser, so the
  recent pass/fail state survives a page refresh on the same machine.
- Each overview group also provides `Clear Results`, so teams can reset the
  saved probe history for built-in providers or custom providers without
  clearing the whole browser storage manually.
- Each provider row can also clear its own saved probe result, so teams can
  reset one noisy entry without wiping the whole group.
- The provider overview description now uses a normalized `|` separator, so
  region, endpoint, and credential hints render more cleanly in the list.
- The provider overview now sorts providers by attention, so recent failures
  and not-ready entries stay near the top of each group before fully ready
  providers.
- The provider overview also supports `All`, `Needs Attention`, and `Failed`
  filters, so teams can narrow the list to the providers that need follow-up
  without changing the underlying test workflow.
- The filter buttons also show simple counts, so teams can estimate the current
  setup backlog before switching views.
- When a filtered provider group becomes empty, the overview now shows a small
  empty-state card instead of a blank area, making it clearer that the current
  filter returned no matching providers.
- The overview also includes a `Reset View` shortcut so operators can quickly
  jump back to the default full-list view after focused troubleshooting.
- The active filter now also shows a small status tag, so operators can tell at
  a glance whether they are looking at the full list, attention items, or only
  failed providers.
