import { useMemo } from 'react';

import { EnterprisePermissionGuard } from '@/enterprise/shared/components/EnterprisePermissionGuard';
import { EnterpriseShell } from '@/enterprise/shared/components/EnterpriseShell';
import { enterprisePermissionCodes } from '@/enterprise/shared/constants/enterprisePermissions';
import { Button } from 'twenty-ui/input';

import {
  buildEnterpriseSidebar,
  StyledEmpty,
  StyledGrid,
  StyledHero,
  StyledHeroText,
  StyledHeroTitle,
  StyledPanel,
  StyledSectionHeader,
  StyledSectionText,
  StyledSectionTitle,
  StyledStatus,
  StyledTable,
} from '~/pages/enterprise/mailbox-control/components/EnterpriseMailboxControlStyles';
import { useEnterpriseMailboxHealth } from '~/pages/enterprise/mailbox-control/hooks/useEnterpriseMailboxHealth';

const getHealthTone = (
  lastSyncStatus: string | null,
  validationStatus: string,
) => {
  if (lastSyncStatus === 'healthy' || validationStatus === 'validated') {
    return 'success' as const;
  }

  if (lastSyncStatus === 'failed' || validationStatus === 'failed') {
    return 'warning' as const;
  }

  return 'neutral' as const;
};

export const EnterpriseMailboxHealthPage = () => {
  const sidebar = useMemo(buildEnterpriseSidebar, []);
  const { isLoading, loadMailboxHealth, mailboxHealthSnapshots } =
    useEnterpriseMailboxHealth();

  return (
    <EnterprisePermissionGuard
      requiredPermission={enterprisePermissionCodes.mailboxRead}
    >
      <EnterpriseShell title="Mailbox Health" sidebar={sidebar}>
        <StyledGrid>
          <StyledHero>
            <StyledHeroTitle>Mailbox health</StyledHeroTitle>
            <StyledHeroText>
              Track mailbox connectivity, validation state, and last sync
              status here before rolling the mailbox out to sellers.
            </StyledHeroText>
          </StyledHero>

          <StyledPanel>
            <StyledSectionHeader>
              <div>
                <StyledSectionTitle>Connection snapshots</StyledSectionTitle>
                <StyledSectionText>
                  Validation and last sync status are the first checkpoints.
                  More sync diagnostics can layer on top of this view later.
                </StyledSectionText>
              </div>
              <Button
                variant="secondary"
                title="Refresh health"
                onClick={() => void loadMailboxHealth()}
              />
            </StyledSectionHeader>

            {isLoading ? (
              <StyledEmpty>Loading mailbox health...</StyledEmpty>
            ) : mailboxHealthSnapshots.length === 0 ? (
              <StyledEmpty>No mailbox health data yet.</StyledEmpty>
            ) : (
              <StyledTable>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Provider</th>
                    <th>Validation</th>
                    <th>Sync</th>
                    <th>Last sync at</th>
                  </tr>
                </thead>
                <tbody>
                  {mailboxHealthSnapshots.map((snapshot) => (
                    <tr key={snapshot.mailboxProfileId}>
                      <td>{snapshot.emailAddress}</td>
                      <td>{snapshot.provider}</td>
                      <td>
                        <StyledStatus
                          tone={getHealthTone(null, snapshot.validationStatus)}
                        >
                          {snapshot.validationStatus}
                        </StyledStatus>
                      </td>
                      <td>
                        <StyledStatus
                          tone={getHealthTone(
                            snapshot.lastSyncStatus,
                            snapshot.validationStatus,
                          )}
                        >
                          {snapshot.lastSyncStatus ?? 'pending'}
                        </StyledStatus>
                      </td>
                      <td>{snapshot.lastSyncAt ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </StyledTable>
            )}
          </StyledPanel>
        </StyledGrid>
      </EnterpriseShell>
    </EnterprisePermissionGuard>
  );
};
