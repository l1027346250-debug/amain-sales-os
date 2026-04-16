# Trade CRM Sales Workbench Route Registration and Navigation Entry Decision Draft

Last updated: 2026-04-08

## 1. Purpose

This document defines the next planning decision for the first sales workbench
implementation slice:

- where the workbench route should be registered
- how it should be represented in `AppPath`
- where it should enter the current navigation drawer structure

It is grounded in the currently observed frontend files:

- `packages/twenty-front/src/modules/app/components/AppRouter.tsx`
- `packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx`
- `packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerNavigationContent.tsx`
- `packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerScrollableItems.tsx`
- `packages/twenty-front/src/modules/navigation/components/NavigationDrawerOtherSection.tsx`
- `packages/twenty-shared/src/types/AppPath.ts`

## 2. Current Structure Observed

### 2.1 Route registration

Current route registration flows through:

- `AppPath`
- `useCreateAppRouter`
- lazily imported page entries under `src/pages`

Current onboarded route examples:

- `AppPath.Index = '/'`
- `AppPath.TasksPage = '/objects/tasks'`
- `AppPath.OpportunitiesPage = '/objects/opportunities'`
- `AppPath.RecordIndexPage = '/objects/:objectNamePlural'`

### 2.2 Navigation structure

Main navigation is currently driven through:

- `MainNavigationDrawerScrollableItems`
- opened section
- favorites section
- workspace section
- other section

This strongly suggests the sales workbench should not be injected into the
`Other` section.

## 3. Core Recommendation

### 3.1 Recommended route strategy

Recommendation:

- add a dedicated new app path for the sales workbench

Suggested placeholder:

- `AppPath.SalesWorkbench = '/sales-workbench'`

Reason:

- it matches the existing route registration style
- it avoids hiding the workbench behind a generic object route
- it keeps the workbench as an intentional primary working surface

### 3.2 Recommended route registration location

Recommended files to extend:

- `packages/twenty-shared/src/types/AppPath.ts`
- `packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx`
- `packages/twenty-front/src/pages/workbench/SalesWorkbenchPage.tsx`

Recommended pattern:

1. add `AppPath.SalesWorkbench`
2. lazy-load `SalesWorkbenchPage`
3. register a direct route in `useCreateAppRouter`

This is the lowest-friction path that still matches the current router style.

## 4. Navigation Entry Decision

### 4.1 Recommended entry section

Recommendation:

- put the sales workbench in the main workspace-oriented navigation area
- do not place it in `NavigationDrawerOtherSection`

Reason:

- `Other` currently behaves like utility/meta navigation
- the workbench is a primary day-to-day operating surface
- placing it in the workspace-oriented area makes it consistent with object and
  record work, not with help/settings utilities

### 4.2 Recommended entry type

Recommendation:

- add it as a first-class navigation entry, not only as a hidden route

Reason:

- the workbench is supposed to become the first daily action surface
- hiding it behind index redirects or utility links would weaken adoption

## 5. Recommended Exact Decision

The recommended first implementation decision is:

1. `AppPath.SalesWorkbench = '/sales-workbench'`
2. register the route directly in `useCreateAppRouter`
3. lazy-load `pages/workbench/SalesWorkbenchPage`
4. add one explicit primary navigation item in the workspace-oriented section
5. keep all block drill-down destinations pointed at native object views and
   record pages

This keeps the workbench as:

- one new route
- one new primary operating entry
- one aggregator over existing Lead / Task / Opportunity flows

## 6. What Not To Do

The first slice should avoid these route/navigation choices:

### 6.1 Do not hide the workbench inside `Index`

Do not overload:

- `AppPath.Index`

Reason:

- it would blur home/index behavior with a new sales operating surface
- it makes later manager or role-specific variants harder to separate

### 6.2 Do not put it under a generic object route

Do not force it into:

- `/objects/...`

Reason:

- the workbench is not a single-object list
- it aggregates multiple objects plus one hybrid operational block

### 6.3 Do not place it in `Other`

Do not place it in the current utility-style other section next to:

- settings
- documentation

Reason:

- that communicates the wrong product importance

## 7. Suggested First Code Touch Points

When the team starts the first frontend implementation slice, the smallest
expected code touch set should be:

1. `packages/twenty-shared/src/types/AppPath.ts`
2. `packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx`
3. `packages/twenty-front/src/pages/workbench/SalesWorkbenchPage.tsx`
4. the workspace-oriented navigation registration path

Only after that should the team add:

- workbench block components
- workbench hooks
- hybrid first-response adapter

## 8. Open Decision Still Remaining

One navigation-related decision is still unresolved even after this draft:

- the exact existing frontend module/file that owns workspace-oriented primary
  navigation item registration for a new non-object page

This round narrows the answer to "workspace-oriented main navigation", but the
exact registration file still needs one final code-facing confirmation in the
next implementation round.

## 9. Recommended Next Action

The next code-facing round should start with:

1. confirm the exact navigation registration file in the current workspace
   section flow
2. add `AppPath.SalesWorkbench`
3. add `SalesWorkbenchPage`
4. wire the route in `useCreateAppRouter`
5. only then begin block implementation

This is the lowest-risk path to first UI delivery.
