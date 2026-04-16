# Trade CRM Sales Workbench Navigation Menu Item Registration Draft

Last updated: 2026-04-08

## 1. Purpose

This document turns the current sales workbench route planning into one more
code-facing decision:

- which existing frontend navigation path should own the primary workbench
  entry
- whether that entry should be hardcoded or data-driven
- which navigation item type best fits a new non-object operating surface

It is grounded in the currently observed frontend files:

- `packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerScrollableItems.tsx`
- `packages/twenty-front/src/modules/navigation/components/NavigationDrawerOtherSection.tsx`
- `packages/twenty-front/src/modules/navigation-menu-item/display/sections/workspace/components/WorkspaceSectionDispatcher.tsx`
- `packages/twenty-front/src/modules/navigation-menu-item/display/sections/workspace/components/WorkspaceSection.tsx`
- `packages/twenty-front/src/modules/navigation-menu-item/display/sections/workspace/components/WorkspaceSectionContainer.tsx`
- `packages/twenty-front/src/modules/navigation-menu-item/display/hooks/useNavigationMenuItemSectionItems.ts`
- `packages/twenty-front/src/modules/navigation-menu-item/display/hooks/useNavigationMenuItemsData.ts`
- `packages/twenty-front/src/modules/navigation-menu-item/display/utils/getWorkspaceSidebarOrphanItemsInDisplayOrder.ts`
- `packages/twenty-front/src/modules/navigation-menu-item/display/utils/getNavigationMenuItemComputedLink.ts`
- `packages/twenty-front/src/modules/navigation-menu-item/common/hooks/useCreateManyNavigationMenuItems.ts`

## 2. Observed Structure

### 2.1 Main drawer composition

The main drawer structure currently renders:

- opened section
- favorites section
- workspace section
- other section

The workbench should still remain outside `Other`.

### 2.2 Workspace section ownership

The exact workspace navigation display path is:

1. `MainNavigationDrawerScrollableItems`
2. `WorkspaceSectionDispatcher`
3. `WorkspaceSection`
4. `WorkspaceSectionContainer`
5. `WorkspaceSectionListReadOnly` or `WorkspaceSectionListDndKit`
6. `NavigationMenuItemDisplay`

This means the primary workspace drawer is already driven by the
`navigation-menu-item` module, not by a one-off hand-authored list of drawer
buttons.

### 2.3 Workspace navigation data source

The current workspace section does not render a hardcoded array.

It pulls from:

- `navigationMenuItemsSelector`
- `filterWorkspaceNavigationMenuItems(...)`
- `useNavigationMenuItemSectionItems()`
- `getWorkspaceSidebarOrphanItemsInDisplayOrder(...)`

So the real ownership of a new primary workspace entry is data-driven.

## 3. Key Recommendation

### 3.1 Route stays app-owned

The workbench route should still be owned by:

- `packages/twenty-shared/src/types/AppPath.ts`
- `packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx`
- `packages/twenty-front/src/pages/workbench/SalesWorkbenchPage.tsx`

That part does not change.

### 3.2 Navigation entry should be workspace navigation data, not hardcoded JSX

The primary navigation entry should not be added by directly editing:

- `NavigationDrawerOtherSection.tsx`
- `MainNavigationDrawerScrollableItems.tsx`

Instead, it should enter the drawer through the existing workspace
`navigation-menu-item` chain.

### 3.3 Recommended navigation item type

For the first workbench slice, the best fit is:

- `NavigationMenuItemType.LINK`

Reason:

- the workbench is not a single CRM object
- it is not a view owned by one object
- it is not a record destination
- the current link computation path already supports a direct route target

Suggested workbench navigation item shape:

- `type = LINK`
- `name = Sales Workbench`
- `link = /sales-workbench`
- `icon =` a workbench-appropriate icon chosen later
- workspace-scoped, not user-personal scoped

## 4. Exact Registration Touchpoint Recommendation

### 4.1 Do not register the navigation entry in drawer presentation components

Avoid using drawer presentation files as the source of truth for the workbench
entry.

These files should keep their current role:

- render sections
- render dynamic items
- handle edit mode

They should not become the canonical place to introduce one more primary
workspace surface.

### 4.2 Register the workbench as a workspace navigation menu item

The best current fit is:

1. add `AppPath.SalesWorkbench`
2. register `/sales-workbench` in `useCreateAppRouter`
3. make the drawer entry a workspace `LINK` navigation menu item
4. let the existing workspace navigation section render it naturally

This keeps the app consistent with the current navigation ownership model.

## 5. Implication For First Code Slice

The first code-writing workbench slice should therefore split into two parts:

### 5.1 Route slice

- add `AppPath.SalesWorkbench`
- add `SalesWorkbenchPage`
- register the route in `useCreateAppRouter`

### 5.2 Navigation item slice

- add one workspace-scoped `LINK` navigation menu item for the workbench
- let the existing workspace navigation item rendering path surface it

This is lower-risk than bypassing the current navigation item system.

## 6. What Still Needs One More Confirmation

One initialization detail still needs a later round:

- where the default workbench `LINK` item should be created for a workspace

Possible ownership directions:

- workspace bootstrap / seed path
- metadata initialization path
- one-time frontend creation during rollout

Current recommendation:

- prefer a seed or initialization path over an ad hoc UI-only creation flow

Reason:

- the workbench is intended to be a first-class operating surface
- it should appear consistently for the intended workspace rollout
- it should not depend on manual drawer customization to exist

## 7. Recommended First Implementation Touch Set

The minimum expected touch set is now:

1. `packages/twenty-shared/src/types/AppPath.ts`
2. `packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx`
3. `packages/twenty-front/src/pages/workbench/SalesWorkbenchPage.tsx`
4. the workspace navigation menu item initialization path

The drawer presentation components should remain unchanged unless a small icon,
label, or ordering issue requires a surgical adjustment.

## 8. What Not To Do

Do not:

- hardcode the workbench entry in `NavigationDrawerOtherSection`
- add a one-off drawer button outside the `navigation-menu-item` system
- force the workbench under `/objects/...`
- make the workbench depend on layout customization mode to exist

## 9. Recommended Next Action

The next code-facing round should identify the existing default navigation item
seed or initialization path for workspace-scoped entries and then use this draft
as the baseline for the first actual frontend implementation slice.
