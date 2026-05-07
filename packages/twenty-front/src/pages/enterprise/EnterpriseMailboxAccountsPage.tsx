import { useMemo, useState } from 'react';

import { EnterprisePermissionGuard } from '@/enterprise/shared/components/EnterprisePermissionGuard';
import { EnterpriseShell } from '@/enterprise/shared/components/EnterpriseShell';
import { enterprisePermissionCodes } from '@/enterprise/shared/constants/enterprisePermissions';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Button } from 'twenty-ui/input';

import {
  buildEnterpriseSidebar,
  StyledEmpty,
  StyledField,
  StyledFormGrid,
  StyledGrid,
  StyledHero,
  StyledHeroText,
  StyledHeroTitle,
  StyledInput,
  StyledLabel,
  StyledMetaItem,
  StyledMetaList,
  StyledPanel,
  StyledSectionHeader,
  StyledSectionText,
  StyledSectionTitle,
  StyledStatus,
  StyledTable,
} from '~/pages/enterprise/mailbox-control/components/EnterpriseMailboxControlStyles';
import { useEnterpriseMailboxProfiles } from '~/pages/enterprise/mailbox-control/hooks/useEnterpriseMailboxProfiles';

const getValidationTone = (validationStatus: string) => {
  if (validationStatus === 'validated') {
    return 'success' as const;
  }

  if (validationStatus === 'failed') {
    return 'warning' as const;
  }

  return 'neutral' as const;
};

export const EnterpriseMailboxAccountsPage = () => {
  const sidebar = useMemo(buildEnterpriseSidebar, []);
  const { enqueueErrorSnackBar } = useSnackBar();
  const {
    createMailboxProfile,
    isLoading,
    mailboxProfiles,
    validateMailboxProfile,
  } = useEnterpriseMailboxProfiles();
  const [emailAddress, setEmailAddress] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const submitMailboxProfile = async () => {
    setIsSaving(true);

    try {
      await createMailboxProfile({
        emailAddress: emailAddress.trim(),
        loginUsername: loginUsername.trim(),
        secret,
      });

      setEmailAddress('');
      setLoginUsername('');
      setSecret('');
    } catch {
      enqueueErrorSnackBar({ message: 'Failed to create mailbox account' });
    } finally {
      setIsSaving(false);
    }
  };

  const onValidateMailboxProfile = async (mailboxProfileId: string) => {
    try {
      await validateMailboxProfile(mailboxProfileId);
    } catch {
      enqueueErrorSnackBar({
        message: 'Mailbox validation failed. Check the IMAP/SMTP credentials.',
      });
    }
  };

  return (
    <EnterprisePermissionGuard
      requiredPermission={enterprisePermissionCodes.mailboxRead}
    >
      <EnterpriseShell title="Mailbox Accounts" sidebar={sidebar}>
        <StyledGrid>
          <StyledHero>
            <StyledHeroTitle>Alibaba Mail</StyledHeroTitle>
            <StyledHeroText>
              Admins bind Alibaba mailbox accounts here, maintain the IMAP /
              SMTP connection settings, and then assign those accounts to sales
              users or managers.
            </StyledHeroText>
            <StyledMetaList>
              <StyledMetaItem>
                IMAP: imap.qiye.aliyun.com:993 / SSL
              </StyledMetaItem>
              <StyledMetaItem>
                SMTP: smtp.qiye.aliyun.com:465 / SSL
              </StyledMetaItem>
              <StyledMetaItem>
                Credential mode: authorization code
              </StyledMetaItem>
            </StyledMetaList>
          </StyledHero>

          <StyledPanel>
            <StyledSectionHeader>
              <div>
                <StyledSectionTitle>Bind mailbox account</StyledSectionTitle>
                <StyledSectionText>
                  Create the mailbox profile here before assigning the account
                  to a CRM user.
                </StyledSectionText>
              </div>
            </StyledSectionHeader>

            <StyledFormGrid>
              <StyledField>
                <StyledLabel>Mailbox address</StyledLabel>
                <StyledInput
                  value={emailAddress}
                  placeholder="sales@example.com"
                  onChange={(event) => setEmailAddress(event.target.value)}
                />
              </StyledField>
              <StyledField>
                <StyledLabel>Login username</StyledLabel>
                <StyledInput
                  value={loginUsername}
                  placeholder="sales@example.com"
                  onChange={(event) => setLoginUsername(event.target.value)}
                />
              </StyledField>
              <StyledField>
                <StyledLabel>Authorization code</StyledLabel>
                <StyledInput
                  value={secret}
                  type="password"
                  placeholder="Alibaba mailbox authorization code"
                  onChange={(event) => setSecret(event.target.value)}
                />
              </StyledField>
            </StyledFormGrid>

            <Button
              title="Create mailbox profile"
              disabled={
                !emailAddress.trim() ||
                !loginUsername.trim() ||
                !secret.trim() ||
                isSaving
              }
              onClick={submitMailboxProfile}
            />
          </StyledPanel>

          <StyledPanel>
            <StyledSectionHeader>
              <div>
                <StyledSectionTitle>Existing mailbox accounts</StyledSectionTitle>
                <StyledSectionText>
                  Review the mailbox accounts already registered for this
                  workspace and validate the connection before assigning them.
                </StyledSectionText>
              </div>
            </StyledSectionHeader>

            {isLoading ? (
              <StyledEmpty>Loading mailbox accounts...</StyledEmpty>
            ) : mailboxProfiles.length === 0 ? (
              <StyledEmpty>No mailbox accounts yet.</StyledEmpty>
            ) : (
              <StyledTable>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Provider</th>
                    <th>IMAP</th>
                    <th>SMTP</th>
                    <th>Validation</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mailboxProfiles.map((mailboxProfile) => (
                    <tr key={mailboxProfile.id}>
                      <td>{mailboxProfile.emailAddress}</td>
                      <td>{mailboxProfile.provider}</td>
                      <td>
                        {mailboxProfile.imapHost}:{mailboxProfile.imapPort}
                      </td>
                      <td>
                        {mailboxProfile.smtpHost}:{mailboxProfile.smtpPort}
                      </td>
                      <td>
                        <StyledStatus
                          tone={getValidationTone(mailboxProfile.validationStatus)}
                        >
                          {mailboxProfile.validationStatus}
                        </StyledStatus>
                      </td>
                      <td>
                        <Button
                          variant="secondary"
                          title="Validate"
                          onClick={() =>
                            void onValidateMailboxProfile(mailboxProfile.id)
                          }
                        />
                      </td>
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
