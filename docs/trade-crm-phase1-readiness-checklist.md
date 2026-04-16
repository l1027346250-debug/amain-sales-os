# Trade CRM Phase 1 Readiness Checklist

## Scope

This checklist is the phase-1 trial-run baseline for the current Trade CRM
workspace shell and integration-hub automation loop.

## Command

```bash
npm run verify:trade-crm-phase1-readiness
```

Full mode (include smoke):

```bash
npm run verify:trade-crm-phase1-readiness:full
```

Full mode + bootstrap prerequisites:

```bash
npm run verify:trade-crm-phase1-readiness:full:bootstrap
```

Direct PowerShell runner:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-trade-crm-phase1-readiness-local.ps1 -SkipSmoke
```

## What It Verifies

- Front-end full TypeScript check (`packages/twenty-front`)
- Integration-hub TypeScript check (`integration-hub`)
- Trade CRM smoke verification (`scripts/verify-trade-crm-smoke.js`)

The npm scripts use the PowerShell runner by default to avoid local Node
child-process permission issues seen in some Windows sandbox contexts.

When the target DB/workspace is not prepared yet, use
`verify:trade-crm-phase1-readiness:full:bootstrap` to initialize baseline DB
and workspace metadata before smoke.

## Output Artifacts

- `tmp/trade-crm-readiness/phase1-readiness-summary.json`
- `tmp/trade-crm-readiness/phase1-readiness-summary.md`

## Pass Criteria

- `status = passed`
- `failedCheckIds` is empty
- smoke check returns success (unless `--skip-smoke` is used)

## Full Smoke Prerequisites

- `PG_DATABASE_URL` points to an existing PostgreSQL database.
- Redis service is running and reachable from `REDIS_URL` (default
  `redis://127.0.0.1:6379`).
- Target database already contains Twenty workspace schema and tables
  (for example `workspace_<id>.workspaceMember`).
- Workspace bootstrap and required sample/seed context for smoke scripts are
  prepared before running `:full`.

Redis helper command:

```bash
npm run ensure:local-redis
```

The helper will:
- accept success immediately if Redis is already reachable
- try to start an existing Windows Redis service
- try common local `redis-server.exe` install paths
- fail fast with a clear message if no usable local Redis is available

Bootstrap helper command:

```bash
npm run prepare:trade-crm-smoke-prerequisites
```

This helper executes:
- `ensure:local-redis`
- sync `seed-dependencies/package.json` and `yarn.lock` into `packages/twenty-server/dist`
- `node dist/database/scripts/truncate-db.js`
- `node dist/database/scripts/setup-db.js`
- `node dist/command/command.js run-typeorm-migration --force`
- `node dist/command/command.js cache:flush`
- `node dist/command/command.js workspace:seed:dev`
- `workspace:init:trade-crm`
- `workspace:init:trade-crm:views`
- `workspace:config:trade-crm:opportunity-stages`
- `workspace:backfill:workspace-members`
- `workspace:list:workspace-members --limit 5`

## Failure First-Triage

1. If `frontend-typecheck` fails, fix current front-end compile errors first.
2. If `integration-hub-typecheck` fails, fix `integration-hub` compile errors.
3. If `trade-crm-smoke` fails, inspect `tmp/trade-crm-smoke` artifacts and rerun:
   - `npm run verify:trade-crm-smoke`
4. If smoke unexpectedly points to `.../default`, confirm local runner defaults still match the bootstrap DB (`postgres://postgres:postgres@127.0.0.1:5432/postgres`).
