import { useMemo, useState } from 'react';

import { EnterprisePermissionGuard } from '@/enterprise/shared/components/EnterprisePermissionGuard';
import { EnterpriseShell } from '@/enterprise/shared/components/EnterpriseShell';
import { enterprisePermissionCodes } from '@/enterprise/shared/constants/enterprisePermissions';
import { useEnterpriseApiRequest } from '@/enterprise/shared/hooks/useEnterpriseApiRequest';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Button } from 'twenty-ui/input';

import {
  buildEnterpriseSidebar,
  StyledCheckboxGrid,
  StyledCheckboxLabel,
  StyledEmpty,
  StyledField,
  StyledFormGrid,
  StyledGrid,
  StyledHero,
  StyledHeroText,
  StyledHeroTitle,
  StyledLabel,
  StyledMetaItem,
  StyledMetaList,
  StyledPanel,
  StyledSectionText,
  StyledSectionTitle,
  StyledSelect,
  StyledStatus,
  StyledTable,
} from '~/pages/enterprise/mailbox-control/components/EnterpriseMailboxControlStyles';
import { useEnterpriseMailboxAssignments } from '~/pages/enterprise/mailbox-control/hooks/useEnterpriseMailboxAssignments';
import { useEnterpriseMailboxProfiles } from '~/pages/enterprise/mailbox-control/hooks/useEnterpriseMailboxProfiles';
import { useEnterpriseMailboxWorkspaceMembers } from '~/pages/enterprise/mailbox-control/hooks/useEnterpriseMailboxWorkspaceMembers';

const assignmentPermissionCodes = [
  'mail.read',
  'mail.send',
  'mail.reply',
  'mail.forward',
  'mail.move',
  'mail.tag',
] as const;

const formatWorkspaceMemberLabel = (workspaceMember: {
  userEmail: string;
  name: {
    firstName: string | null;
    lastName: string | null;
  };
}) => {
  const fullName =
    `${workspaceMember.name.firstName ?? ''} ${workspaceMember.name.lastName ?? ''}`.trim();

  return fullName.length > 0
    ? `${fullName} (${workspaceMember.userEmail})`
    : workspaceMember.userEmail;
};

