# AMAIN Mailbox Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-managed Alibaba IMAP/SMTP mailbox platform inside AMAIN CRM so assigned users can work a full mailbox surface instead of a CRM-only mail view.

**Architecture:** Reuse Twenty's low-level connected-account, message-channel, folder-sync, and validator substrate. Add an AMAIN mailbox domain for mailbox profiles, assignments, permissions, rules, and CRM thread links. Expose admin control through enterprise-style pages and REST APIs, while keeping the seller-facing mailbox workbench on the current GraphQL-driven Mail surface.

**Tech Stack:** NestJS, TypeORM, PostgreSQL, GraphQL Yoga, React, Apollo Client, Jotai, Linaria, Nx, Jest

---

## File Structure

### Backend files to create

- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/mailbox-control.module.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/controllers/enterprise-mailbox-profiles.controller.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/controllers/enterprise-mailbox-assignments.controller.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/controllers/enterprise-mailbox-health.controller.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/dtos/create-enterprise-mailbox-profile.dto.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/dtos/update-enterprise-mailbox-profile.dto.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/dtos/assign-enterprise-mailbox.dto.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/dtos/update-enterprise-mailbox-permissions.dto.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-profile.entity.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-assignment.entity.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-permission.entity.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-rule.entity.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/entities/enterprise-mail-thread-crm-link.entity.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/services/enterprise-mailbox-profile.service.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/services/enterprise-mailbox-assignment.service.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/services/enterprise-mailbox-health.service.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/services/enterprise-mailbox-credential.service.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/services/enterprise-mail-thread-crm-link.service.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/database/typeorm/core/migrations/common/1774900000000-add-enterprise-mailbox-control.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/__tests__/enterprise-mailbox-profile.service.spec.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/__tests__/enterprise-mailbox-assignment.service.spec.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/__tests__/enterprise-mail-thread-crm-link.service.spec.ts`

### Backend files to modify

- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/engine/core-modules/core-engine.module.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/enterprise.module.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/connected-account/services/imap-smtp-caldav-apis.service.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/engine/core-modules/imap-smtp-caldav-connection/imap-smtp-caldav-connection.resolver.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/engine/core-modules/imap-smtp-caldav-connection/dtos/imap-smtp-caldav-connection.dto.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/messaging/common/services/message-channel-sync-status.service.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/engine/core-modules/messaging/timeline-messaging.resolver.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/engine/core-modules/messaging/services/get-messages.service.ts`

### Frontend files to create

- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/EnterpriseMailboxAccountsPage.tsx`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/EnterpriseMailboxAssignmentsPage.tsx`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/EnterpriseMailboxRulesPage.tsx`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/EnterpriseMailboxHealthPage.tsx`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/components/EnterpriseMailboxProfileForm.tsx`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/components/EnterpriseMailboxAssignmentsTable.tsx`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/components/EnterpriseMailboxPermissionMatrix.tsx`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/components/EnterpriseMailboxHealthList.tsx`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/hooks/useEnterpriseMailboxProfiles.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/hooks/useEnterpriseMailboxAssignments.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/hooks/useEnterpriseMailboxHealth.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/types/enterprise-mailbox-control.types.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/__tests__/EnterpriseMailboxControlPages.test.tsx`

### Frontend files to modify

- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/enterprise/navigation/enterpriseMenuConfig.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/settings/accounts/components/SettingsAccountsConnectionForm.tsx`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/settings/accounts/hooks/useImapSmtpCaldavConnectionForm.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/pages/TradeCrmMailPage.tsx`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/hooks/useTradeCrmMailWorkspaceData.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/graphql/queries/getMyInboxThreads.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/graphql/queries/getTradeCrmMailThreadTaskLinks.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/graphql/mutations/updateTradeCrmMailThreadState.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/graphql/mutations/updateTradeCrmMailThreadTag.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/constants/trade-crm-mail-workspace.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-shared/src/types/AppPath.ts`

### Shared files to modify

- `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/enterprise/shared/constants/enterprisePermissions.ts`
- `G:/codex/twentyCRM/amainCRM/packages/twenty-shared/src/types/AppPath.ts`

