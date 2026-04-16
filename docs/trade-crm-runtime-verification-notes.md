# Trade CRM Runtime Verification Notes

## 2026-04-13

### Scope
- Runtime verification for `sales-workbench` bootstrap from `/welcome`.
- Verification script: `scripts/verify-sales-workbench-runtime-walkthrough.js`.

### Confirmed facts
- `/welcome` is rendered inside `AuthModal` and the background companies table is a sign-in mock, not a real authenticated workbench surface.
- The walkthrough script previously used outdated Chinese selectors and could stall on localized `继续 / 跳过 / 完成` buttons.
- The current runtime blocker is still on the welcome/auth flow. The latest walkthrough result still finishes on `/welcome`.

### Code changes made in this round
- `src/pages/auth/SignInUp.tsx`
  - Added top-level `tokenPair` bootstrap handling so auth bootstrap is not limited to a specific sign-in subform.
- `src/modules/auth/sign-in-up/components/internal/SignInUpGlobalScopeFormEffect.tsx`
  - Reduced to a no-op because bootstrap logic moved to the page level.
- `src/modules/auth/sign-in-up/components/internal/SignInUpWorkspaceScopeFormEffect.tsx`
  - Returned to form-only behavior after bootstrap logic was centralized.
- `scripts/verify-sales-workbench-runtime-walkthrough.js`
  - Updated localized button selectors.
  - Added the no-password welcome-step branch so the script can click `Continue/继续` after entering email.

### Verified
- Front-end full TypeScript check passes.
- `node --check scripts/verify-sales-workbench-runtime-walkthrough.js` passes.

### Not yet resolved
- The runtime walkthrough still does not reach `/sales-workbench`.
- Next debugging step should capture which welcome-step control is actually present and whether clicking it changes the route, instead of inferring from background mock content.