export const EnterpriseMailboxAssignmentsPage = () => {
  const sidebar = useMemo(buildEnterpriseSidebar, []);
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const { workspaceMembers } = useEnterpriseMailboxWorkspaceMembers();
  const { mailboxProfiles } = useEnterpriseMailboxProfiles();
  const {
    isLoading,
    loadMailboxAssignments,
    mailboxAssignments,
    updateMailboxAssignment,
  } =
    useEnterpriseMailboxAssignments();
  const [workspaceMemberId, setWorkspaceMemberId] = useState('');
  const [mailboxProfileId, setMailboxProfileId] = useState('');
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState<string[]>([
    'mail.read',
    'mail.send',
  ]);
  const [isPrimaryMailbox, setIsPrimaryMailbox] = useState(false);
  const [canManageRules, setCanManageRules] = useState(false);
  const [canViewSubordinates, setCanViewSubordinates] = useState(false);
  const [canHandleSubordinates, setCanHandleSubordinates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [editingPermissionCodes, setEditingPermissionCodes] = useState<string[]>([]);
  const [editingCanManageRules, setEditingCanManageRules] = useState(false);
  const [editingCanViewSubordinates, setEditingCanViewSubordinates] = useState(false);
  const [editingCanHandleSubordinates, setEditingCanHandleSubordinates] = useState(false);

  const getEnterpriseErrorMessage = async (response: Response) => {
    try {
      const data = (await response.json()) as {
        message?: string | string[];
      };

      if (Array.isArray(data.message)) {
        return data.message.join(', ');
      }

      return data.message ?? 'Enterprise mailbox request failed';
    } catch {
      return 'Enterprise mailbox request failed';
    }
  };

  const workspaceMemberOptions = useMemo(
    () =>
      workspaceMembers.map((workspaceMember) => ({
        label: formatWorkspaceMemberLabel(workspaceMember),
        value: workspaceMember.id,
      })),
    [workspaceMembers],
  );

  const mailboxProfileOptions = useMemo(
    () =>
      mailboxProfiles.map((mailboxProfile) => ({
        label: mailboxProfile.emailAddress,
        value: mailboxProfile.id,
      })),
    [mailboxProfiles],
  );

  const workspaceMemberLabelById = useMemo(
    () =>
      Object.fromEntries(
        workspaceMembers.map((workspaceMember) => [
          workspaceMember.id,
          formatWorkspaceMemberLabel(workspaceMember),
        ]),
      ),
    [workspaceMembers],
  );

  const selectedWorkspaceMember = useMemo(
    () =>
      workspaceMembers.find(
        (workspaceMember) => workspaceMember.id === workspaceMemberId,
      ),
    [workspaceMemberId, workspaceMembers],
  );

  const selectedMailboxProfile = useMemo(
    () =>
      mailboxProfiles.find((mailboxProfile) => mailboxProfile.id === mailboxProfileId),
    [mailboxProfileId, mailboxProfiles],
  );

  const selectedWorkspaceMemberAssignmentCount = useMemo(
    () =>
      mailboxAssignments.filter(
        (mailboxAssignment) =>
          mailboxAssignment.workspaceMemberId === workspaceMemberId &&
          mailboxAssignment.assignmentStatus !== 'suspended',
      ).length,
    [mailboxAssignments, workspaceMemberId],
  );

  const selectedMailboxAssignments = useMemo(
    () =>
      mailboxAssignments.filter(
        (mailboxAssignment) => mailboxAssignment.mailboxProfileId === mailboxProfileId,
      ),
    [mailboxAssignments, mailboxProfileId],
  );

  const selectedMailboxActiveAssignments = useMemo(
    () =>
      selectedMailboxAssignments.filter(
        (mailboxAssignment) => mailboxAssignment.assignmentStatus === 'active',
      ),
    [selectedMailboxAssignments],
  );

  const activePrimaryMailboxAssignmentForSelectedMember = useMemo(
    () =>
      mailboxAssignments.find(
        (mailboxAssignment) =>
          mailboxAssignment.workspaceMemberId === workspaceMemberId &&
          mailboxAssignment.assignmentStatus === 'active' &&
          mailboxAssignment.isPrimaryMailbox,
      ),
    [mailboxAssignments, workspaceMemberId],
  );

  const activePrimaryAssignmentForSelectedMailbox = useMemo(
    () =>
      selectedMailboxActiveAssignments.find(
        (mailboxAssignment) => mailboxAssignment.isPrimaryMailbox,
      ),
    [selectedMailboxActiveAssignments],
  );

  const duplicateAssignment = useMemo(
    () =>
      mailboxAssignments.some(
        (mailboxAssignment) =>
          mailboxAssignment.mailboxProfileId === mailboxProfileId &&
          mailboxAssignment.workspaceMemberId === workspaceMemberId,
      ),
    [mailboxAssignments, mailboxProfileId, workspaceMemberId],
  );

  const selectedMailboxValidationReady =
    selectedMailboxProfile?.validationStatus === 'validated' &&
    selectedMailboxProfile.status === 'active';
  const primaryMailboxConflict =
    isPrimaryMailbox &&
    activePrimaryMailboxAssignmentForSelectedMember !== undefined;

  const togglePermission = (permissionCode: string) => {
    setSelectedPermissionCodes((currentPermissionCodes) =>
      currentPermissionCodes.includes(permissionCode)
        ? currentPermissionCodes.filter((item) => item !== permissionCode)
        : [...currentPermissionCodes, permissionCode],
    );
  };

  const toggleEditingPermission = (permissionCode: string) => {
    setEditingPermissionCodes((currentPermissionCodes) =>
      currentPermissionCodes.includes(permissionCode)
        ? currentPermissionCodes.filter((item) => item !== permissionCode)
        : [...currentPermissionCodes, permissionCode],
    );
  };

  const assignMailbox = async () => {
    setIsSaving(true);

    try {
      const response = await enterpriseApiRequest('/api/enterprise/mailbox-assignments', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          canHandleSubordinates,
          canManageRules,
          mailboxProfileId,
          workspaceMemberId,
          isPrimaryMailbox,
          canReceive: true,
          canSend: selectedPermissionCodes.includes('mail.send'),
          canViewSubordinates,
          permissionCodes: selectedPermissionCodes,
        }),
      });

      if (!response.ok) {
        throw new Error(await getEnterpriseErrorMessage(response));
      }

      enqueueSuccessSnackBar({
        message: 'Enterprise mailbox assigned to workspace member',
      });
      setWorkspaceMemberId('');
      setMailboxProfileId('');
      setCanHandleSubordinates(false);
      setCanManageRules(false);
      setCanViewSubordinates(false);
      setIsPrimaryMailbox(false);
      setSelectedPermissionCodes(['mail.read', 'mail.send']);
      await loadMailboxAssignments();
    } catch (error) {
      enqueueErrorSnackBar({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to assign enterprise mailbox',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const startEditingAssignment = (assignment: (typeof mailboxAssignments)[number]) => {
    setEditingAssignmentId(assignment.id);
    setEditingPermissionCodes(assignment.permissionCodes);
    setEditingCanManageRules(assignment.canManageRules);
    setEditingCanViewSubordinates(Boolean(assignment.canViewSubordinates));
    setEditingCanHandleSubordinates(Boolean(assignment.canHandleSubordinates));
  };

  const cancelEditingAssignment = () => {
    setEditingAssignmentId(null);
    setEditingPermissionCodes([]);
    setEditingCanManageRules(false);
    setEditingCanViewSubordinates(false);
    setEditingCanHandleSubordinates(false);
  };

  const saveAssignment = async (assignmentId: string) => {
    try {
      await updateMailboxAssignment(assignmentId, {
        canManageRules: editingCanManageRules,
        canViewSubordinates: editingCanViewSubordinates,
        canHandleSubordinates: editingCanHandleSubordinates,
        permissionCodes: editingPermissionCodes,
      });

      enqueueSuccessSnackBar({
        message: 'Mailbox assignment updated',
      });
      cancelEditingAssignment();
    } catch (error) {
      enqueueErrorSnackBar({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update mailbox assignment',
      });
    }
  };

  const toggleAssignmentStatus = async (
    mailboxAssignment: (typeof mailboxAssignments)[number],
  ) => {
    const nextAssignmentStatus =
      mailboxAssignment.assignmentStatus === 'active' ? 'suspended' : 'active';

    try {
      await updateMailboxAssignment(mailboxAssignment.id, {
        assignmentStatus: nextAssignmentStatus,
      });

      enqueueSuccessSnackBar({
        message:
          nextAssignmentStatus === 'suspended'
            ? 'Mailbox assignment suspended'
            : 'Mailbox assignment reactivated',
      });
    } catch (error) {
      enqueueErrorSnackBar({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update mailbox assignment status',
      });
    }
  };

  return (
    <EnterprisePermissionGuard requiredPermission={enterprisePermissionCodes.mailboxAssign}>
      <EnterpriseShell title="Mailbox Assignments" sidebar={sidebar}>
        <StyledGrid>
          <StyledHero>
            <StyledHeroTitle>Mailbox assignments</StyledHeroTitle>
            <StyledHeroText>
              Admin-managed mailbox assignment is the main operating path. Bind a
              mailbox to a workspace member and control baseline read/send
              permissions from one place.
            </StyledHeroText>
          </StyledHero>

          <StyledPanel>
            <div>
              <StyledSectionTitle>Assign mailbox to member</StyledSectionTitle>
              <StyledSectionText>
                Once assigned, the mailbox will appear inside the seller&apos;s Mail
                workspace and can be extended into subordinate handling later.
              </StyledSectionText>
            </div>

            <StyledFormGrid>
              <StyledField>
                <StyledLabel>Workspace member</StyledLabel>
                <StyledSelect
                  aria-label="Workspace member"
                  value={workspaceMemberId}
                  onChange={(event) => setWorkspaceMemberId(event.target.value)}
                >
                  <option value="">Select workspace member</option>
                  {workspaceMemberOptions.map((workspaceMemberOption) => (
                    <option
                      key={workspaceMemberOption.value}
                      value={workspaceMemberOption.value}
                    >
                      {workspaceMemberOption.label}
                    </option>
                  ))}
                </StyledSelect>
              </StyledField>

              <StyledField>
                <StyledLabel>Mailbox account</StyledLabel>
                <StyledSelect
                  aria-label="Mailbox account"
                  value={mailboxProfileId}
                  onChange={(event) => setMailboxProfileId(event.target.value)}
                >
                  <option value="">
                    {mailboxProfileOptions.length > 0
                      ? 'Select mailbox account'
                      : 'Create a mailbox account first'}
                  </option>
                  {mailboxProfileOptions.map((mailboxProfileOption) => (
                    <option
                      key={mailboxProfileOption.value}
                      value={mailboxProfileOption.value}
                    >
                      {mailboxProfileOption.label}
                    </option>
                  ))}
                </StyledSelect>
              </StyledField>
            </StyledFormGrid>

            <StyledCheckboxGrid>
              {assignmentPermissionCodes.map((permissionCode) => (
                <StyledCheckboxLabel key={permissionCode}>
                  <input
                    checked={selectedPermissionCodes.includes(permissionCode)}
                    type="checkbox"
                    onChange={() => togglePermission(permissionCode)}
                  />
                  {permissionCode}
                </StyledCheckboxLabel>
              ))}
            </StyledCheckboxGrid>

            <StyledCheckboxGrid>
              <StyledCheckboxLabel>
                <input
                  checked={isPrimaryMailbox}
                  type="checkbox"
                  onChange={() => setIsPrimaryMailbox((currentValue) => !currentValue)}
                />
                primary mailbox
              </StyledCheckboxLabel>
              <StyledCheckboxLabel>
                <input
                  checked={canManageRules}
                  type="checkbox"
                  onChange={() => setCanManageRules((currentValue) => !currentValue)}
                />
                canManageRules
              </StyledCheckboxLabel>
              <StyledCheckboxLabel>
                <input
                  checked={canViewSubordinates}
                  type="checkbox"
                  onChange={() =>
                    setCanViewSubordinates((currentValue) => !currentValue)
                  }
                />
                canViewSubordinates
              </StyledCheckboxLabel>
              <StyledCheckboxLabel>
                <input
                  checked={canHandleSubordinates}
                  type="checkbox"
                  onChange={() =>
                    setCanHandleSubordinates((currentValue) => !currentValue)
                  }
                />
                canHandleSubordinates
              </StyledCheckboxLabel>
            </StyledCheckboxGrid>

            <StyledMetaList>
              <StyledMetaItem>
                <StyledSectionTitle>Seller coverage</StyledSectionTitle>
                <StyledSectionText>
                  {selectedWorkspaceMember
                    ? `${formatWorkspaceMemberLabel(selectedWorkspaceMember)} currently has ${selectedWorkspaceMemberAssignmentCount} active mailbox assignment${selectedWorkspaceMemberAssignmentCount === 1 ? '' : 's'}.`
                    : 'Select a workspace member to review current mailbox coverage.'}
                </StyledSectionText>
                {activePrimaryMailboxAssignmentForSelectedMember ? (
                  <StyledStatus tone="neutral">
                    Primary sender: {activePrimaryMailboxAssignmentForSelectedMember.emailAddress ??
                      activePrimaryMailboxAssignmentForSelectedMember.mailboxProfileId}
                  </StyledStatus>
                ) : null}
              </StyledMetaItem>
              <StyledMetaItem>
                <StyledSectionTitle>Mailbox readiness</StyledSectionTitle>
                <StyledSectionText>
                  {selectedMailboxProfile
                    ? `${selectedMailboxProfile.emailAddress} is ${selectedMailboxProfile.validationStatus} / ${selectedMailboxProfile.status}.`
                    : 'Select a mailbox account to verify validation and runtime status.'}
                </StyledSectionText>
                {selectedMailboxProfile ? (
                  <StyledStatus
                    tone={selectedMailboxValidationReady ? 'success' : 'warning'}
                  >
                    {selectedMailboxValidationReady
                      ? 'Ready for assignment'
                      : 'Validate and activate this mailbox before assignment'}
                  </StyledStatus>
                ) : null}
              </StyledMetaItem>
              <StyledMetaItem>
                <StyledSectionTitle>Assignment check</StyledSectionTitle>
                <StyledSectionText>
                  {selectedMailboxProfile
                    ? selectedMailboxAssignments.length === 0
                      ? 'This mailbox is not assigned yet.'
                      : `This mailbox already has ${selectedMailboxAssignments.length} assignment${selectedMailboxAssignments.length === 1 ? '' : 's'}.`
                    : 'Mailbox occupancy and duplicate checks appear here.'}
                </StyledSectionText>
                {selectedMailboxActiveAssignments.length > 0 ? (
                  <StyledSectionText>
                    Active assignees:{' '}
                    {selectedMailboxActiveAssignments
                      .map(
                        (mailboxAssignment) =>
                          workspaceMemberLabelById[mailboxAssignment.workspaceMemberId] ??
                          mailboxAssignment.workspaceMemberId,
                      )
                      .join(', ')}
                  </StyledSectionText>
                ) : null}
                {selectedMailboxAssignments.some(
                  (mailboxAssignment) =>
                    mailboxAssignment.assignmentStatus === 'active' &&
                    mailboxAssignment.isPrimaryMailbox,
                ) ? (
                  <StyledStatus tone="neutral">
                    This mailbox is already a primary sender for at least one active assignment.
                  </StyledStatus>
                ) : null}
                {duplicateAssignment ? (
                  <StyledStatus tone="warning">
                    This mailbox is already assigned to the selected workspace member.
                  </StyledStatus>
                ) : null}
                {primaryMailboxConflict ? (
                  <StyledStatus tone="warning">
                    This workspace member already has an active primary mailbox. Remove the existing primary flag or suspend it before switching sender priority.
                  </StyledStatus>
                ) : null}
                {selectedMailboxActiveAssignments.length > 0 && !primaryMailboxConflict ? (
                  <StyledStatus tone="neutral">
                    {isPrimaryMailbox
                      ? 'This assignment will become the default sender for the selected workspace member. Reply ownership should still be routed through mailbox rules or queue ownership when multiple sellers share this mailbox.'
                      : activePrimaryAssignmentForSelectedMailbox
                        ? `Shared mailbox mode: ${workspaceMemberLabelById[activePrimaryAssignmentForSelectedMailbox.workspaceMemberId] ?? activePrimaryAssignmentForSelectedMailbox.workspaceMemberId} currently owns the primary sender route for this mailbox.`
                        : 'Shared mailbox mode: no primary sender is set on this mailbox yet. Set one primary assignment if this mailbox needs a default outbound owner.'}
                  </StyledStatus>
                ) : null}
              </StyledMetaItem>
            </StyledMetaList>

            <Button
              title="Assign mailbox"
              disabled={
                !workspaceMemberId.trim() ||
                !mailboxProfileId.trim() ||
                !selectedMailboxValidationReady ||
                primaryMailboxConflict ||
                duplicateAssignment ||
                isSaving
              }
              onClick={assignMailbox}
            />
          </StyledPanel>

          <StyledPanel>
            <div>
              <StyledSectionTitle>Current assignments</StyledSectionTitle>
              <StyledSectionText>
                Use this list to verify mailbox ownership, target member, and the
                permission bundle currently granted.
              </StyledSectionText>
            </div>

            {isLoading ? (
              <StyledEmpty>Loading assignments...</StyledEmpty>
            ) : mailboxAssignments.length === 0 ? (
              <StyledEmpty>No mailbox assignments yet.</StyledEmpty>
            ) : (
              <StyledTable>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Workspace member</th>
                    <th>Status</th>
                    <th>Permissions</th>
                    <th>Controls</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mailboxAssignments.map((mailboxAssignment) => (
                    <tr key={mailboxAssignment.id}>
                      <td>{mailboxAssignment.emailAddress ?? mailboxAssignment.mailboxProfileId}</td>
                      <td>
                        {workspaceMemberLabelById[mailboxAssignment.workspaceMemberId] ??
                          mailboxAssignment.workspaceMemberId}
                      </td>
                      <td>
                        <StyledStatus tone="neutral">
                          {mailboxAssignment.assignmentStatus}
                        </StyledStatus>
                      </td>
                      <td>
                        {editingAssignmentId === mailboxAssignment.id ? (
                          <StyledCheckboxGrid>
                            {assignmentPermissionCodes.map((permissionCode) => (
                              <StyledCheckboxLabel key={permissionCode}>
                                <input
                                  checked={editingPermissionCodes.includes(permissionCode)}
                                  type="checkbox"
                                  onChange={() => toggleEditingPermission(permissionCode)}
                                />
                                {permissionCode}
                              </StyledCheckboxLabel>
                            ))}
                          </StyledCheckboxGrid>
                        ) : (
                          mailboxAssignment.permissionCodes.join(', ') || '-'
                        )}
                      </td>
                      <td>
                        {editingAssignmentId === mailboxAssignment.id ? (
                          <StyledCheckboxGrid>
                            <StyledCheckboxLabel>
                              <input
                                checked={editingCanManageRules}
                                type="checkbox"
                                onChange={() =>
                                  setEditingCanManageRules((currentValue) => !currentValue)
                                }
                              />
                              canManageRules
                            </StyledCheckboxLabel>
                            <StyledCheckboxLabel>
                              <input
                                checked={editingCanViewSubordinates}
                                type="checkbox"
                                onChange={() =>
                                  setEditingCanViewSubordinates(
                                    (currentValue) => !currentValue,
                                  )
                                }
                              />
                              canViewSubordinates
                            </StyledCheckboxLabel>
                            <StyledCheckboxLabel>
                              <input
                                checked={editingCanHandleSubordinates}
                                type="checkbox"
                                onChange={() =>
                                  setEditingCanHandleSubordinates(
                                    (currentValue) => !currentValue,
                                  )
                                }
                              />
                              canHandleSubordinates
                            </StyledCheckboxLabel>
                          </StyledCheckboxGrid>
                        ) : (
                          [
                            mailboxAssignment.canManageRules ? 'manage rules' : null,
                            mailboxAssignment.canViewSubordinates
                              ? 'view subordinates'
                              : null,
                            mailboxAssignment.canHandleSubordinates
                              ? 'handle subordinates'
                              : null,
                          ]
                            .filter(Boolean)
                            .join(', ') || '-'
                        )}
                      </td>
                      <td>
                        {editingAssignmentId === mailboxAssignment.id ? (
                          <>
                            <Button
                              title="Save assignment"
                              onClick={() => void saveAssignment(mailboxAssignment.id)}
                            />
                            <Button
                              title="Cancel assignment edit"
                              onClick={cancelEditingAssignment}
                            />
                          </>
                        ) : (
                          <>
                            <Button
                              title="Edit assignment"
                              onClick={() => startEditingAssignment(mailboxAssignment)}
                            />
                            <Button
                              title={
                                mailboxAssignment.assignmentStatus === 'active'
                                  ? 'Suspend assignment'
                                  : 'Reactivate assignment'
                              }
                              onClick={() =>
                                void toggleAssignmentStatus(mailboxAssignment)
                              }
                            />
                          </>
                        )}
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