---

### Task 1: Create the AMAIN mailbox domain and migration

**Files:**
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-profile.entity.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-assignment.entity.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-permission.entity.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-rule.entity.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/entities/enterprise-mail-thread-crm-link.entity.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/database/typeorm/core/migrations/common/1774900000000-add-enterprise-mailbox-control.ts`
- Test: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/__tests__/enterprise-mailbox-profile.service.spec.ts`

- [ ] **Step 1: Write the failing backend entity/service test**

```ts
describe('EnterpriseMailboxProfileService', () => {
  it('should persist an Alibaba IMAP/SMTP mailbox profile with encrypted credential reference', async () => {
    const result = await service.createMailboxProfile({
      workspaceId: 'workspace-id',
      emailAddress: 'sales@company.com',
      provider: 'alibaba-mail',
      credentialMode: 'authorization-code',
      imapHost: 'imap.qiye.aliyun.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.qiye.aliyun.com',
      smtpPort: 465,
      smtpSecure: true,
      loginUsername: 'sales@company.com',
      secret: 'masked-secret',
    });

    expect(result.provider).toBe('alibaba-mail');
    expect(result.credentialRef).toBeDefined();
    expect(result.secret).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/modules/enterprise/mailbox-control/__tests__/enterprise-mailbox-profile.service.spec.ts --config=packages/twenty-server/jest.config.mjs`

Expected: FAIL with missing module, entity, or service errors.

- [ ] **Step 3: Write minimal domain entities and migration**

```ts
@Entity('enterpriseMailboxProfile')
export class EnterpriseMailboxProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  workspaceId!: string;

  @Column()
  emailAddress!: string;

  @Column({ default: 'alibaba-mail' })
  provider!: string;

  @Column({ default: 'imap-smtp' })
  protocolMode!: string;

  @Column()
  credentialRef!: string;
}
```

```ts
await queryRunner.createTable(
  new Table({
    name: 'core.enterpriseMailboxProfile',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true },
      { name: 'workspaceId', type: 'uuid', isNullable: false },
      { name: 'emailAddress', type: 'varchar', isNullable: false },
      { name: 'provider', type: 'varchar', default: `'alibaba-mail'` },
      { name: 'credentialRef', type: 'varchar', isNullable: false },
    ],
  }),
);
```

- [ ] **Step 4: Run tests and build verification**

Run:

```bash
npx jest src/modules/enterprise/mailbox-control/__tests__/enterprise-mailbox-profile.service.spec.ts --config=packages/twenty-server/jest.config.mjs
npx nx build twenty-server
```

