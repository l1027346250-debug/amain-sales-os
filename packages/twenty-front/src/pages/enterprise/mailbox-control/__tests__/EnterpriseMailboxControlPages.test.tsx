import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { type ReactNode } from 'react';

import { EnterpriseMailboxAccountsPage } from '~/pages/enterprise/EnterpriseMailboxAccountsPage';
import { EnterpriseMailboxAssignmentsPage } from '~/pages/enterprise/EnterpriseMailboxAssignmentsPage';
import { EnterpriseMailboxHealthPage } from '~/pages/enterprise/EnterpriseMailboxHealthPage';
import { EnterpriseMailboxRulesPage } from '~/pages/enterprise/EnterpriseMailboxRulesPage';

jest.mock('@/enterprise/shared/components/EnterprisePermissionGuard', () => ({
  EnterprisePermissionGuard: ({
    children,
  }: {
    children: ReactNode;
  }) => <>{children}</>,
}));

jest.mock('@/enterprise/shared/components/EnterpriseShell', () => ({
  EnterpriseShell: ({
    title,
    children,
  }: {
    title: string;
    children: ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

jest.mock('@/ui/feedback/snack-bar-manager/hooks/useSnackBar', () => ({
  useSnackBar: () => ({
    enqueueErrorSnackBar: jest.fn(),
    enqueueSuccessSnackBar: jest.fn(),
  }),
}));

jest.mock('twenty-ui/input', () => ({
  Button: ({
    title,
    children,
    ...props
  }: {
    title?: string;
    children?: ReactNode;
  }) => <button {...props}>{title ?? children}</button>,
}));

const enterpriseApiRequestMock = jest.fn();

jest.mock('@/enterprise/shared/hooks/useEnterpriseApiRequest', () => ({
  useEnterpriseApiRequest: () => enterpriseApiRequestMock,
}));

const createJsonResponse = (payload: unknown) =>
  Promise.resolve({
    ok: true,
    json: async () => payload,
  } satisfies Partial<Response> as Response);

describe('Enterprise mailbox control pages', () => {
  beforeEach(() => {
    enterpriseApiRequestMock.mockReset();
  });

  it('should render mailbox accounts from the enterprise API', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string) => {
      if (path === '/api/enterprise/mailbox-profiles') {
        return createJsonResponse([
          {
            id: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            provider: 'alibaba-mail',
            imapHost: 'imap.qiye.aliyun.com',
            imapPort: 993,
            smtpHost: 'smtp.qiye.aliyun.com',
            smtpPort: 465,
            validationStatus: 'validated',
            status: 'active',
          },
        ]);
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxAccountsPage />);

    expect(screen.getByText('Mailbox Accounts')).toBeInTheDocument();
    expect(screen.getByText('Alibaba Mail')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('sales@acme.test')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/IMAP: imap\.qiye\.aliyun\.com:993 \/ SSL/i),
    ).toBeInTheDocument();
  });

  it('should render mailbox health snapshots from the enterprise API', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string) => {
      if (path === '/api/enterprise/mailbox-health') {
        return createJsonResponse([
          {
            mailboxProfileId: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            provider: 'alibaba-mail',
            status: 'active',
            validationStatus: 'validated',
            lastSyncStatus: 'healthy',
            lastSyncAt: '2026-04-30T09:30:00.000Z',
          },
        ]);
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxHealthPage />);

    expect(screen.getByText('Mailbox Health')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('healthy')).toBeInTheDocument();
    });

    expect(screen.getByText('sales@acme.test')).toBeInTheDocument();
  });

  it('should render mailbox assignment selectors for members and mailbox accounts', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string) => {
      if (path === '/api/enterprise/mailbox-profiles') {
        return createJsonResponse([
          {
            id: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            provider: 'alibaba-mail',
            imapHost: 'imap.qiye.aliyun.com',
            imapPort: 993,
            smtpHost: 'smtp.qiye.aliyun.com',
            smtpPort: 465,
            validationStatus: 'validated',
            status: 'active',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-assignments') {
        return createJsonResponse([
          {
            id: 'assignment-1',
            mailboxProfileId: 'mailbox-profile-1',
            workspaceMemberId: 'workspace-member-1',
            assignmentStatus: 'active',
            canReceive: true,
            canSend: true,
            canManageRules: false,
            emailAddress: 'sales@acme.test',
            permissionCodes: ['mail.read', 'mail.send'],
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-workspace-members') {
        return createJsonResponse([
          {
            id: 'workspace-member-1',
            userEmail: 'owner@acme.test',
            avatarUrl: null,
            name: {
              firstName: 'Tim',
              lastName: 'Apple',
            },
          },
          {
            id: 'workspace-member-2',
            userEmail: 'seller@acme.test',
            avatarUrl: null,
            name: {
              firstName: 'Jane',
              lastName: 'Seller',
            },
          },
        ]);
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxAssignmentsPage />);

    expect(screen.getByText('Mailbox Assignments')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Workspace member' })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'Tim Apple (owner@acme.test)' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'sales@acme.test' }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Current assignments')).toBeInTheDocument();
  });

  it('should load workspace members from the enterprise mailbox admin API', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string) => {
      if (path === '/api/enterprise/mailbox-profiles') {
        return createJsonResponse([]);
      }

      if (path === '/api/enterprise/mailbox-assignments') {
        return createJsonResponse([]);
      }

      if (path === '/api/enterprise/mailbox-workspace-members') {
        return createJsonResponse([
          {
            id: 'workspace-member-9',
            userEmail: 'fallback@acme.test',
            avatarUrl: null,
            name: {
              firstName: 'Fallback',
              lastName: 'Seller',
            },
          },
        ]);
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxAssignmentsPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'Fallback Seller (fallback@acme.test)' }),
      ).toBeInTheDocument();
    });
  });

  it('should create a mailbox assignment with control flags through the enterprise API', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/api/enterprise/mailbox-profiles') {
        return createJsonResponse([
          {
            id: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            provider: 'alibaba-mail',
            imapHost: 'imap.qiye.aliyun.com',
            imapPort: 993,
            smtpHost: 'smtp.qiye.aliyun.com',
            smtpPort: 465,
            validationStatus: 'validated',
            status: 'active',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-assignments' && !init?.method) {
        return createJsonResponse([]);
      }

      if (path === '/api/enterprise/mailbox-assignments' && init?.method === 'POST') {
        return createJsonResponse({
          id: 'assignment-new',
        });
      }

      if (path === '/api/enterprise/mailbox-workspace-members') {
        return createJsonResponse([
          {
            id: 'workspace-member-2',
            userEmail: 'seller@acme.test',
            avatarUrl: null,
            name: {
              firstName: 'Jane',
              lastName: 'Seller',
            },
          },
        ]);
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxAssignmentsPage />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Workspace member' })).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Jane Seller (seller@acme.test)' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'sales@acme.test' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox', { name: 'Workspace member' }), {
      target: { value: 'workspace-member-2' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Mailbox account' }), {
      target: { value: 'mailbox-profile-1' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'mail.reply' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'primary mailbox' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'canManageRules' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'canViewSubordinates' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'canHandleSubordinates' }));

    await waitFor(() => {
      expect(
        screen.getByText('Jane Seller (seller@acme.test) currently has 0 active mailbox assignments.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Assign mailbox' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Assign mailbox' }));

    await waitFor(() => {
      const createMailboxAssignmentCall = enterpriseApiRequestMock.mock.calls.find(
        ([path, requestInit]) =>
          path === '/api/enterprise/mailbox-assignments' &&
          requestInit?.method === 'POST',
      );

      expect(createMailboxAssignmentCall).toBeDefined();

      const requestBody = JSON.parse(
        String(createMailboxAssignmentCall?.[1]?.body ?? '{}'),
      );

      expect(requestBody).toEqual({
        mailboxProfileId: 'mailbox-profile-1',
        workspaceMemberId: 'workspace-member-2',
        isPrimaryMailbox: true,
        canReceive: true,
        canSend: true,
        canViewSubordinates: true,
        canHandleSubordinates: true,
        canManageRules: true,
        permissionCodes: ['mail.read', 'mail.send', 'mail.reply'],
      });
    });
  });

  it('should block duplicate assignment creation for the same member and mailbox pair', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string) => {
      if (path === '/api/enterprise/mailbox-profiles') {
        return createJsonResponse([
          {
            id: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            provider: 'alibaba-mail',
            imapHost: 'imap.qiye.aliyun.com',
            imapPort: 993,
            smtpHost: 'smtp.qiye.aliyun.com',
            smtpPort: 465,
            validationStatus: 'validated',
            status: 'active',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-assignments') {
        return createJsonResponse([
          {
            id: 'assignment-1',
            mailboxProfileId: 'mailbox-profile-1',
            workspaceMemberId: 'workspace-member-1',
            assignmentStatus: 'active',
            canReceive: true,
            canSend: true,
            canManageRules: false,
            emailAddress: 'sales@acme.test',
            permissionCodes: ['mail.read', 'mail.send'],
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-workspace-members') {
        return createJsonResponse([
          {
            id: 'workspace-member-1',
            userEmail: 'owner@acme.test',
            avatarUrl: null,
            name: {
              firstName: 'Tim',
              lastName: 'Apple',
            },
          },
        ]);
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxAssignmentsPage />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Workspace member' })).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Tim Apple (owner@acme.test)' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'sales@acme.test' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox', { name: 'Workspace member' }), {
      target: { value: 'workspace-member-1' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Mailbox account' }), {
      target: { value: 'mailbox-profile-1' },
    });

    await waitFor(() => {
      expect(
        screen.getByText('This mailbox is already assigned to the selected workspace member.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Assign mailbox' })).toBeDisabled();
    });
  });

  it('should block assigning a second primary mailbox to the same workspace member', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string) => {
      if (path === '/api/enterprise/mailbox-profiles') {
        return createJsonResponse([
          {
            id: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            provider: 'alibaba-mail',
            imapHost: 'imap.qiye.aliyun.com',
            imapPort: 993,
            smtpHost: 'smtp.qiye.aliyun.com',
            smtpPort: 465,
            validationStatus: 'validated',
            status: 'active',
          },
          {
            id: 'mailbox-profile-2',
            emailAddress: 'backup@acme.test',
            provider: 'alibaba-mail',
            imapHost: 'imap.qiye.aliyun.com',
            imapPort: 993,
            smtpHost: 'smtp.qiye.aliyun.com',
            smtpPort: 465,
            validationStatus: 'validated',
            status: 'active',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-assignments') {
        return createJsonResponse([
          {
            id: 'assignment-primary',
            mailboxProfileId: 'mailbox-profile-1',
            workspaceMemberId: 'workspace-member-1',
            assignmentStatus: 'active',
            isPrimaryMailbox: true,
            canReceive: true,
            canSend: true,
            canManageRules: false,
            emailAddress: 'sales@acme.test',
            permissionCodes: ['mail.read', 'mail.send'],
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-workspace-members') {
        return createJsonResponse([
          {
            id: 'workspace-member-1',
            userEmail: 'owner@acme.test',
            avatarUrl: null,
            name: {
              firstName: 'Tim',
              lastName: 'Apple',
            },
          },
        ]);
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxAssignmentsPage />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Workspace member' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'backup@acme.test' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox', { name: 'Workspace member' }), {
      target: { value: 'workspace-member-1' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Mailbox account' }), {
      target: { value: 'mailbox-profile-2' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'primary mailbox' }));

    await waitFor(() => {
      expect(screen.getByText('Primary sender: sales@acme.test')).toBeInTheDocument();
      expect(
        screen.getByText(
          'This workspace member already has an active primary mailbox. Remove the existing primary flag or suspend it before switching sender priority.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Assign mailbox' })).toBeDisabled();
    });
  });

  it('should explain shared mailbox routing when another member already owns the primary sender route', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string) => {
      if (path === '/api/enterprise/mailbox-profiles') {
        return createJsonResponse([
          {
            id: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            provider: 'alibaba-mail',
            imapHost: 'imap.qiye.aliyun.com',
            imapPort: 993,
            smtpHost: 'smtp.qiye.aliyun.com',
            smtpPort: 465,
            validationStatus: 'validated',
            status: 'active',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-assignments') {
        return createJsonResponse([
          {
            id: 'assignment-primary',
            mailboxProfileId: 'mailbox-profile-1',
            workspaceMemberId: 'workspace-member-1',
            assignmentStatus: 'active',
            isPrimaryMailbox: true,
            canReceive: true,
            canSend: true,
            canManageRules: false,
            emailAddress: 'sales@acme.test',
            permissionCodes: ['mail.read', 'mail.send'],
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-workspace-members') {
        return createJsonResponse([
          {
            id: 'workspace-member-1',
            userEmail: 'owner@acme.test',
            avatarUrl: null,
            name: {
              firstName: 'Tim',
              lastName: 'Apple',
            },
          },
          {
            id: 'workspace-member-2',
            userEmail: 'seller@acme.test',
            avatarUrl: null,
            name: {
              firstName: 'Jane',
              lastName: 'Seller',
            },
          },
        ]);
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxAssignmentsPage />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Workspace member' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox', { name: 'Workspace member' }), {
      target: { value: 'workspace-member-2' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Mailbox account' }), {
      target: { value: 'mailbox-profile-1' },
    });

    await waitFor(() => {
      expect(screen.getByText('Active assignees: Tim Apple (owner@acme.test)')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Shared mailbox mode: Tim Apple (owner@acme.test) currently owns the primary sender route for this mailbox.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('should save mailbox assignment permission changes through the enterprise API', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/api/enterprise/mailbox-profiles') {
        return createJsonResponse([
          {
            id: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            provider: 'alibaba-mail',
            imapHost: 'imap.qiye.aliyun.com',
            imapPort: 993,
            smtpHost: 'smtp.qiye.aliyun.com',
            smtpPort: 465,
            validationStatus: 'validated',
            status: 'active',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-assignments' && !init?.method) {
        return createJsonResponse([
          {
            id: 'assignment-1',
            mailboxProfileId: 'mailbox-profile-1',
            workspaceMemberId: 'workspace-member-1',
            assignmentStatus: 'active',
            canReceive: true,
            canSend: true,
            canManageRules: false,
            canViewSubordinates: false,
            canHandleSubordinates: false,
            emailAddress: 'sales@acme.test',
            permissionCodes: ['mail.read', 'mail.send'],
          },
        ]);
      }

      if (
        path === '/api/enterprise/mailbox-assignments/assignment-1' &&
        init?.method === 'PATCH'
      ) {
        return createJsonResponse({
          id: 'assignment-1',
        });
      }

      if (path === '/api/enterprise/mailbox-workspace-members') {
        return createJsonResponse([
          {
            id: 'workspace-member-1',
            userEmail: 'owner@acme.test',
            avatarUrl: null,
            name: {
              firstName: 'Tim',
              lastName: 'Apple',
            },
          },
        ]);
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxAssignmentsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit assignment' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit assignment' }));
    const assignmentCell = screen
      .getAllByText('sales@acme.test')
      .find((element) => element.tagName === 'TD');
    const assignmentRow = assignmentCell?.closest('tr');

    if (!assignmentRow) {
      throw new Error('Expected assignment row to exist');
    }

    fireEvent.click(within(assignmentRow).getByRole('checkbox', { name: 'mail.forward' }));
    fireEvent.click(
      within(assignmentRow).getByRole('checkbox', { name: 'canManageRules' }),
    );
    fireEvent.click(within(assignmentRow).getByRole('button', { name: 'Save assignment' }));

    await waitFor(() => {
      expect(enterpriseApiRequestMock).toHaveBeenCalledWith(
        '/api/enterprise/mailbox-assignments/assignment-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            canManageRules: true,
            canViewSubordinates: false,
            canHandleSubordinates: false,
            permissionCodes: ['mail.read', 'mail.send', 'mail.forward'],
          }),
        }),
      );
    });
  });

  it('should suspend an active mailbox assignment through the enterprise API', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/api/enterprise/mailbox-profiles') {
        return createJsonResponse([
          {
            id: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            provider: 'alibaba-mail',
            imapHost: 'imap.qiye.aliyun.com',
            imapPort: 993,
            smtpHost: 'smtp.qiye.aliyun.com',
            smtpPort: 465,
            validationStatus: 'validated',
            status: 'active',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-assignments' && !init?.method) {
        return createJsonResponse([
          {
            id: 'assignment-1',
            mailboxProfileId: 'mailbox-profile-1',
            workspaceMemberId: 'workspace-member-1',
            assignmentStatus: 'active',
            canReceive: true,
            canSend: true,
            canManageRules: false,
            canViewSubordinates: false,
            canHandleSubordinates: false,
            emailAddress: 'sales@acme.test',
            permissionCodes: ['mail.read', 'mail.send'],
          },
        ]);
      }

      if (
        path === '/api/enterprise/mailbox-assignments/assignment-1' &&
        init?.method === 'PATCH'
      ) {
        return createJsonResponse({
          id: 'assignment-1',
          assignmentStatus: 'suspended',
        });
      }

      if (path === '/api/enterprise/mailbox-workspace-members') {
        return createJsonResponse([
          {
            id: 'workspace-member-1',
            userEmail: 'owner@acme.test',
            avatarUrl: null,
            name: {
              firstName: 'Tim',
              lastName: 'Apple',
            },
          },
        ]);
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxAssignmentsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Suspend assignment' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Suspend assignment' }));

    await waitFor(() => {
      expect(enterpriseApiRequestMock).toHaveBeenCalledWith(
        '/api/enterprise/mailbox-assignments/assignment-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            assignmentStatus: 'suspended',
          }),
        }),
      );
    });
  });

  it('should render mailbox rules from the enterprise API', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string) => {
      if (path === '/api/enterprise/mailbox-profiles') {
        return createJsonResponse([
          {
            id: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            provider: 'alibaba-mail',
            imapHost: 'imap.qiye.aliyun.com',
            imapPort: 993,
            smtpHost: 'smtp.qiye.aliyun.com',
            smtpPort: 465,
            validationStatus: 'validated',
            status: 'active',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-rules') {
        return createJsonResponse([
          {
            id: 'mailbox-rule-1',
            mailboxProfileId: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            name: 'Escalate unreplied VIP threads',
            ruleType: 'pending-reply',
            enabled: true,
            priority: 10,
            updatedAt: '2026-05-05T00:00:00.000Z',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-rules/activity') {
        return createJsonResponse([
          {
            id: 'activity-1',
            action: 'enterprise_mailbox_rule.update',
            resourceId: 'mailbox-rule-1',
            actorWorkspaceMemberId: 'workspace-member-1',
            createdAt: '2026-05-07T02:15:00.000Z',
            emailAddress: 'sales@acme.test',
            ruleName: 'Escalate unreplied VIP threads',
            ruleType: 'pending-reply',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-rules/readiness') {
        return createJsonResponse([
          {
            ruleId: 'mailbox-rule-1',
            ruleName: 'Escalate unreplied VIP threads',
            ruleType: 'pending-reply',
            emailAddress: 'sales@acme.test',
            mailboxStatus: 'active',
            validationStatus: 'validated',
            activeAssignmentCount: 1,
            primaryAssignmentCount: 1,
            messageChannelDetected: true,
            sourceFolder: 'INBOX',
            sourceFolderExists: true,
            targetFolder: null,
            targetFolderExists: null,
            warnings: [],
            blockers: [],
            status: 'ready',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-rules/mailbox-rule-1/preview') {
        return createJsonResponse({
          ruleId: 'mailbox-rule-1',
          ruleName: 'Escalate unreplied VIP threads',
          ruleType: 'pending-reply',
          emailAddress: 'sales@acme.test',
          status: 'ready',
          warnings: [],
          blockers: [],
          candidateCount: 1,
          candidates: [
            {
              threadId: 'thread-1',
              messageId: 'message-1',
              subject: 'Need quote update',
              senderHandle: 'buyer@buyer.example.com',
              receivedAt: '2026-05-07T03:15:00.000Z',
              pending: false,
              taskLinked: true,
              crmLinked: true,
              matchedSignals: ['Matched folder INBOX'],
              plannedActions: ['Create follow-up task', 'Apply pending tag'],
            },
          ],
        });
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxRulesPage />);

    expect(screen.getByText('Mailbox Rules')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'sales@acme.test' }),
      ).toBeInTheDocument();
      expect(
        screen.getAllByText('Escalate unreplied VIP threads').length,
      ).toBeGreaterThan(0);
      expect(screen.getByText('Rule coverage and recent activity')).toBeInTheDocument();
      expect(screen.getByText('Rule readiness preview')).toBeInTheDocument();
      expect(screen.getByText('update')).toBeInTheDocument();
      expect(screen.getByText('Ready for runtime execution checks.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit rule' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Disable rule' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Preview rule' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Preview rule' }));

    await waitFor(() => {
      expect(screen.getByText('Dry-run preview')).toBeInTheDocument();
      expect(screen.getByText('Need quote update')).toBeInTheDocument();
      expect(screen.getByText('buyer@buyer.example.com')).toBeInTheDocument();
      expect(screen.getByText('Create follow-up task · Apply pending tag')).toBeInTheDocument();
    });
  });

  it('should save mailbox rule edits through the enterprise API', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/api/enterprise/mailbox-profiles') {
        return createJsonResponse([
          {
            id: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            provider: 'alibaba-mail',
            imapHost: 'imap.qiye.aliyun.com',
            imapPort: 993,
            smtpHost: 'smtp.qiye.aliyun.com',
            smtpPort: 465,
            validationStatus: 'validated',
            status: 'active',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-rules' && !init?.method) {
        return createJsonResponse([
          {
            id: 'mailbox-rule-1',
            mailboxProfileId: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            name: 'Escalate unreplied VIP threads',
            ruleType: 'pending-reply',
            conditionsJson: {
              folder: 'INBOX',
              maxReplyDelayHours: 24,
            },
            actionsJson: {
              createTask: true,
              escalateToManager: false,
            },
            enabled: true,
            priority: 10,
            updatedAt: '2026-05-05T00:00:00.000Z',
          },
        ]);
      }

      if (
        path === '/api/enterprise/mailbox-rules/mailbox-rule-1' &&
        init?.method === 'PATCH'
      ) {
        return createJsonResponse({
          id: 'mailbox-rule-1',
        });
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxRulesPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit rule' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit rule' }));
    fireEvent.change(screen.getByLabelText('Rule name mailbox-rule-1'), {
      target: { value: 'VIP reply escalation' },
    });
    fireEvent.change(screen.getByLabelText('Rule priority mailbox-rule-1'), {
      target: { value: '25' },
    });
    fireEvent.change(screen.getByLabelText('Pending reply folder mailbox-rule-1'), {
      target: { value: 'VIP' },
    });
    fireEvent.change(
      screen.getByLabelText('Pending reply delay hours mailbox-rule-1'),
      {
        target: { value: '6' },
      },
    );
    fireEvent.click(screen.getByLabelText('Pending reply escalate mailbox-rule-1'));
    fireEvent.click(screen.getByLabelText('Pending reply apply tag mailbox-rule-1'));
    fireEvent.click(screen.getByRole('button', { name: 'Save rule' }));

    await waitFor(() => {
      const updateRuleCall = enterpriseApiRequestMock.mock.calls.find(
        ([path, requestInit]) =>
          path === '/api/enterprise/mailbox-rules/mailbox-rule-1' &&
          requestInit?.method === 'PATCH',
      );

      expect(updateRuleCall).toBeDefined();

      const requestBody = JSON.parse(
        String(updateRuleCall?.[1]?.body ?? '{}'),
      );

      expect(requestBody).toEqual({
        name: 'VIP reply escalation',
        priority: 25,
        conditionsJson: {
          folder: 'VIP',
          maxReplyDelayHours: 6,
          onlyUnread: true,
        },
        actionsJson: {
          applyPendingTag: false,
          createTask: true,
          escalateToManager: true,
        },
      });
    });
  });

  it('should create a structured pending reply rule through the enterprise API', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/api/enterprise/mailbox-profiles') {
        return createJsonResponse([
          {
            id: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            provider: 'alibaba-mail',
            imapHost: 'imap.qiye.aliyun.com',
            imapPort: 993,
            smtpHost: 'smtp.qiye.aliyun.com',
            smtpPort: 465,
            validationStatus: 'validated',
            status: 'active',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-rules' && !init?.method) {
        return createJsonResponse([]);
      }

      if (path === '/api/enterprise/mailbox-rules' && init?.method === 'POST') {
        return createJsonResponse({
          id: 'mailbox-rule-new',
        });
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxRulesPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'sales@acme.test' }),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox', { name: 'Rule mailbox account' }), {
      target: { value: 'mailbox-profile-1' },
    });
    fireEvent.change(screen.getByLabelText('Rule name'), {
      target: { value: 'Escalate stale inbox threads' },
    });
    fireEvent.change(screen.getByLabelText('Rule priority'), {
      target: { value: '15' },
    });
    fireEvent.change(screen.getByLabelText('Pending reply folder'), {
      target: { value: 'VIP' },
    });
    fireEvent.change(screen.getByLabelText('Pending reply delay hours'), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByLabelText('escalate to manager'));
    fireEvent.click(screen.getByRole('button', { name: 'Create rule' }));

    await waitFor(() => {
      const createRuleCall = enterpriseApiRequestMock.mock.calls.find(
        ([path, requestInit]) =>
          path === '/api/enterprise/mailbox-rules' &&
          requestInit?.method === 'POST',
      );

      expect(createRuleCall).toBeDefined();

      const requestBody = JSON.parse(
        String(createRuleCall?.[1]?.body ?? '{}'),
      );

      expect(requestBody).toEqual({
        mailboxProfileId: 'mailbox-profile-1',
        name: 'Escalate stale inbox threads',
        ruleType: 'pending-reply',
        enabled: true,
        priority: 15,
        conditionsJson: {
          folder: 'VIP',
          maxReplyDelayHours: 8,
          onlyUnread: true,
        },
        actionsJson: {
          applyPendingTag: true,
          createTask: true,
          escalateToManager: true,
        },
      });
    });
  });

  it('should create a structured folder routing rule through the enterprise API', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/api/enterprise/mailbox-profiles') {
        return createJsonResponse([
          {
            id: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            provider: 'alibaba-mail',
            imapHost: 'imap.qiye.aliyun.com',
            imapPort: 993,
            smtpHost: 'smtp.qiye.aliyun.com',
            smtpPort: 465,
            validationStatus: 'validated',
            status: 'active',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-rules' && !init?.method) {
        return createJsonResponse([]);
      }

      if (path === '/api/enterprise/mailbox-rules' && init?.method === 'POST') {
        return createJsonResponse({
          id: 'mailbox-rule-routing',
        });
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxRulesPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'sales@acme.test' }),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox', { name: 'Rule mailbox account' }), {
      target: { value: 'mailbox-profile-1' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Rule type' }), {
      target: { value: 'folder-routing' },
    });
    fireEvent.change(screen.getByLabelText('Rule name'), {
      target: { value: 'Route Alibaba system mail' },
    });
    fireEvent.change(screen.getByLabelText('Rule priority'), {
      target: { value: '30' },
    });
    fireEvent.change(screen.getByLabelText('Folder routing source folder'), {
      target: { value: 'INBOX' },
    });
    fireEvent.change(screen.getByLabelText('Folder routing target folder'), {
      target: { value: 'Pending' },
    });
    fireEvent.change(screen.getByLabelText('Folder routing sender domain'), {
      target: { value: 'alibaba.com' },
    });
    fireEvent.change(screen.getByLabelText('Folder routing subject keyword'), {
      target: { value: 'RFQ' },
    });
    fireEvent.click(screen.getByLabelText('mark as read after routing'));
    fireEvent.click(screen.getByRole('button', { name: 'Create rule' }));

    await waitFor(() => {
      const createRuleCall = enterpriseApiRequestMock.mock.calls.find(
        ([path, requestInit]) =>
          path === '/api/enterprise/mailbox-rules' &&
          requestInit?.method === 'POST',
      );

      expect(createRuleCall).toBeDefined();

      const requestBody = JSON.parse(
        String(createRuleCall?.[1]?.body ?? '{}'),
      );

      expect(requestBody).toEqual({
        mailboxProfileId: 'mailbox-profile-1',
        name: 'Route Alibaba system mail',
        ruleType: 'folder-routing',
        enabled: true,
        priority: 30,
        conditionsJson: {
          sourceFolder: 'INBOX',
          senderDomain: 'alibaba.com',
          subjectKeyword: 'RFQ',
        },
        actionsJson: {
          targetFolder: 'Pending',
          markAsRead: true,
          stopFurtherRules: true,
        },
      });
    });
  });

  it('should save folder routing rule edits through the enterprise API', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/api/enterprise/mailbox-profiles') {
        return createJsonResponse([
          {
            id: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            provider: 'alibaba-mail',
            imapHost: 'imap.qiye.aliyun.com',
            imapPort: 993,
            smtpHost: 'smtp.qiye.aliyun.com',
            smtpPort: 465,
            validationStatus: 'validated',
            status: 'active',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-rules' && !init?.method) {
        return createJsonResponse([
          {
            id: 'mailbox-rule-routing-1',
            mailboxProfileId: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            name: 'Route RFQ mail',
            ruleType: 'folder-routing',
            conditionsJson: {
              sourceFolder: 'INBOX',
              senderDomain: 'alibaba.com',
              subjectKeyword: 'RFQ',
            },
            actionsJson: {
              targetFolder: 'VIP',
              markAsRead: false,
              stopFurtherRules: true,
            },
            enabled: true,
            priority: 12,
            updatedAt: '2026-05-05T00:00:00.000Z',
          },
        ]);
      }

      if (
        path === '/api/enterprise/mailbox-rules/mailbox-rule-routing-1' &&
        init?.method === 'PATCH'
      ) {
        return createJsonResponse({
          id: 'mailbox-rule-routing-1',
        });
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxRulesPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit rule' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit rule' }));
    fireEvent.change(screen.getByLabelText('Rule name mailbox-rule-routing-1'), {
      target: { value: 'Route RFQ alerts' },
    });
    fireEvent.change(screen.getByLabelText('Rule priority mailbox-rule-routing-1'), {
      target: { value: '40' },
    });
    fireEvent.change(
      screen.getByLabelText('Folder routing source folder mailbox-rule-routing-1'),
      {
        target: { value: 'VIP' },
      },
    );
    fireEvent.change(
      screen.getByLabelText('Folder routing sender domain mailbox-rule-routing-1'),
      {
        target: { value: '1688.com' },
      },
    );
    fireEvent.change(
      screen.getByLabelText('Folder routing subject keyword mailbox-rule-routing-1'),
      {
        target: { value: 'New inquiry' },
      },
    );
    fireEvent.change(
      screen.getByLabelText('Folder routing target folder mailbox-rule-routing-1'),
      {
        target: { value: 'Archive' },
      },
    );
    fireEvent.click(
      screen.getByLabelText('Folder routing mark as read mailbox-rule-routing-1'),
    );
    fireEvent.click(
      screen.getByLabelText('Folder routing stop rules mailbox-rule-routing-1'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save rule' }));

    await waitFor(() => {
      const updateRuleCall = enterpriseApiRequestMock.mock.calls.find(
        ([path, requestInit]) =>
          path === '/api/enterprise/mailbox-rules/mailbox-rule-routing-1' &&
          requestInit?.method === 'PATCH',
      );

      expect(updateRuleCall).toBeDefined();

      const requestBody = JSON.parse(
        String(updateRuleCall?.[1]?.body ?? '{}'),
      );

      expect(requestBody).toEqual({
        name: 'Route RFQ alerts',
        priority: 40,
        conditionsJson: {
          sourceFolder: 'VIP',
          senderDomain: '1688.com',
          subjectKeyword: 'New inquiry',
        },
        actionsJson: {
          targetFolder: 'Archive',
          markAsRead: true,
          stopFurtherRules: false,
        },
      });
    });
  });

  it('should create a structured customer auto-link rule through the enterprise API', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/api/enterprise/mailbox-profiles') {
        return createJsonResponse([
          {
            id: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            provider: 'alibaba-mail',
            imapHost: 'imap.qiye.aliyun.com',
            imapPort: 993,
            smtpHost: 'smtp.qiye.aliyun.com',
            smtpPort: 465,
            validationStatus: 'validated',
            status: 'active',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-rules' && !init?.method) {
        return createJsonResponse([]);
      }

      if (path === '/api/enterprise/mailbox-rules' && init?.method === 'POST') {
        return createJsonResponse({
          id: 'mailbox-rule-customer-link',
        });
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxRulesPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'sales@acme.test' }),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox', { name: 'Rule mailbox account' }), {
      target: { value: 'mailbox-profile-1' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Rule type' }), {
      target: { value: 'customer-auto-link' },
    });
    fireEvent.change(screen.getByLabelText('Rule name'), {
      target: { value: 'Auto-link buyer threads' },
    });
    fireEvent.change(screen.getByLabelText('Rule priority'), {
      target: { value: '35' },
    });
    fireEvent.change(screen.getByLabelText('Customer auto-link sender domain'), {
      target: { value: 'buyer.example.com' },
    });
    fireEvent.click(screen.getByLabelText('require known contact'));
    fireEvent.click(screen.getByLabelText('attach to latest open opportunity'));
    fireEvent.click(screen.getByRole('button', { name: 'Create rule' }));

    await waitFor(() => {
      const createRuleCall = enterpriseApiRequestMock.mock.calls.find(
        ([path, requestInit]) =>
          path === '/api/enterprise/mailbox-rules' &&
          requestInit?.method === 'POST',
      );

      expect(createRuleCall).toBeDefined();

      const requestBody = JSON.parse(
        String(createRuleCall?.[1]?.body ?? '{}'),
      );

      expect(requestBody).toEqual({
        mailboxProfileId: 'mailbox-profile-1',
        name: 'Auto-link buyer threads',
        ruleType: 'customer-auto-link',
        enabled: true,
        priority: 35,
        conditionsJson: {
          onlyUnlinkedThreads: true,
          requireKnownContact: true,
          senderDomain: 'buyer.example.com',
        },
        actionsJson: {
          attachToLatestOpportunity: true,
          createLeadWhenUnmatched: false,
          linkToCompany: true,
          linkToPerson: true,
        },
      });
    });
  });

  it('should save customer auto-link rule edits through the enterprise API', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/api/enterprise/mailbox-profiles') {
        return createJsonResponse([
          {
            id: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            provider: 'alibaba-mail',
            imapHost: 'imap.qiye.aliyun.com',
            imapPort: 993,
            smtpHost: 'smtp.qiye.aliyun.com',
            smtpPort: 465,
            validationStatus: 'validated',
            status: 'active',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-rules' && !init?.method) {
        return createJsonResponse([
          {
            id: 'mailbox-rule-customer-link-1',
            mailboxProfileId: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            name: 'Auto-link buyer threads',
            ruleType: 'customer-auto-link',
            conditionsJson: {
              onlyUnlinkedThreads: true,
              requireKnownContact: false,
              senderDomain: 'buyer.example.com',
            },
            actionsJson: {
              attachToLatestOpportunity: false,
              createLeadWhenUnmatched: false,
              linkToCompany: true,
              linkToPerson: true,
            },
            enabled: true,
            priority: 18,
            updatedAt: '2026-05-05T00:00:00.000Z',
          },
        ]);
      }

      if (
        path === '/api/enterprise/mailbox-rules/mailbox-rule-customer-link-1' &&
        init?.method === 'PATCH'
      ) {
        return createJsonResponse({
          id: 'mailbox-rule-customer-link-1',
        });
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxRulesPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit rule' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit rule' }));
    fireEvent.change(screen.getByLabelText('Rule name mailbox-rule-customer-link-1'), {
      target: { value: 'Auto-link strategic buyers' },
    });
    fireEvent.change(
      screen.getByLabelText('Rule priority mailbox-rule-customer-link-1'),
      {
        target: { value: '45' },
      },
    );
    fireEvent.change(
      screen.getByLabelText(
        'Customer auto-link sender domain mailbox-rule-customer-link-1',
      ),
      {
        target: { value: 'strategic.example.com' },
      },
    );
    fireEvent.click(
      screen.getByLabelText(
        'Customer auto-link require known contact mailbox-rule-customer-link-1',
      ),
    );
    fireEvent.click(
      screen.getByLabelText(
        'Customer auto-link attach opportunity mailbox-rule-customer-link-1',
      ),
    );
    fireEvent.click(
      screen.getByLabelText(
        'Customer auto-link create lead mailbox-rule-customer-link-1',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save rule' }));

    await waitFor(() => {
      const updateRuleCall = enterpriseApiRequestMock.mock.calls.find(
        ([path, requestInit]) =>
          path ===
            '/api/enterprise/mailbox-rules/mailbox-rule-customer-link-1' &&
          requestInit?.method === 'PATCH',
      );

      expect(updateRuleCall).toBeDefined();

      const requestBody = JSON.parse(
        String(updateRuleCall?.[1]?.body ?? '{}'),
      );

      expect(requestBody).toEqual({
        name: 'Auto-link strategic buyers',
        priority: 45,
        conditionsJson: {
          onlyUnlinkedThreads: true,
          requireKnownContact: true,
          senderDomain: 'strategic.example.com',
        },
        actionsJson: {
          attachToLatestOpportunity: true,
          createLeadWhenUnmatched: true,
          linkToCompany: true,
          linkToPerson: true,
        },
      });
    });
  });

  it('should create a structured subordinate escalation rule through the enterprise API', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/api/enterprise/mailbox-profiles') {
        return createJsonResponse([
          {
            id: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            provider: 'alibaba-mail',
            imapHost: 'imap.qiye.aliyun.com',
            imapPort: 993,
            smtpHost: 'smtp.qiye.aliyun.com',
            smtpPort: 465,
            validationStatus: 'validated',
            status: 'active',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-rules' && !init?.method) {
        return createJsonResponse([]);
      }

      if (path === '/api/enterprise/mailbox-rules' && init?.method === 'POST') {
        return createJsonResponse({
          id: 'mailbox-rule-subordinate-escalation',
        });
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxRulesPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: 'sales@acme.test' }),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox', { name: 'Rule mailbox account' }), {
      target: { value: 'mailbox-profile-1' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Rule type' }), {
      target: { value: 'subordinate-escalation' },
    });
    fireEvent.change(screen.getByLabelText('Rule name'), {
      target: { value: 'Escalate stalled subordinate replies' },
    });
    fireEvent.change(screen.getByLabelText('Rule priority'), {
      target: { value: '55' },
    });
    fireEvent.change(
      screen.getByLabelText('Subordinate escalation source folder'),
      {
        target: { value: 'Pending' },
      },
    );
    fireEvent.change(
      screen.getByLabelText('Subordinate escalation delay hours'),
      {
        target: { value: '18' },
      },
    );
    fireEvent.click(screen.getByLabelText('notify current owner'));
    fireEvent.click(screen.getByLabelText('reassign to primary sender route'));
    fireEvent.click(screen.getByRole('button', { name: 'Create rule' }));

    await waitFor(() => {
      const createRuleCall = enterpriseApiRequestMock.mock.calls.find(
        ([path, requestInit]) =>
          path === '/api/enterprise/mailbox-rules' &&
          requestInit?.method === 'POST',
      );

      expect(createRuleCall).toBeDefined();

      const requestBody = JSON.parse(
        String(createRuleCall?.[1]?.body ?? '{}'),
      );

      expect(requestBody).toEqual({
        mailboxProfileId: 'mailbox-profile-1',
        name: 'Escalate stalled subordinate replies',
        ruleType: 'subordinate-escalation',
        enabled: true,
        priority: 55,
        conditionsJson: {
          sourceFolder: 'Pending',
          maxReplyDelayHours: 18,
          onlyAssignedThreads: true,
        },
        actionsJson: {
          createTask: true,
          escalateToManager: true,
          notifyOwner: false,
          reassignToPrimarySender: true,
        },
      });
    });
  });

  it('should save subordinate escalation rule edits through the enterprise API', async () => {
    enterpriseApiRequestMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/api/enterprise/mailbox-profiles') {
        return createJsonResponse([
          {
            id: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            provider: 'alibaba-mail',
            imapHost: 'imap.qiye.aliyun.com',
            imapPort: 993,
            smtpHost: 'smtp.qiye.aliyun.com',
            smtpPort: 465,
            validationStatus: 'validated',
            status: 'active',
          },
        ]);
      }

      if (path === '/api/enterprise/mailbox-rules' && !init?.method) {
        return createJsonResponse([
          {
            id: 'mailbox-rule-subordinate-escalation-1',
            mailboxProfileId: 'mailbox-profile-1',
            emailAddress: 'sales@acme.test',
            name: 'Escalate subordinate backlog',
            ruleType: 'subordinate-escalation',
            conditionsJson: {
              sourceFolder: 'INBOX',
              maxReplyDelayHours: 12,
              onlyAssignedThreads: true,
            },
            actionsJson: {
              createTask: true,
              escalateToManager: true,
              notifyOwner: true,
              reassignToPrimarySender: false,
            },
            enabled: true,
            priority: 22,
            updatedAt: '2026-05-05T00:00:00.000Z',
          },
        ]);
      }

      if (
        path ===
          '/api/enterprise/mailbox-rules/mailbox-rule-subordinate-escalation-1' &&
        init?.method === 'PATCH'
      ) {
        return createJsonResponse({
          id: 'mailbox-rule-subordinate-escalation-1',
        });
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    render(<EnterpriseMailboxRulesPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit rule' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit rule' }));
    fireEvent.change(
      screen.getByLabelText('Rule name mailbox-rule-subordinate-escalation-1'),
      {
        target: { value: 'Escalate long-tail subordinate backlog' },
      },
    );
    fireEvent.change(
      screen.getByLabelText(
        'Rule priority mailbox-rule-subordinate-escalation-1',
      ),
      {
        target: { value: '65' },
      },
    );
    fireEvent.change(
      screen.getByLabelText(
        'Subordinate escalation source folder mailbox-rule-subordinate-escalation-1',
      ),
      {
        target: { value: 'VIP' },
      },
    );
    fireEvent.change(
      screen.getByLabelText(
        'Subordinate escalation delay hours mailbox-rule-subordinate-escalation-1',
      ),
      {
        target: { value: '20' },
      },
    );
    fireEvent.click(
      screen.getByLabelText(
        'Subordinate escalation notify owner mailbox-rule-subordinate-escalation-1',
      ),
    );
    fireEvent.click(
      screen.getByLabelText(
        'Subordinate escalation reassign primary mailbox-rule-subordinate-escalation-1',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save rule' }));

    await waitFor(() => {
      const updateRuleCall = enterpriseApiRequestMock.mock.calls.find(
        ([path, requestInit]) =>
          path ===
            '/api/enterprise/mailbox-rules/mailbox-rule-subordinate-escalation-1' &&
          requestInit?.method === 'PATCH',
      );

      expect(updateRuleCall).toBeDefined();

      const requestBody = JSON.parse(
        String(updateRuleCall?.[1]?.body ?? '{}'),
      );

      expect(requestBody).toEqual({
        name: 'Escalate long-tail subordinate backlog',
        priority: 65,
        conditionsJson: {
          sourceFolder: 'VIP',
          maxReplyDelayHours: 20,
          onlyAssignedThreads: true,
        },
        actionsJson: {
          createTask: true,
          escalateToManager: true,
          notifyOwner: false,
          reassignToPrimarySender: true,
        },
      });
    });
  });
});
