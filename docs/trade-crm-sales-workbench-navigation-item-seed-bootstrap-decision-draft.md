# Trade CRM Sales Workbench Navigation Item Seed Bootstrap Decision Draft

Last updated: 2026-04-08

## 1. Purpose

This document resolves the last implementation-planning question before the
first real sales workbench frontend slice:

- how the default `Sales Workbench` workspace navigation entry should be
  created
- whether the first implementation should prefer backend/bootstrap seeding or a
  frontend rollout creation path

It builds on:

- `docs/trade-crm-sales-workbench-route-registration-navigation-decision-draft.md`
- `docs/trade-crm-sales-workbench-navigation-menu-item-registration-draft.md`

## 2. Current Code Signals

### 2.1 Workspace navigation items are metadata-backed and frontend-managed

The currently observed workspace navigation path is:

- read through `navigationMenuItemsSelector`
- filtered by `filterWorkspaceNavigationMenuItems(...)`
- rendered through the workspace `navigation-menu-item` section

The main creation/save hooks currently visible from the frontend are:

- `useCreateManyNavigationMenuItems`
- `useSaveNavigationMenuItemsDraft`
- `useAddLinkToNavigationMenuDraft`
- `useCreateNavigationMenuItemFolder`

This means the existing codebase already has a natural frontend path to:

- draft a workspace-scoped `LINK`
- persist it
- let the workspace section render it

### 2.2 No current Trade CRM bootstrap path was identified for navigation items

Within the current Trade CRM-specific workspace bootstrap commands, this round
did not identify an existing dedicated seed path for:

- adding one workspace-scoped `navigationMenuItem`
- ensuring a default non-object primary entry such as `Sales Workbench`

That does not mean a backend seed is impossible. It means it is not currently
the lowest-friction path already present for this project slice.

## 3. Decision

### 3.1 Recommended first-slice decision

For the **first implementation slice**, prefer:

- a frontend rollout creation path

Instead of:

- introducing a new Trade CRM backend bootstrap/seed path first

### 3.2 Why this is the recommended first step

Reasons:

- it matches the currently observed ownership of workspace navigation items
- it reuses the existing `navigation-menu-item` create/save path
- it avoids introducing a new backend metadata-seeding track before the first
  page exists
- it keeps the first workbench slice inside the smallest practical touch set

## 4. Recommended Shape Of The First-Slice Creation Path

The first-slice workbench entry should be created as:

- workspace-scoped
- `NavigationMenuItemType.LINK`
- `name = Sales Workbench`
- `link = /sales-workbench`

Creation rule:

- create it only if a workspace-scoped item with the same link or intended
  identity does not already exist

This keeps the entry:

- idempotent enough for rollout
- visible in the current workspace navigation section
- consistent with current frontend navigation ownership

## 5. Why Not Start With Backend Bootstrap First

Starting with a new backend bootstrap/seed path is not the preferred first
slice because it would require solving additional questions before we even ship
the first page:

- where Trade CRM-specific workspace navigation defaults should live
- how they interact with current Twenty metadata bootstrap semantics
- whether the workbench should be treated as a core product navigation default
  or a Trade CRM rollout-specific default

Those are valid later questions, but they are not required to deliver the first
usable workbench route and entry.

## 6. Recommended Two-Phase Approach

### Phase A: first UI delivery

Use a frontend rollout creation path to:

1. add `AppPath.SalesWorkbench`
2. add `SalesWorkbenchPage`
3. add the route in `useCreateAppRouter`
4. create the workspace-scoped `LINK` navigation item if missing

### Phase B: later hardening

After the first page is working and validated, decide whether to promote the
workbench navigation item into:

- a Trade CRM workspace bootstrap command
- a metadata initialization seed
- a more permanent rollout-time backend default

This sequence keeps the first slice minimal while preserving a later path to a
stronger seed model.

## 7. Guardrails For The First-Slice Creation Path

The first rollout path should:

- only create the item when missing
- avoid creating duplicates
- avoid relying on drawer presentation components
- keep the source of truth in the existing `navigation-menu-item` system

It should not:

- hardcode the workbench entry in `MainNavigationDrawerScrollableItems`
- hardcode the workbench entry in `NavigationDrawerOtherSection`
- bypass the workspace navigation metadata flow

## 8. Recommended Next Action

The next implementation round should use this decision as the baseline and
start the first real code slice with:

1. `AppPath.SalesWorkbench`
2. `SalesWorkbenchPage`
3. direct route registration in `useCreateAppRouter`
4. one idempotent frontend rollout path that creates the workspace-scoped
   `Sales Workbench` `LINK` item when missing