Expected:
- test PASS
- `nx build twenty-server` succeeds

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-server/src/modules/enterprise/mailbox-control packages/twenty-server/src/database/typeorm/core/migrations/common/1774900000000-add-enterprise-mailbox-control.ts
git commit -m "feat: add AMAIN mailbox domain entities"
```

### Task 2: Add admin mailbox profile, assignment, and health APIs

**Files:**
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/controllers/enterprise-mailbox-profiles.controller.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/controllers/enterprise-mailbox-assignments.controller.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/controllers/enterprise-mailbox-health.controller.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/services/enterprise-mailbox-profile.service.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/services/enterprise-mailbox-assignment.service.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/services/enterprise-mailbox-health.service.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/services/enterprise-mailbox-credential.service.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/dtos/create-enterprise-mailbox-profile.dto.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/dtos/assign-enterprise-mailbox.dto.ts`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/connected-account/services/imap-smtp-caldav-apis.service.ts`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/enterprise.module.ts`
- Test: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/__tests__/enterprise-mailbox-assignment.service.spec.ts`

- [ ] **Step 1: Write the failing assignment and validation test**

```ts
it('should validate Alibaba IMAP/SMTP credentials, create connected-account substrate, and assign mailbox to a workspace member', async () => {
  const profile = await profileService.createMailboxProfile(validAlibabaInput);
  const assignment = await assignmentService.assignMailbox({
    mailboxProfileId: profile.id,
    workspaceMemberId: 'member-id',
    canReceive: true,
    canSend: true,
    canViewSubordinates: false,
  });

  expect(assignment.mailboxProfileId).toBe(profile.id);
  expect(assignment.canSend).toBe(true);
  expect(imapSmtpApiService.processAccount).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/modules/enterprise/mailbox-control/__tests__/enterprise-mailbox-assignment.service.spec.ts --config=packages/twenty-server/jest.config.mjs`

Expected: FAIL because services, DTOs, or controllers are missing.

- [ ] **Step 3: Implement admin REST APIs on top of the existing IMAP/SMTP substrate**

```ts
@Post('mailbox-profiles')
async createMailboxProfile(@Body() dto: CreateEnterpriseMailboxProfileDto) {
  return this.enterpriseMailboxProfileService.createMailboxProfile(dto);
}

@Post('mailbox-profiles/:id/validate')
async validateMailboxProfile(@Param('id') id: string) {
  return this.enterpriseMailboxProfileService.validateMailboxProfile(id);
}

@Post('mailbox-assignments')
async assignMailbox(@Body() dto: AssignEnterpriseMailboxDto) {
  return this.enterpriseMailboxAssignmentService.assignMailbox(dto);
}
```

```ts
const connectedAccountId = await this.imapSmtpCaldavApisService.processAccount({
  handle: dto.emailAddress,
  workspaceMemberId: dto.assignedWorkspaceMemberId ?? dto.createdByWorkspaceMemberId,
  workspaceId: dto.workspaceId,
  connectionParameters: {
    IMAP: { ...imapParams, password: decryptedSecret },
    SMTP: { ...smtpParams, password: decryptedSecret },
  },
});
```

- [ ] **Step 4: Run tests and API build verification**

Run:

```bash
npx jest src/modules/enterprise/mailbox-control/__tests__/enterprise-mailbox-assignment.service.spec.ts --config=packages/twenty-server/jest.config.mjs
npx nx build twenty-server
```

Expected:
- assignment test PASS
- server build PASS

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-server/src/modules/enterprise/mailbox-control packages/twenty-server/src/modules/connected-account/services/imap-smtp-caldav-apis.service.ts packages/twenty-server/src/modules/enterprise/enterprise.module.ts
git commit -m "feat: add admin mailbox control APIs"
```

### Task 3: Add admin routes, permissions, and mailbox control pages

**Files:**
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-shared/src/types/AppPath.ts`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/enterprise/navigation/enterpriseMenuConfig.ts`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/enterprise/shared/constants/enterprisePermissions.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/EnterpriseMailboxAccountsPage.tsx`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/EnterpriseMailboxAssignmentsPage.tsx`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/EnterpriseMailboxRulesPage.tsx`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/EnterpriseMailboxHealthPage.tsx`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/components/EnterpriseMailboxProfileForm.tsx`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/components/EnterpriseMailboxAssignmentsTable.tsx`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/components/EnterpriseMailboxPermissionMatrix.tsx`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/components/EnterpriseMailboxHealthList.tsx`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/hooks/useEnterpriseMailboxProfiles.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/hooks/useEnterpriseMailboxAssignments.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/hooks/useEnterpriseMailboxHealth.ts`
- Test: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/__tests__/EnterpriseMailboxControlPages.test.tsx`

- [ ] **Step 1: Write the failing frontend routing and rendering test**

```tsx
it('should render Admin mailbox accounts and assignments pages with AMAIN labels', async () => {
  renderWithRouter(AppPath.EnterpriseMailboxAccounts);

  expect(await screen.findByText('Mailbox Accounts')).toBeVisible();
  expect(screen.getByText('Alibaba Mail')).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/pages/enterprise/mailbox-control/__tests__/EnterpriseMailboxControlPages.test.tsx --config=packages/twenty-front/jest.config.mjs`

Expected: FAIL because routes and pages do not exist yet.

- [ ] **Step 3: Implement Admin mailbox pages and route wiring**

```ts
export enum AppPath {
  EnterpriseMailboxAccounts = '/enterprise/mailbox/accounts',
  EnterpriseMailboxAssignments = '/enterprise/mailbox/assignments',
  EnterpriseMailboxRules = '/enterprise/mailbox/rules',
  EnterpriseMailboxHealth = '/enterprise/mailbox/health',
}
```

```tsx
<Route
  path={AppPath.EnterpriseMailboxAccounts}
  element={
    <LazyRoute>
      <EnterpriseMailboxAccountsPage />
    </LazyRoute>
  }
/>
```

```ts
{
  key: 'mailbox-accounts',
  label: 'Mailbox Accounts',
  requiredPermission: enterprisePermissionCodes.mailboxRead,
  to: AppPath.EnterpriseMailboxAccounts,
}
```

- [ ] **Step 4: Run tests, typecheck, and build**

Run:

```bash
npx jest src/pages/enterprise/mailbox-control/__tests__/EnterpriseMailboxControlPages.test.tsx --config=packages/twenty-front/jest.config.mjs
npx nx typecheck twenty-front
corepack yarn nx build twenty-front
```

Expected:
- page test PASS
- typecheck PASS
- front build PASS

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-shared/src/types/AppPath.ts packages/twenty-front/src/modules/app/hooks/useCreateAppRouter.tsx packages/twenty-front/src/modules/enterprise/navigation/enterpriseMenuConfig.ts packages/twenty-front/src/pages/enterprise packages/twenty-front/src/modules/enterprise/shared/constants/enterprisePermissions.ts
git commit -m "feat: add admin mailbox control pages"
```

### Task 4: Reuse the IMAP/SMTP connection form for admin-managed Alibaba mailbox binding

**Files:**
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/settings/accounts/components/SettingsAccountsConnectionForm.tsx`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/settings/accounts/hooks/useImapSmtpCaldavConnectionForm.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/components/EnterpriseMailboxProfileForm.tsx`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/engine/core-modules/imap-smtp-caldav-connection/dtos/imap-smtp-caldav-connection.dto.ts`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/engine/core-modules/imap-smtp-caldav-connection/imap-smtp-caldav-connection.resolver.ts`
- Test: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/__tests__/EnterpriseMailboxControlPages.test.tsx`

- [ ] **Step 1: Write the failing admin mailbox form test**

```tsx
it('should preset Alibaba IMAP and SMTP fields and hide end-user account-owner language', async () => {
  render(<EnterpriseMailboxProfileForm />);

  expect(screen.getByLabelText('IMAP Host')).toHaveValue('imap.qiye.aliyun.com');
  expect(screen.getByLabelText('SMTP Host')).toHaveValue('smtp.qiye.aliyun.com');
  expect(screen.queryByText('New Account')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/pages/enterprise/mailbox-control/__tests__/EnterpriseMailboxControlPages.test.tsx --config=packages/twenty-front/jest.config.mjs`

Expected: FAIL because the admin form wrapper and provider preset are not implemented.

- [ ] **Step 3: Implement an admin wrapper around the existing connection form**

```tsx
export const EnterpriseMailboxProfileForm = () => {
  return (
    <SettingsAccountsConnectionForm
      mode="admin-mailbox"
      providerPreset="alibaba-mail"
      defaultConnectionParameters={{
        IMAP: { host: 'imap.qiye.aliyun.com', port: 993, secure: true },
        SMTP: { host: 'smtp.qiye.aliyun.com', port: 465, secure: true },
      }}
      hideAccountOwnerField
    />
  );
};
```

```ts
export type EmailAccountConnectionParameters = {
  IMAP?: ConnectionParameters;
  SMTP?: ConnectionParameters;
  CALDAV?: ConnectionParameters;
  providerPreset?: 'alibaba-mail';
};
```

- [ ] **Step 4: Run test, typecheck, and build**

Run:

```bash
npx jest src/pages/enterprise/mailbox-control/__tests__/EnterpriseMailboxControlPages.test.tsx --config=packages/twenty-front/jest.config.mjs
npx nx typecheck twenty-front
npx nx build twenty-server
```

Expected:
- form test PASS
- front typecheck PASS
- server build PASS

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-front/src/modules/settings/accounts/components/SettingsAccountsConnectionForm.tsx packages/twenty-front/src/modules/settings/accounts/hooks/useImapSmtpCaldavConnectionForm.ts packages/twenty-front/src/pages/enterprise/mailbox-control/components/EnterpriseMailboxProfileForm.tsx packages/twenty-server/src/engine/core-modules/imap-smtp-caldav-connection
git commit -m "feat: add admin Alibaba mailbox binding form"
```

### Task 5: Turn the Mail surface into a real inbox, drafts, sent, unread, and batch-action workbench

**Files:**
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/constants/trade-crm-mail-workspace.ts`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/pages/TradeCrmMailPage.tsx`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/hooks/useTradeCrmMailWorkspaceData.ts`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/graphql/queries/getMyInboxThreads.ts`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/graphql/mutations/updateTradeCrmMailThreadState.ts`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/graphql/mutations/updateTradeCrmMailThreadTag.ts`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/engine/core-modules/messaging/services/get-messages.service.ts`
- Test: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/__tests__/trade-crm-mail-workbench.test.tsx`

- [ ] **Step 1: Write the failing mailbox workbench test**

```tsx
it('should render inbox, unread, drafts, sent, and batch action controls', async () => {
  renderTradeCrmMail('/trade-crm/mail?scope=mail&view=inbox');

  expect(await screen.findByText('Inbox')).toBeVisible();
  expect(screen.getByText('Unread')).toBeVisible();
  expect(screen.getByText('Drafts')).toBeVisible();
  expect(screen.getByText('Sent')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Move' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Tag' })).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/modules/trade-crm/mail/__tests__/trade-crm-mail-workbench.test.tsx --config=packages/twenty-front/jest.config.mjs`

Expected: FAIL because unread/drafts/sent actions or controls are incomplete.

- [ ] **Step 3: Implement mailbox views and batch controls**

```ts
export const TRADE_CRM_MAIL_SCOPE_ORDER = ['mail', 'customer', 'subordinate'] as const;

export const tradeCrmMailViews = {
  inbox: { label: 'Inbox', folder: 'inbox' },
  pending: { label: 'Pending', state: 'pending-replies' },
  unread: { label: 'Unread', unreadOnly: true },
  drafts: { label: 'Drafts', folder: 'drafts' },
  sent: { label: 'Sent', folder: 'sent' },
  broadcast: { label: 'Broadcast', folder: 'broadcast' },
};
```

```tsx
<StyledBulkActionBar>
  <ToolbarButton onClick={handleMarkRead}>Mark read</ToolbarButton>
  <ToolbarButton onClick={handleMoveThreads}>Move</ToolbarButton>
  <ToolbarButton onClick={handleTagThreads}>Tag</ToolbarButton>
  <ToolbarButton onClick={handleForwardThreads}>Forward</ToolbarButton>
</StyledBulkActionBar>
```

- [ ] **Step 4: Run tests, typecheck, and browser-safe build**

Run:

```bash
npx jest src/modules/trade-crm/mail/__tests__/trade-crm-mail-workbench.test.tsx --config=packages/twenty-front/jest.config.mjs
npx nx typecheck twenty-front
corepack yarn nx build twenty-front
```

Expected:
- mailbox workbench test PASS
- typecheck PASS
- build PASS

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-front/src/modules/trade-crm/mail packages/twenty-server/src/engine/core-modules/messaging/services/get-messages.service.ts
git commit -m "feat: add AMAIN mailbox workbench basics"
```

### Task 6: Add send, reply, forward, and draft persistence through SMTP

**Files:**
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/services/enterprise-mailbox-send.service.ts`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/engine/core-modules/messaging/timeline-messaging.resolver.ts`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/pages/TradeCrmMailPage.tsx`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/graphql/mutations/sendTradeCrmMailMessage.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/graphql/mutations/saveTradeCrmMailDraft.ts`
- Test: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/__tests__/enterprise-mailbox-send.service.spec.ts`

- [ ] **Step 1: Write the failing send and draft test**

```ts
it('should send a reply through the assigned mailbox SMTP profile and persist a sent-thread state', async () => {
  await sendService.sendMessage({
    mailboxProfileId: 'profile-id',
    workspaceMemberId: 'member-id',
    to: ['buyer@example.com'],
    subject: 'Re: Quotation',
    body: 'Reply body',
    replyToThreadId: 'thread-id',
  });

  expect(smtpTransport.verify).toHaveBeenCalled();
  expect(messageStore.markThreadAsSent).toHaveBeenCalledWith('thread-id');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/modules/enterprise/mailbox-control/__tests__/enterprise-mailbox-send.service.spec.ts --config=packages/twenty-server/jest.config.mjs`

Expected: FAIL because send service and mutation are missing.

- [ ] **Step 3: Implement SMTP send and draft APIs**

```ts
@Mutation(() => Boolean)
async sendTradeCrmMailMessage(@Args('input') input: SendTradeCrmMailMessageInput) {
  return this.enterpriseMailboxSendService.sendMessage(input);
}

@Mutation(() => Boolean)
async saveTradeCrmMailDraft(@Args('input') input: SaveTradeCrmMailDraftInput) {
  return this.enterpriseMailboxSendService.saveDraft(input);
}
```

```tsx
const [sendTradeCrmMailMessage] = useMutation(SEND_TRADE_CRM_MAIL_MESSAGE, {
  client: apolloCoreClient,
});
```

- [ ] **Step 4: Run tests and builds**

Run:

```bash
npx jest src/modules/enterprise/mailbox-control/__tests__/enterprise-mailbox-send.service.spec.ts --config=packages/twenty-server/jest.config.mjs
npx nx build twenty-server
npx nx typecheck twenty-front
```

Expected:
- send service test PASS
- server build PASS
- front typecheck PASS

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-server/src/modules/enterprise/mailbox-control/services/enterprise-mailbox-send.service.ts packages/twenty-server/src/engine/core-modules/messaging/timeline-messaging.resolver.ts packages/twenty-front/src/modules/trade-crm/mail
git commit -m "feat: add mailbox send and draft actions"
```

### Task 7: Replace inference-first CRM linking with explicit thread CRM links

**Files:**
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/services/enterprise-mail-thread-crm-link.service.ts`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/engine/core-modules/messaging/timeline-messaging.resolver.ts`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/engine/core-modules/messaging/services/get-messages.service.ts`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/hooks/useTradeCrmMailWorkspaceData.ts`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/pages/TradeCrmMailPage.tsx`
- Test: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/__tests__/enterprise-mail-thread-crm-link.service.spec.ts`

- [ ] **Step 1: Write the failing explicit link test**

```ts
it('should prefer explicit thread CRM links over inferred company/person/opportunity matches', async () => {
  const link = await service.upsertThreadLink({
    threadId: 'thread-id',
    companyId: 'company-id',
    personId: 'person-id',
    opportunityId: 'opportunity-id',
    taskId: 'task-id',
  });

  const thread = await messagingService.getThread('thread-id');

  expect(thread.crmLink.taskId).toBe('task-id');
  expect(thread.crmLink.companyId).toBe('company-id');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/modules/enterprise/mailbox-control/__tests__/enterprise-mail-thread-crm-link.service.spec.ts --config=packages/twenty-server/jest.config.mjs`

Expected: FAIL because the unified link service does not exist yet.

- [ ] **Step 3: Implement unified CRM link storage and read path**

```ts
const explicitLink = await this.enterpriseMailThreadCrmLinkService.findByThreadId(threadId);

if (explicitLink) {
  return {
    ...thread,
    crmLink: explicitLink,
  };
}

return this.fallbackInferThreadTargets(thread);
```

```tsx
const linkedCompanyId = thread.crmLink?.companyId ?? inferredCompanyId;
const linkedTaskId = thread.crmLink?.taskId ?? inferredTaskId;
```

- [ ] **Step 4: Run tests and type/build checks**

Run:

```bash
npx jest src/modules/enterprise/mailbox-control/__tests__/enterprise-mail-thread-crm-link.service.spec.ts --config=packages/twenty-server/jest.config.mjs
npx nx build twenty-server
npx nx typecheck twenty-front
```

Expected:
- CRM link test PASS
- server build PASS
- front typecheck PASS

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-server/src/modules/enterprise/mailbox-control/services/enterprise-mail-thread-crm-link.service.ts packages/twenty-server/src/engine/core-modules/messaging packages/twenty-front/src/modules/trade-crm/mail
git commit -m "feat: add explicit mail thread CRM links"
```

### Task 8: Add subordinate mailbox handling, rule-backed pending queues, and mailbox health

**Files:**
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/pages/TradeCrmMailPage.tsx`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/modules/trade-crm/mail/hooks/useTradeCrmMailWorkspaceData.ts`
- Create: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/components/EnterpriseMailboxHealthList.tsx`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/messaging/common/services/message-channel-sync-status.service.ts`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/services/enterprise-mailbox-health.service.ts`
- Modify: `G:/codex/twentyCRM/amainCRM/packages/twenty-server/src/modules/enterprise/mailbox-control/entities/enterprise-mailbox-rule.entity.ts`
- Test: `G:/codex/twentyCRM/amainCRM/packages/twenty-front/src/pages/enterprise/mailbox-control/__tests__/EnterpriseMailboxControlPages.test.tsx`

- [ ] **Step 1: Write the failing subordinate and health test**

```tsx
it('should render subordinate mailbox queues and mailbox health rows for assigned managers', async () => {
  renderTradeCrmMail('/trade-crm/mail?scope=subordinate&view=recent');

  expect(await screen.findByText('Subordinate View')).toBeVisible();
  expect(screen.getByText('All subordinate mail')).toBeVisible();
});
```

```tsx
it('should render mailbox health rows with last sync status', async () => {
  render(<EnterpriseMailboxHealthPage />);

  expect(await screen.findByText('Mailbox Health')).toBeVisible();
  expect(screen.getByText('Last sync status')).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/pages/enterprise/mailbox-control/__tests__/EnterpriseMailboxControlPages.test.tsx --config=packages/twenty-front/jest.config.mjs`

Expected: FAIL because subordinate permissions, rule-backed pending, or health UI are incomplete.

- [ ] **Step 3: Implement subordinate view, pending rule metadata, and mailbox health**

```ts
export class EnterpriseMailboxHealthService {
  async listMailboxHealth(workspaceId: string) {
    return profiles.map((profile) => ({
      mailboxProfileId: profile.id,
      emailAddress: profile.emailAddress,
      lastSyncAt: profile.lastSyncAt,
      lastSyncStatus: profile.lastSyncStatus,
      messageChannelStatus: syncStatusMap[profile.messageChannelId],
    }));
  }
}
```

```tsx
if (scope === 'subordinate') {
  return assignedSubordinateThreads.filter((thread) => thread.permission.canViewSubordinate);
}
```

- [ ] **Step 4: Run tests and front/server verification**

Run:

```bash
npx jest src/pages/enterprise/mailbox-control/__tests__/EnterpriseMailboxControlPages.test.tsx --config=packages/twenty-front/jest.config.mjs
npx nx typecheck twenty-front
npx nx build twenty-server
```

Expected:
- subordinate/health tests PASS
- front typecheck PASS
- server build PASS

- [ ] **Step 5: Commit**

```bash
git add packages/twenty-front/src/modules/trade-crm/mail packages/twenty-front/src/pages/enterprise/mailbox-control packages/twenty-server/src/modules/enterprise/mailbox-control packages/twenty-server/src/modules/messaging/common/services/message-channel-sync-status.service.ts
git commit -m "feat: add subordinate mailbox and health workbench"
```

### Task 9: Run focused regression, update docs, and prepare release notes

**Files:**
- Modify: `G:/codex/twentyCRM/amainCRM/task_plan.md`
- Modify: `G:/codex/twentyCRM/amainCRM/findings.md`
- Modify: `G:/codex/twentyCRM/amainCRM/progress.md`
- Create: `G:/codex/twentyCRM/amainCRM/.codex-runtime/mailbox-phase1-regression-report.json`

- [ ] **Step 1: Write the final regression checklist in the plan files**

```md
- Admin can bind Alibaba mailbox
- Admin can assign mailbox to seller
- Seller can receive, send, reply, forward
- Inbox / Pending / Unread / Drafts / Sent render
- Customer / Subordinate views render
- Task deep link still works from pending queue
```

- [ ] **Step 2: Run focused tests**

Run:

```bash
npx jest src/modules/enterprise/mailbox-control/__tests__/enterprise-mailbox-profile.service.spec.ts --config=packages/twenty-server/jest.config.mjs
npx jest src/modules/enterprise/mailbox-control/__tests__/enterprise-mailbox-assignment.service.spec.ts --config=packages/twenty-server/jest.config.mjs
npx jest src/modules/enterprise/mailbox-control/__tests__/enterprise-mail-thread-crm-link.service.spec.ts --config=packages/twenty-server/jest.config.mjs
npx jest src/pages/enterprise/mailbox-control/__tests__/EnterpriseMailboxControlPages.test.tsx --config=packages/twenty-front/jest.config.mjs
npx jest src/modules/trade-crm/mail/__tests__/trade-crm-mail-workbench.test.tsx --config=packages/twenty-front/jest.config.mjs
```

Expected:
- all targeted tests PASS

- [ ] **Step 3: Run typecheck and builds**

Run:

```bash
npx nx typecheck twenty-front
npx nx build twenty-server
corepack yarn nx build twenty-front
```

Expected:
- front typecheck PASS
- server build PASS
- front build PASS

- [ ] **Step 4: Run browser regression and save a report**

Run:

```bash
# Open:
# /enterprise/mailbox/accounts
# /enterprise/mailbox/assignments
# /trade-crm/mail?scope=mail&view=inbox
# /trade-crm/mail?scope=mail&view=pending
# /trade-crm/mail?scope=customer&view=recent
# /trade-crm/mail?scope=subordinate&view=recent
```

Expected:
- each page loads
- no fallback to Twenty workspace shell
- seller workbench still retains AMAIN navigation

- [ ] **Step 5: Commit**

```bash
git add task_plan.md findings.md progress.md .codex-runtime/mailbox-phase1-regression-report.json
git commit -m "test: validate AMAIN mailbox phase 1 regression"
```

## Self-Review

### Spec coverage

- Admin-managed mailbox creation: covered by Tasks 1-4
- IMAP + SMTP validation and substrate reuse: covered by Tasks 2 and 4
- Admin assignment and permissions: covered by Tasks 2 and 3
- Inbox / pending / unread / drafts / sent / broadcast: covered by Task 5
- Customer conversations and subordinate view: covered by Tasks 5 and 8
- CRM thread linking and task linkage: covered by Task 7
- AI side panel remains on current AMAIN Mail surface and must be regression-checked during Tasks 5 and 8
- Mailbox health: covered by Task 8
- Final regression and progress bookkeeping: covered by Task 9

No spec section is left without a delivery task.

### Placeholder scan

- No `TBD`, `TODO`, or “implement later” markers remain in task steps
- Each task contains concrete files, commands, and expected outputs
- Each code step contains concrete implementation direction

### Type consistency

- AMAIN domain naming is consistent:
  - `EnterpriseMailboxProfile`
  - `EnterpriseMailboxAssignment`
  - `EnterpriseMailboxPermission`
  - `EnterpriseMailboxRule`
  - `EnterpriseMailThreadCrmLink`
- Admin routing naming is consistent:
  - `EnterpriseMailboxAccounts`
  - `EnterpriseMailboxAssignments`
  - `EnterpriseMailboxRules`
  - `EnterpriseMailboxHealth`
- Protocol strategy is consistently IMAP + SMTP throughout the plan

