import { Fragment, useMemo, useState } from 'react';

import { EnterprisePermissionGuard } from '@/enterprise/shared/components/EnterprisePermissionGuard';
import { EnterpriseShell } from '@/enterprise/shared/components/EnterpriseShell';
import { enterprisePermissionCodes } from '@/enterprise/shared/constants/enterprisePermissions';
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
  StyledInput,
  StyledPanel,
  StyledSectionText,
  StyledSectionTitle,
  StyledSelect,
  StyledStatus,
  StyledTable,
  StyledTextArea,
} from '~/pages/enterprise/mailbox-control/components/EnterpriseMailboxControlStyles';
import { useEnterpriseMailboxProfiles } from '~/pages/enterprise/mailbox-control/hooks/useEnterpriseMailboxProfiles';
import { useEnterpriseMailboxRules } from '~/pages/enterprise/mailbox-control/hooks/useEnterpriseMailboxRules';

const defaultPendingReplyRuleFormState = {
  applyPendingTag: true,
  createTask: true,
  escalateToManager: false,
  folder: 'INBOX',
  maxReplyDelayHours: '24',
  onlyUnread: true,
};

const normalizePendingReplyRuleFormState = (input?: {
  actionsJson?: Record<string, unknown> | null;
  conditionsJson?: Record<string, unknown> | null;
}) => ({
  applyPendingTag:
    input?.actionsJson?.applyPendingTag === undefined
      ? defaultPendingReplyRuleFormState.applyPendingTag
      : Boolean(input.actionsJson.applyPendingTag),
  createTask:
    input?.actionsJson?.createTask === undefined
      ? defaultPendingReplyRuleFormState.createTask
      : Boolean(input.actionsJson.createTask),
  escalateToManager:
    input?.actionsJson?.escalateToManager === undefined
      ? defaultPendingReplyRuleFormState.escalateToManager
      : Boolean(input.actionsJson.escalateToManager),
  folder:
    typeof input?.conditionsJson?.folder === 'string' &&
    input.conditionsJson.folder.length > 0
      ? input.conditionsJson.folder
      : defaultPendingReplyRuleFormState.folder,
  maxReplyDelayHours:
    typeof input?.conditionsJson?.maxReplyDelayHours === 'number'
      ? String(input.conditionsJson.maxReplyDelayHours)
      : defaultPendingReplyRuleFormState.maxReplyDelayHours,
  onlyUnread:
    input?.conditionsJson?.onlyUnread === undefined
      ? defaultPendingReplyRuleFormState.onlyUnread
      : Boolean(input.conditionsJson.onlyUnread),
});

const buildPendingReplyRuleJson = (input: {
  applyPendingTag: boolean;
  createTask: boolean;
  escalateToManager: boolean;
  folder: string;
  maxReplyDelayHours: string;
  onlyUnread: boolean;
}) => ({
  actionsJson: {
    applyPendingTag: input.applyPendingTag,
    createTask: input.createTask,
    escalateToManager: input.escalateToManager,
  },
  conditionsJson: {
    folder: input.folder.trim() || defaultPendingReplyRuleFormState.folder,
    maxReplyDelayHours:
      Number(input.maxReplyDelayHours) > 0
        ? Number(input.maxReplyDelayHours)
        : Number(defaultPendingReplyRuleFormState.maxReplyDelayHours),
    onlyUnread: input.onlyUnread,
  },
});

const defaultFolderRoutingRuleFormState = {
  markAsRead: false,
  senderDomain: '',
  sourceFolder: 'INBOX',
  stopFurtherRules: true,
  subjectKeyword: '',
  targetFolder: 'VIP',
};

const normalizeFolderRoutingRuleFormState = (input?: {
  actionsJson?: Record<string, unknown> | null;
  conditionsJson?: Record<string, unknown> | null;
}) => ({
  markAsRead:
    input?.actionsJson?.markAsRead === undefined
      ? defaultFolderRoutingRuleFormState.markAsRead
      : Boolean(input.actionsJson.markAsRead),
  senderDomain:
    typeof input?.conditionsJson?.senderDomain === 'string'
      ? input.conditionsJson.senderDomain
      : defaultFolderRoutingRuleFormState.senderDomain,
  sourceFolder:
    typeof input?.conditionsJson?.sourceFolder === 'string' &&
    input.conditionsJson.sourceFolder.length > 0
      ? input.conditionsJson.sourceFolder
      : defaultFolderRoutingRuleFormState.sourceFolder,
  stopFurtherRules:
    input?.actionsJson?.stopFurtherRules === undefined
      ? defaultFolderRoutingRuleFormState.stopFurtherRules
      : Boolean(input.actionsJson.stopFurtherRules),
  subjectKeyword:
    typeof input?.conditionsJson?.subjectKeyword === 'string'
      ? input.conditionsJson.subjectKeyword
      : defaultFolderRoutingRuleFormState.subjectKeyword,
  targetFolder:
    typeof input?.actionsJson?.targetFolder === 'string' &&
    input.actionsJson.targetFolder.length > 0
      ? input.actionsJson.targetFolder
      : defaultFolderRoutingRuleFormState.targetFolder,
});

const buildFolderRoutingRuleJson = (input: {
  markAsRead: boolean;
  senderDomain: string;
  sourceFolder: string;
  stopFurtherRules: boolean;
  subjectKeyword: string;
  targetFolder: string;
}) => ({
  actionsJson: {
    markAsRead: input.markAsRead,
    stopFurtherRules: input.stopFurtherRules,
    targetFolder:
      input.targetFolder.trim() || defaultFolderRoutingRuleFormState.targetFolder,
  },
  conditionsJson: {
    senderDomain: input.senderDomain.trim(),
    sourceFolder:
      input.sourceFolder.trim() || defaultFolderRoutingRuleFormState.sourceFolder,
    subjectKeyword: input.subjectKeyword.trim(),
  },
});

const defaultCustomerAutoLinkRuleFormState = {
  attachToLatestOpportunity: false,
  createLeadWhenUnmatched: false,
  linkToCompany: true,
  linkToPerson: true,
  onlyUnlinkedThreads: true,
  requireKnownContact: false,
  senderDomain: '',
};

const normalizeCustomerAutoLinkRuleFormState = (input?: {
  actionsJson?: Record<string, unknown> | null;
  conditionsJson?: Record<string, unknown> | null;
}) => ({
  attachToLatestOpportunity:
    input?.actionsJson?.attachToLatestOpportunity === undefined
      ? defaultCustomerAutoLinkRuleFormState.attachToLatestOpportunity
      : Boolean(input.actionsJson.attachToLatestOpportunity),
  createLeadWhenUnmatched:
    input?.actionsJson?.createLeadWhenUnmatched === undefined
      ? defaultCustomerAutoLinkRuleFormState.createLeadWhenUnmatched
      : Boolean(input.actionsJson.createLeadWhenUnmatched),
  linkToCompany:
    input?.actionsJson?.linkToCompany === undefined
      ? defaultCustomerAutoLinkRuleFormState.linkToCompany
      : Boolean(input.actionsJson.linkToCompany),
  linkToPerson:
    input?.actionsJson?.linkToPerson === undefined
      ? defaultCustomerAutoLinkRuleFormState.linkToPerson
      : Boolean(input.actionsJson.linkToPerson),
  onlyUnlinkedThreads:
    input?.conditionsJson?.onlyUnlinkedThreads === undefined
      ? defaultCustomerAutoLinkRuleFormState.onlyUnlinkedThreads
      : Boolean(input.conditionsJson.onlyUnlinkedThreads),
  requireKnownContact:
    input?.conditionsJson?.requireKnownContact === undefined
      ? defaultCustomerAutoLinkRuleFormState.requireKnownContact
      : Boolean(input.conditionsJson.requireKnownContact),
  senderDomain:
    typeof input?.conditionsJson?.senderDomain === 'string'
      ? input.conditionsJson.senderDomain
      : defaultCustomerAutoLinkRuleFormState.senderDomain,
});

const buildCustomerAutoLinkRuleJson = (input: {
  attachToLatestOpportunity: boolean;
  createLeadWhenUnmatched: boolean;
  linkToCompany: boolean;
  linkToPerson: boolean;
  onlyUnlinkedThreads: boolean;
  requireKnownContact: boolean;
  senderDomain: string;
}) => ({
  actionsJson: {
    attachToLatestOpportunity: input.attachToLatestOpportunity,
    createLeadWhenUnmatched: input.createLeadWhenUnmatched,
    linkToCompany: input.linkToCompany,
    linkToPerson: input.linkToPerson,
  },
  conditionsJson: {
    onlyUnlinkedThreads: input.onlyUnlinkedThreads,
    requireKnownContact: input.requireKnownContact,
    senderDomain: input.senderDomain.trim(),
  },
});

const defaultSubordinateEscalationRuleFormState = {
  createTask: true,
  escalateToManager: true,
  maxReplyDelayHours: '12',
  notifyOwner: true,
  onlyAssignedThreads: true,
  reassignToPrimarySender: false,
  sourceFolder: 'INBOX',
};

const normalizeSubordinateEscalationRuleFormState = (input?: {
  actionsJson?: Record<string, unknown> | null;
  conditionsJson?: Record<string, unknown> | null;
}) => ({
  createTask:
    input?.actionsJson?.createTask === undefined
      ? defaultSubordinateEscalationRuleFormState.createTask
      : Boolean(input.actionsJson.createTask),
  escalateToManager:
    input?.actionsJson?.escalateToManager === undefined
      ? defaultSubordinateEscalationRuleFormState.escalateToManager
      : Boolean(input.actionsJson.escalateToManager),
  maxReplyDelayHours:
    typeof input?.conditionsJson?.maxReplyDelayHours === 'number'
      ? String(input.conditionsJson.maxReplyDelayHours)
      : defaultSubordinateEscalationRuleFormState.maxReplyDelayHours,
  notifyOwner:
    input?.actionsJson?.notifyOwner === undefined
      ? defaultSubordinateEscalationRuleFormState.notifyOwner
      : Boolean(input.actionsJson.notifyOwner),
  onlyAssignedThreads:
    input?.conditionsJson?.onlyAssignedThreads === undefined
      ? defaultSubordinateEscalationRuleFormState.onlyAssignedThreads
      : Boolean(input.conditionsJson.onlyAssignedThreads),
  reassignToPrimarySender:
    input?.actionsJson?.reassignToPrimarySender === undefined
      ? defaultSubordinateEscalationRuleFormState.reassignToPrimarySender
      : Boolean(input.actionsJson.reassignToPrimarySender),
  sourceFolder:
    typeof input?.conditionsJson?.sourceFolder === 'string' &&
    input.conditionsJson.sourceFolder.length > 0
      ? input.conditionsJson.sourceFolder
      : defaultSubordinateEscalationRuleFormState.sourceFolder,
});

const buildSubordinateEscalationRuleJson = (input: {
  createTask: boolean;
  escalateToManager: boolean;
  maxReplyDelayHours: string;
  notifyOwner: boolean;
  onlyAssignedThreads: boolean;
  reassignToPrimarySender: boolean;
  sourceFolder: string;
}) => ({
  actionsJson: {
    createTask: input.createTask,
    escalateToManager: input.escalateToManager,
    notifyOwner: input.notifyOwner,
    reassignToPrimarySender: input.reassignToPrimarySender,
  },
  conditionsJson: {
    maxReplyDelayHours:
      Number(input.maxReplyDelayHours) > 0
        ? Number(input.maxReplyDelayHours)
        : Number(defaultSubordinateEscalationRuleFormState.maxReplyDelayHours),
    onlyAssignedThreads: input.onlyAssignedThreads,
    sourceFolder:
      input.sourceFolder.trim() ||
      defaultSubordinateEscalationRuleFormState.sourceFolder,
  },
});

export const EnterpriseMailboxRulesPage = () => {
  const sidebar = useMemo(buildEnterpriseSidebar, []);
  const { enqueueErrorSnackBar } = useSnackBar();
  const { mailboxProfiles } = useEnterpriseMailboxProfiles();
  const {
    createMailboxRule,
    isLoading,
    loadMailboxRulePreview,
    mailboxRuleActivity,
    mailboxRulePreviewsById,
    mailboxRuleReadiness,
    mailboxRules,
    previewLoadingRuleId,
    updateMailboxRule,
  } = useEnterpriseMailboxRules();
  const [mailboxProfileId, setMailboxProfileId] = useState('');
  const [name, setName] = useState('');
  const [ruleType, setRuleType] = useState('pending-reply');
  const [priority, setPriority] = useState('100');
  const [pendingReplyRuleFormState, setPendingReplyRuleFormState] = useState(
    defaultPendingReplyRuleFormState,
  );
  const [folderRoutingRuleFormState, setFolderRoutingRuleFormState] = useState(
    defaultFolderRoutingRuleFormState,
  );
  const [customerAutoLinkRuleFormState, setCustomerAutoLinkRuleFormState] =
    useState(defaultCustomerAutoLinkRuleFormState);
  const [
    subordinateEscalationRuleFormState,
    setSubordinateEscalationRuleFormState,
  ] = useState(defaultSubordinateEscalationRuleFormState);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingPriority, setEditingPriority] = useState('');
  const [editingConditionsJson, setEditingConditionsJson] = useState('');
  const [editingActionsJson, setEditingActionsJson] = useState('');
  const [editingPendingReplyRuleFormState, setEditingPendingReplyRuleFormState] =
    useState(defaultPendingReplyRuleFormState);
  const [editingFolderRoutingRuleFormState, setEditingFolderRoutingRuleFormState] =
    useState(defaultFolderRoutingRuleFormState);
  const [
    editingCustomerAutoLinkRuleFormState,
    setEditingCustomerAutoLinkRuleFormState,
  ] = useState(defaultCustomerAutoLinkRuleFormState);
  const [
    editingSubordinateEscalationRuleFormState,
    setEditingSubordinateEscalationRuleFormState,
  ] = useState(defaultSubordinateEscalationRuleFormState);
  const [expandedPreviewRuleId, setExpandedPreviewRuleId] = useState<string | null>(
    null,
  );

  const formatJson = (value: Record<string, unknown> | null | undefined) =>
    JSON.stringify(value ?? {}, null, 2);

  const formatRuleActivityAction = (value: string) =>
    value
      .replace('enterprise_mailbox_rule.', '')
      .replaceAll('_', ' ')
      .trim();

  const formatRuleReadinessStatus = (value: 'ready' | 'warning' | 'blocked') =>
    value;

  const getStatusTone = (value: 'ready' | 'warning' | 'blocked') =>
    value === 'ready' ? 'success' : value === 'warning' ? 'warning' : 'neutral';

  const ruleSummary = useMemo(
    () => ({
      activeRules: mailboxRules.filter((rule) => rule.enabled).length,
      managedMailboxes: new Set(
        mailboxRules.map((rule) => rule.mailboxProfileId),
      ).size,
      pendingReplyRules: mailboxRules.filter(
        (rule) => rule.ruleType === 'pending-reply',
      ).length,
      routingRules: mailboxRules.filter(
        (rule) =>
          rule.ruleType === 'folder-routing' ||
          rule.ruleType === 'customer-auto-link' ||
          rule.ruleType === 'subordinate-escalation',
      ).length,
    }),
    [mailboxRules],
  );

  const createRule = async () => {
    try {
      const structuredRuleJson =
        ruleType === 'pending-reply'
          ? buildPendingReplyRuleJson(pendingReplyRuleFormState)
          : ruleType === 'folder-routing'
            ? buildFolderRoutingRuleJson(folderRoutingRuleFormState)
            : ruleType === 'customer-auto-link'
              ? buildCustomerAutoLinkRuleJson(customerAutoLinkRuleFormState)
              : ruleType === 'subordinate-escalation'
                ? buildSubordinateEscalationRuleJson(
                    subordinateEscalationRuleFormState,
                  )
            : {};

      await createMailboxRule({
        mailboxProfileId,
        name,
        ruleType,
        enabled: true,
        priority: Number(priority),
        ...structuredRuleJson,
      });

      setMailboxProfileId('');
      setName('');
      setRuleType('pending-reply');
      setPriority('100');
      setPendingReplyRuleFormState(defaultPendingReplyRuleFormState);
      setFolderRoutingRuleFormState(defaultFolderRoutingRuleFormState);
      setCustomerAutoLinkRuleFormState(defaultCustomerAutoLinkRuleFormState);
      setSubordinateEscalationRuleFormState(
        defaultSubordinateEscalationRuleFormState,
      );
    } catch {
      enqueueErrorSnackBar({ message: 'Failed to create mailbox rule' });
    }
  };

  const toggleMailboxRule = async (
    mailboxRuleId: string,
    enabled: boolean,
  ) => {
    try {
      await updateMailboxRule(mailboxRuleId, {
        enabled: !enabled,
      });
    } catch {
      enqueueErrorSnackBar({ message: 'Failed to update mailbox rule' });
    }
  };

  const startEditingMailboxRule = (input: {
    id: string;
    name: string;
    priority: number;
    ruleType: string;
    conditionsJson?: Record<string, unknown> | null;
    actionsJson?: Record<string, unknown> | null;
  }) => {
    setEditingRuleId(input.id);
    setEditingName(input.name);
    setEditingPriority(String(input.priority));
    setEditingConditionsJson(formatJson(input.conditionsJson));
    setEditingActionsJson(formatJson(input.actionsJson));
    setEditingPendingReplyRuleFormState(
      normalizePendingReplyRuleFormState({
        actionsJson: input.actionsJson,
        conditionsJson: input.conditionsJson,
      }),
    );
    setEditingFolderRoutingRuleFormState(
      normalizeFolderRoutingRuleFormState({
        actionsJson: input.actionsJson,
        conditionsJson: input.conditionsJson,
      }),
    );
    setEditingCustomerAutoLinkRuleFormState(
      normalizeCustomerAutoLinkRuleFormState({
        actionsJson: input.actionsJson,
        conditionsJson: input.conditionsJson,
      }),
    );
    setEditingSubordinateEscalationRuleFormState(
      normalizeSubordinateEscalationRuleFormState({
        actionsJson: input.actionsJson,
        conditionsJson: input.conditionsJson,
      }),
    );
  };

  const cancelEditingMailboxRule = () => {
    setEditingRuleId(null);
    setEditingName('');
    setEditingPriority('');
    setEditingConditionsJson('');
    setEditingActionsJson('');
    setEditingPendingReplyRuleFormState(defaultPendingReplyRuleFormState);
    setEditingFolderRoutingRuleFormState(defaultFolderRoutingRuleFormState);
    setEditingCustomerAutoLinkRuleFormState(
      defaultCustomerAutoLinkRuleFormState,
    );
    setEditingSubordinateEscalationRuleFormState(
      defaultSubordinateEscalationRuleFormState,
    );
  };

  const saveMailboxRule = async (mailboxRuleId: string) => {
    try {
      const mailboxRule = mailboxRules.find((rule) => rule.id === mailboxRuleId);
      const structuredPendingReplyRuleJson = buildPendingReplyRuleJson(
        editingPendingReplyRuleFormState,
      );
      const structuredFolderRoutingRuleJson = buildFolderRoutingRuleJson(
        editingFolderRoutingRuleFormState,
      );
      const structuredCustomerAutoLinkRuleJson =
        buildCustomerAutoLinkRuleJson(editingCustomerAutoLinkRuleFormState);
      const structuredSubordinateEscalationRuleJson =
        buildSubordinateEscalationRuleJson(
          editingSubordinateEscalationRuleFormState,
        );
      const parsedConditionsJson =
        mailboxRule?.ruleType === 'pending-reply'
          ? structuredPendingReplyRuleJson.conditionsJson
          : mailboxRule?.ruleType === 'folder-routing'
            ? structuredFolderRoutingRuleJson.conditionsJson
            : mailboxRule?.ruleType === 'customer-auto-link'
              ? structuredCustomerAutoLinkRuleJson.conditionsJson
              : mailboxRule?.ruleType === 'subordinate-escalation'
                ? structuredSubordinateEscalationRuleJson.conditionsJson
          : JSON.parse(editingConditionsJson);
      const parsedActionsJson =
        mailboxRule?.ruleType === 'pending-reply'
          ? structuredPendingReplyRuleJson.actionsJson
          : mailboxRule?.ruleType === 'folder-routing'
            ? structuredFolderRoutingRuleJson.actionsJson
            : mailboxRule?.ruleType === 'customer-auto-link'
              ? structuredCustomerAutoLinkRuleJson.actionsJson
              : mailboxRule?.ruleType === 'subordinate-escalation'
                ? structuredSubordinateEscalationRuleJson.actionsJson
          : JSON.parse(editingActionsJson);

      await updateMailboxRule(mailboxRuleId, {
        name: editingName.trim(),
        priority: Number(editingPriority),
        conditionsJson: parsedConditionsJson,
        actionsJson: parsedActionsJson,
      });
      cancelEditingMailboxRule();
    } catch {
      enqueueErrorSnackBar({
        message: 'Failed to save mailbox rule JSON configuration',
      });
    }
  };

  return (
    <EnterprisePermissionGuard
      requiredPermission={enterprisePermissionCodes.mailboxUpdate}
    >
      <EnterpriseShell title="Mailbox Rules" sidebar={sidebar}>
        <StyledGrid>
          <StyledHero>
            <StyledHeroTitle>Mailbox rules</StyledHeroTitle>
            <StyledHeroText>
              Build the first operating rules for pending reply detection,
              customer auto-link, folder routing, and subordinate escalation.
              This page now uses live enterprise rule APIs instead of a static
              placeholder.
            </StyledHeroText>
          </StyledHero>

          <StyledPanel>
            <StyledSectionTitle>Create mailbox rule</StyledSectionTitle>
            <StyledSectionText>
              Start with one mailbox, one rule type, and one clear action path.
              This keeps Phase 1 rules auditable before we add a visual rule
              builder.
            </StyledSectionText>

            <StyledFormGrid>
              <StyledField>
                <StyledLabel>Mailbox account</StyledLabel>
                <StyledSelect
                  aria-label="Rule mailbox account"
                  value={mailboxProfileId}
                  onChange={(event) => setMailboxProfileId(event.target.value)}
                >
                  <option value="">
                    {mailboxProfiles.length > 0
                      ? 'Select mailbox account'
                      : 'Create a mailbox account first'}
                  </option>
                  {mailboxProfiles.map((mailboxProfile) => (
                    <option key={mailboxProfile.id} value={mailboxProfile.id}>
                      {mailboxProfile.emailAddress}
                    </option>
                  ))}
                </StyledSelect>
              </StyledField>

              <StyledField>
                <StyledLabel>Rule type</StyledLabel>
                <StyledSelect
                  aria-label="Rule type"
                  value={ruleType}
                  onChange={(event) => setRuleType(event.target.value)}
                >
                  <option value="pending-reply">Pending reply detection</option>
                  <option value="customer-auto-link">Customer auto-link</option>
                  <option value="folder-routing">Folder routing</option>
                  <option value="subordinate-escalation">
                    Subordinate escalation
                  </option>
                </StyledSelect>
              </StyledField>

              <StyledField>
                <StyledLabel>Rule name</StyledLabel>
                <StyledInput
                  aria-label="Rule name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </StyledField>

              <StyledField>
                <StyledLabel>Priority</StyledLabel>
                <StyledInput
                  aria-label="Rule priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                />
              </StyledField>
            </StyledFormGrid>

            {ruleType === 'pending-reply' ? (
              <>
                <StyledFormGrid>
                  <StyledField>
                    <StyledLabel>Reply queue folder</StyledLabel>
                    <StyledSelect
                      aria-label="Pending reply folder"
                      value={pendingReplyRuleFormState.folder}
                      onChange={(event) =>
                        setPendingReplyRuleFormState((currentValue) => ({
                          ...currentValue,
                          folder: event.target.value,
                        }))
                      }
                    >
                      <option value="INBOX">Inbox</option>
                      <option value="VIP">VIP</option>
                      <option value="Pending">Pending</option>
                    </StyledSelect>
                  </StyledField>

                  <StyledField>
                    <StyledLabel>Reply delay threshold (hours)</StyledLabel>
                    <StyledInput
                      aria-label="Pending reply delay hours"
                      value={pendingReplyRuleFormState.maxReplyDelayHours}
                      onChange={(event) =>
                        setPendingReplyRuleFormState((currentValue) => ({
                          ...currentValue,
                          maxReplyDelayHours: event.target.value,
                        }))
                      }
                    />
                  </StyledField>
                </StyledFormGrid>

                <StyledCheckboxGrid>
                  <StyledCheckboxLabel>
                    <input
                      checked={pendingReplyRuleFormState.onlyUnread}
                      type="checkbox"
                      onChange={() =>
                        setPendingReplyRuleFormState((currentValue) => ({
                          ...currentValue,
                          onlyUnread: !currentValue.onlyUnread,
                        }))
                      }
                    />
                    only unread threads
                  </StyledCheckboxLabel>
                  <StyledCheckboxLabel>
                    <input
                      checked={pendingReplyRuleFormState.createTask}
                      type="checkbox"
                      onChange={() =>
                        setPendingReplyRuleFormState((currentValue) => ({
                          ...currentValue,
                          createTask: !currentValue.createTask,
                        }))
                      }
                    />
                    create follow-up task
                  </StyledCheckboxLabel>
                  <StyledCheckboxLabel>
                    <input
                      checked={pendingReplyRuleFormState.escalateToManager}
                      type="checkbox"
                      onChange={() =>
                        setPendingReplyRuleFormState((currentValue) => ({
                          ...currentValue,
                          escalateToManager: !currentValue.escalateToManager,
                        }))
                      }
                    />
                    escalate to manager
                  </StyledCheckboxLabel>
                  <StyledCheckboxLabel>
                    <input
                      checked={pendingReplyRuleFormState.applyPendingTag}
                      type="checkbox"
                      onChange={() =>
                        setPendingReplyRuleFormState((currentValue) => ({
                          ...currentValue,
                          applyPendingTag: !currentValue.applyPendingTag,
                        }))
                      }
                    />
                    apply pending tag
                  </StyledCheckboxLabel>
                </StyledCheckboxGrid>
              </>
            ) : null}

            {ruleType === 'folder-routing' ? (
              <>
                <StyledFormGrid>
                  <StyledField>
                    <StyledLabel>Source folder</StyledLabel>
                    <StyledSelect
                      aria-label="Folder routing source folder"
                      value={folderRoutingRuleFormState.sourceFolder}
                      onChange={(event) =>
                        setFolderRoutingRuleFormState((currentValue) => ({
                          ...currentValue,
                          sourceFolder: event.target.value,
                        }))
                      }
                    >
                      <option value="INBOX">Inbox</option>
                      <option value="VIP">VIP</option>
                      <option value="Pending">Pending</option>
                    </StyledSelect>
                  </StyledField>

                  <StyledField>
                    <StyledLabel>Target folder</StyledLabel>
                    <StyledSelect
                      aria-label="Folder routing target folder"
                      value={folderRoutingRuleFormState.targetFolder}
                      onChange={(event) =>
                        setFolderRoutingRuleFormState((currentValue) => ({
                          ...currentValue,
                          targetFolder: event.target.value,
                        }))
                      }
                    >
                      <option value="VIP">VIP</option>
                      <option value="Pending">Pending</option>
                      <option value="Archive">Archive</option>
                    </StyledSelect>
                  </StyledField>

                  <StyledField>
                    <StyledLabel>Sender domain match</StyledLabel>
                    <StyledInput
                      aria-label="Folder routing sender domain"
                      value={folderRoutingRuleFormState.senderDomain}
                      onChange={(event) =>
                        setFolderRoutingRuleFormState((currentValue) => ({
                          ...currentValue,
                          senderDomain: event.target.value,
                        }))
                      }
                    />
                  </StyledField>

                  <StyledField>
                    <StyledLabel>Subject keyword match</StyledLabel>
                    <StyledInput
                      aria-label="Folder routing subject keyword"
                      value={folderRoutingRuleFormState.subjectKeyword}
                      onChange={(event) =>
                        setFolderRoutingRuleFormState((currentValue) => ({
                          ...currentValue,
                          subjectKeyword: event.target.value,
                        }))
                      }
                    />
                  </StyledField>
                </StyledFormGrid>

                <StyledCheckboxGrid>
                  <StyledCheckboxLabel>
                    <input
                      checked={folderRoutingRuleFormState.markAsRead}
                      type="checkbox"
                      onChange={() =>
                        setFolderRoutingRuleFormState((currentValue) => ({
                          ...currentValue,
                          markAsRead: !currentValue.markAsRead,
                        }))
                      }
                    />
                    mark as read after routing
                  </StyledCheckboxLabel>
                  <StyledCheckboxLabel>
                    <input
                      checked={folderRoutingRuleFormState.stopFurtherRules}
                      type="checkbox"
                      onChange={() =>
                        setFolderRoutingRuleFormState((currentValue) => ({
                          ...currentValue,
                          stopFurtherRules: !currentValue.stopFurtherRules,
                        }))
                      }
                    />
                    stop further rule evaluation
                  </StyledCheckboxLabel>
                </StyledCheckboxGrid>
              </>
            ) : null}

            {ruleType === 'customer-auto-link' ? (
              <>
                <StyledFormGrid>
                  <StyledField>
                    <StyledLabel>Sender domain match</StyledLabel>
                    <StyledInput
                      aria-label="Customer auto-link sender domain"
                      value={customerAutoLinkRuleFormState.senderDomain}
                      onChange={(event) =>
                        setCustomerAutoLinkRuleFormState((currentValue) => ({
                          ...currentValue,
                          senderDomain: event.target.value,
                        }))
                      }
                    />
                  </StyledField>
                </StyledFormGrid>

                <StyledCheckboxGrid>
                  <StyledCheckboxLabel>
                    <input
                      checked={customerAutoLinkRuleFormState.onlyUnlinkedThreads}
                      type="checkbox"
                      onChange={() =>
                        setCustomerAutoLinkRuleFormState((currentValue) => ({
                          ...currentValue,
                          onlyUnlinkedThreads: !currentValue.onlyUnlinkedThreads,
                        }))
                      }
                    />
                    only unlinked threads
                  </StyledCheckboxLabel>
                  <StyledCheckboxLabel>
                    <input
                      checked={customerAutoLinkRuleFormState.requireKnownContact}
                      type="checkbox"
                      onChange={() =>
                        setCustomerAutoLinkRuleFormState((currentValue) => ({
                          ...currentValue,
                          requireKnownContact: !currentValue.requireKnownContact,
                        }))
                      }
                    />
                    require known contact
                  </StyledCheckboxLabel>
                  <StyledCheckboxLabel>
                    <input
                      checked={customerAutoLinkRuleFormState.linkToPerson}
                      type="checkbox"
                      onChange={() =>
                        setCustomerAutoLinkRuleFormState((currentValue) => ({
                          ...currentValue,
                          linkToPerson: !currentValue.linkToPerson,
                        }))
                      }
                    />
                    link to person
                  </StyledCheckboxLabel>
                  <StyledCheckboxLabel>
                    <input
                      checked={customerAutoLinkRuleFormState.linkToCompany}
                      type="checkbox"
                      onChange={() =>
                        setCustomerAutoLinkRuleFormState((currentValue) => ({
                          ...currentValue,
                          linkToCompany: !currentValue.linkToCompany,
                        }))
                      }
                    />
                    link to company
                  </StyledCheckboxLabel>
                  <StyledCheckboxLabel>
                    <input
                      checked={
                        customerAutoLinkRuleFormState.attachToLatestOpportunity
                      }
                      type="checkbox"
                      onChange={() =>
                        setCustomerAutoLinkRuleFormState((currentValue) => ({
                          ...currentValue,
                          attachToLatestOpportunity:
                            !currentValue.attachToLatestOpportunity,
                        }))
                      }
                    />
                    attach to latest open opportunity
                  </StyledCheckboxLabel>
                  <StyledCheckboxLabel>
                    <input
                      checked={
                        customerAutoLinkRuleFormState.createLeadWhenUnmatched
                      }
                      type="checkbox"
                      onChange={() =>
                        setCustomerAutoLinkRuleFormState((currentValue) => ({
                          ...currentValue,
                          createLeadWhenUnmatched:
                            !currentValue.createLeadWhenUnmatched,
                        }))
                      }
                    />
                    create lead when unmatched
                  </StyledCheckboxLabel>
                </StyledCheckboxGrid>
              </>
            ) : null}

            {ruleType === 'subordinate-escalation' ? (
              <>
                <StyledFormGrid>
                  <StyledField>
                    <StyledLabel>Subordinate queue folder</StyledLabel>
                    <StyledSelect
                      aria-label="Subordinate escalation source folder"
                      value={subordinateEscalationRuleFormState.sourceFolder}
                      onChange={(event) =>
                        setSubordinateEscalationRuleFormState(
                          (currentValue) => ({
                            ...currentValue,
                            sourceFolder: event.target.value,
                          }),
                        )
                      }
                    >
                      <option value="INBOX">Inbox</option>
                      <option value="Pending">Pending</option>
                      <option value="VIP">VIP</option>
                    </StyledSelect>
                  </StyledField>

                  <StyledField>
                    <StyledLabel>Escalation threshold (hours)</StyledLabel>
                    <StyledInput
                      aria-label="Subordinate escalation delay hours"
                      value={
                        subordinateEscalationRuleFormState.maxReplyDelayHours
                      }
                      onChange={(event) =>
                        setSubordinateEscalationRuleFormState(
                          (currentValue) => ({
                            ...currentValue,
                            maxReplyDelayHours: event.target.value,
                          }),
                        )
                      }
                    />
                  </StyledField>
                </StyledFormGrid>

                <StyledCheckboxGrid>
                  <StyledCheckboxLabel>
                    <input
                      checked={
                        subordinateEscalationRuleFormState.onlyAssignedThreads
                      }
                      type="checkbox"
                      onChange={() =>
                        setSubordinateEscalationRuleFormState(
                          (currentValue) => ({
                            ...currentValue,
                            onlyAssignedThreads:
                              !currentValue.onlyAssignedThreads,
                          }),
                        )
                      }
                    />
                    only assigned subordinate threads
                  </StyledCheckboxLabel>
                  <StyledCheckboxLabel>
                    <input
                      checked={subordinateEscalationRuleFormState.createTask}
                      type="checkbox"
                      onChange={() =>
                        setSubordinateEscalationRuleFormState(
                          (currentValue) => ({
                            ...currentValue,
                            createTask: !currentValue.createTask,
                          }),
                        )
                      }
                    />
                    create escalation task
                  </StyledCheckboxLabel>
                  <StyledCheckboxLabel>
                    <input
                      checked={subordinateEscalationRuleFormState.notifyOwner}
                      type="checkbox"
                      onChange={() =>
                        setSubordinateEscalationRuleFormState(
                          (currentValue) => ({
                            ...currentValue,
                            notifyOwner: !currentValue.notifyOwner,
                          }),
                        )
                      }
                    />
                    notify current owner
                  </StyledCheckboxLabel>
                  <StyledCheckboxLabel>
                    <input
                      checked={
                        subordinateEscalationRuleFormState.escalateToManager
                      }
                      type="checkbox"
                      onChange={() =>
                        setSubordinateEscalationRuleFormState(
                          (currentValue) => ({
                            ...currentValue,
                            escalateToManager:
                              !currentValue.escalateToManager,
                          }),
                        )
                      }
                    />
                    escalate to manager
                  </StyledCheckboxLabel>
                  <StyledCheckboxLabel>
                    <input
                      checked={
                        subordinateEscalationRuleFormState.reassignToPrimarySender
                      }
                      type="checkbox"
                      onChange={() =>
                        setSubordinateEscalationRuleFormState(
                          (currentValue) => ({
                            ...currentValue,
                            reassignToPrimarySender:
                              !currentValue.reassignToPrimarySender,
                          }),
                        )
                      }
                    />
                    reassign to primary sender route
                  </StyledCheckboxLabel>
                </StyledCheckboxGrid>
              </>
            ) : null}

            <Button
              title="Create rule"
              disabled={
                !mailboxProfileId.trim() || !name.trim() || !priority.trim()
              }
              onClick={createRule}
            />
          </StyledPanel>

          <StyledPanel>
            <StyledSectionTitle>Rule coverage and recent activity</StyledSectionTitle>
            <StyledSectionText>
              This is the current operator surface for mailbox rules. It shows
              current coverage and the latest rule changes. Runtime hit results
              will attach here once the execution engine starts writing them.
            </StyledSectionText>

            <StyledFormGrid>
              <StyledField>
                <StyledLabel>Active rules</StyledLabel>
                <StyledSectionText>{ruleSummary.activeRules}</StyledSectionText>
              </StyledField>
              <StyledField>
                <StyledLabel>Managed mailboxes</StyledLabel>
                <StyledSectionText>
                  {ruleSummary.managedMailboxes}
                </StyledSectionText>
              </StyledField>
              <StyledField>
                <StyledLabel>Pending reply rules</StyledLabel>
                <StyledSectionText>
                  {ruleSummary.pendingReplyRules}
                </StyledSectionText>
              </StyledField>
              <StyledField>
                <StyledLabel>Routing and linking rules</StyledLabel>
                <StyledSectionText>{ruleSummary.routingRules}</StyledSectionText>
              </StyledField>
            </StyledFormGrid>

            {mailboxRuleActivity.length === 0 ? (
              <StyledEmpty>No mailbox rule activity yet.</StyledEmpty>
            ) : (
              <StyledTable>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Action</th>
                    <th>Rule</th>
                    <th>Mailbox</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {mailboxRuleActivity.map((activityItem) => (
                    <tr key={activityItem.id}>
                      <td>{new Date(activityItem.createdAt).toLocaleString()}</td>
                      <td>{formatRuleActivityAction(activityItem.action)}</td>
                      <td>{activityItem.ruleName ?? activityItem.resourceId ?? 'Unknown rule'}</td>
                      <td>{activityItem.emailAddress ?? 'Unknown mailbox'}</td>
                      <td>{activityItem.ruleType ?? 'Unknown type'}</td>
                    </tr>
                  ))}
                </tbody>
              </StyledTable>
            )}
          </StyledPanel>

          <StyledPanel>
            <StyledSectionTitle>Current rules</StyledSectionTitle>
            <StyledSectionText>
              Review the active rule queue for each mailbox before we add richer
              conditions and actions.
            </StyledSectionText>

            {isLoading ? (
              <StyledEmpty>Loading mailbox rules...</StyledEmpty>
            ) : mailboxRules.length === 0 ? (
              <StyledEmpty>No mailbox rules yet.</StyledEmpty>
            ) : (
              <StyledTable>
                <thead>
                  <tr>
                    <th>Mailbox account</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Conditions</th>
                    <th>Actions</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mailboxRules.map((mailboxRule) => {
                    const preview = mailboxRulePreviewsById[mailboxRule.id];
                    const isPreviewExpanded = expandedPreviewRuleId === mailboxRule.id;

                    return (
                      <Fragment key={mailboxRule.id}>
                        <tr>
                          <td>{mailboxRule.emailAddress ?? mailboxRule.mailboxProfileId}</td>
                      <td>
                        {editingRuleId === mailboxRule.id ? (
                          <StyledInput
                            aria-label={`Rule name ${mailboxRule.id}`}
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                          />
                        ) : (
                          mailboxRule.name
                        )}
                      </td>
                      <td>{mailboxRule.ruleType}</td>
                      <td>
                        {editingRuleId === mailboxRule.id ? (
                          <StyledInput
                            aria-label={`Rule priority ${mailboxRule.id}`}
                            value={editingPriority}
                            onChange={(event) => setEditingPriority(event.target.value)}
                          />
                        ) : (
                          mailboxRule.priority
                        )}
                      </td>
                      <td>
                        {editingRuleId === mailboxRule.id ? (
                          mailboxRule.ruleType === 'pending-reply' ? (
                            <StyledFormGrid>
                              <StyledField>
                                <StyledLabel>Reply queue folder</StyledLabel>
                                <StyledSelect
                                  aria-label={`Pending reply folder ${mailboxRule.id}`}
                                  value={editingPendingReplyRuleFormState.folder}
                                  onChange={(event) =>
                                    setEditingPendingReplyRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        folder: event.target.value,
                                      }),
                                    )
                                  }
                                >
                                  <option value="INBOX">Inbox</option>
                                  <option value="VIP">VIP</option>
                                  <option value="Pending">Pending</option>
                                </StyledSelect>
                              </StyledField>

                              <StyledField>
                                <StyledLabel>
                                  Reply delay threshold (hours)
                                </StyledLabel>
                                <StyledInput
                                  aria-label={`Pending reply delay hours ${mailboxRule.id}`}
                                  value={
                                    editingPendingReplyRuleFormState.maxReplyDelayHours
                                  }
                                  onChange={(event) =>
                                    setEditingPendingReplyRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        maxReplyDelayHours: event.target.value,
                                      }),
                                    )
                                  }
                                />
                              </StyledField>
                            </StyledFormGrid>
                          ) : mailboxRule.ruleType === 'folder-routing' ? (
                            <StyledFormGrid>
                              <StyledField>
                                <StyledLabel>Source folder</StyledLabel>
                                <StyledSelect
                                  aria-label={`Folder routing source folder ${mailboxRule.id}`}
                                  value={editingFolderRoutingRuleFormState.sourceFolder}
                                  onChange={(event) =>
                                    setEditingFolderRoutingRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        sourceFolder: event.target.value,
                                      }),
                                    )
                                  }
                                >
                                  <option value="INBOX">Inbox</option>
                                  <option value="VIP">VIP</option>
                                  <option value="Pending">Pending</option>
                                </StyledSelect>
                              </StyledField>
                              <StyledField>
                                <StyledLabel>Sender domain match</StyledLabel>
                                <StyledInput
                                  aria-label={`Folder routing sender domain ${mailboxRule.id}`}
                                  value={editingFolderRoutingRuleFormState.senderDomain}
                                  onChange={(event) =>
                                    setEditingFolderRoutingRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        senderDomain: event.target.value,
                                      }),
                                    )
                                  }
                                />
                              </StyledField>
                              <StyledField>
                                <StyledLabel>Subject keyword match</StyledLabel>
                                <StyledInput
                                  aria-label={`Folder routing subject keyword ${mailboxRule.id}`}
                                  value={editingFolderRoutingRuleFormState.subjectKeyword}
                                  onChange={(event) =>
                                    setEditingFolderRoutingRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        subjectKeyword: event.target.value,
                                      }),
                                    )
                                  }
                                />
                              </StyledField>
                            </StyledFormGrid>
                          ) : mailboxRule.ruleType === 'customer-auto-link' ? (
                            <StyledFormGrid>
                              <StyledField>
                                <StyledLabel>Sender domain match</StyledLabel>
                                <StyledInput
                                  aria-label={`Customer auto-link sender domain ${mailboxRule.id}`}
                                  value={
                                    editingCustomerAutoLinkRuleFormState.senderDomain
                                  }
                                  onChange={(event) =>
                                    setEditingCustomerAutoLinkRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        senderDomain: event.target.value,
                                      }),
                                    )
                                  }
                                />
                              </StyledField>
                            </StyledFormGrid>
                          ) : mailboxRule.ruleType ===
                            'subordinate-escalation' ? (
                            <StyledFormGrid>
                              <StyledField>
                                <StyledLabel>Source folder</StyledLabel>
                                <StyledSelect
                                  aria-label={`Subordinate escalation source folder ${mailboxRule.id}`}
                                  value={
                                    editingSubordinateEscalationRuleFormState.sourceFolder
                                  }
                                  onChange={(event) =>
                                    setEditingSubordinateEscalationRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        sourceFolder: event.target.value,
                                      }),
                                    )
                                  }
                                >
                                  <option value="INBOX">Inbox</option>
                                  <option value="Pending">Pending</option>
                                  <option value="VIP">VIP</option>
                                </StyledSelect>
                              </StyledField>
                              <StyledField>
                                <StyledLabel>
                                  Escalation threshold (hours)
                                </StyledLabel>
                                <StyledInput
                                  aria-label={`Subordinate escalation delay hours ${mailboxRule.id}`}
                                  value={
                                    editingSubordinateEscalationRuleFormState.maxReplyDelayHours
                                  }
                                  onChange={(event) =>
                                    setEditingSubordinateEscalationRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        maxReplyDelayHours:
                                          event.target.value,
                                      }),
                                    )
                                  }
                                />
                              </StyledField>
                            </StyledFormGrid>
                          ) : (
                            <StyledTextArea
                              aria-label={`Rule conditions ${mailboxRule.id}`}
                              value={editingConditionsJson}
                              onChange={(event) =>
                                setEditingConditionsJson(event.target.value)
                              }
                            />
                          )
                        ) : (
                          formatJson(mailboxRule.conditionsJson)
                        )}
                      </td>
                      <td>
                        {editingRuleId === mailboxRule.id ? (
                          mailboxRule.ruleType === 'pending-reply' ? (
                            <StyledCheckboxGrid>
                              <StyledCheckboxLabel>
                                <input
                                  aria-label={`Pending reply only unread ${mailboxRule.id}`}
                                  checked={
                                    editingPendingReplyRuleFormState.onlyUnread
                                  }
                                  type="checkbox"
                                  onChange={() =>
                                    setEditingPendingReplyRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        onlyUnread: !currentValue.onlyUnread,
                                      }),
                                    )
                                  }
                                />
                                only unread threads
                              </StyledCheckboxLabel>
                              <StyledCheckboxLabel>
                                <input
                                  aria-label={`Pending reply create task ${mailboxRule.id}`}
                                  checked={
                                    editingPendingReplyRuleFormState.createTask
                                  }
                                  type="checkbox"
                                  onChange={() =>
                                    setEditingPendingReplyRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        createTask: !currentValue.createTask,
                                      }),
                                    )
                                  }
                                />
                                create follow-up task
                              </StyledCheckboxLabel>
                              <StyledCheckboxLabel>
                                <input
                                  aria-label={`Pending reply escalate ${mailboxRule.id}`}
                                  checked={
                                    editingPendingReplyRuleFormState.escalateToManager
                                  }
                                  type="checkbox"
                                  onChange={() =>
                                    setEditingPendingReplyRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        escalateToManager:
                                          !currentValue.escalateToManager,
                                      }),
                                    )
                                  }
                                />
                                escalate to manager
                              </StyledCheckboxLabel>
                              <StyledCheckboxLabel>
                                <input
                                  aria-label={`Pending reply apply tag ${mailboxRule.id}`}
                                  checked={
                                    editingPendingReplyRuleFormState.applyPendingTag
                                  }
                                  type="checkbox"
                                  onChange={() =>
                                    setEditingPendingReplyRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        applyPendingTag:
                                          !currentValue.applyPendingTag,
                                      }),
                                    )
                                  }
                                />
                                apply pending tag
                              </StyledCheckboxLabel>
                            </StyledCheckboxGrid>
                          ) : mailboxRule.ruleType === 'folder-routing' ? (
                            <StyledFormGrid>
                              <StyledField>
                                <StyledLabel>Target folder</StyledLabel>
                                <StyledSelect
                                  aria-label={`Folder routing target folder ${mailboxRule.id}`}
                                  value={editingFolderRoutingRuleFormState.targetFolder}
                                  onChange={(event) =>
                                    setEditingFolderRoutingRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        targetFolder: event.target.value,
                                      }),
                                    )
                                  }
                                >
                                  <option value="VIP">VIP</option>
                                  <option value="Pending">Pending</option>
                                  <option value="Archive">Archive</option>
                                </StyledSelect>
                              </StyledField>
                              <StyledCheckboxGrid>
                                <StyledCheckboxLabel>
                                  <input
                                    aria-label={`Folder routing mark as read ${mailboxRule.id}`}
                                    checked={
                                      editingFolderRoutingRuleFormState.markAsRead
                                    }
                                    type="checkbox"
                                    onChange={() =>
                                      setEditingFolderRoutingRuleFormState(
                                        (currentValue) => ({
                                          ...currentValue,
                                          markAsRead: !currentValue.markAsRead,
                                        }),
                                      )
                                    }
                                  />
                                  mark as read after routing
                                </StyledCheckboxLabel>
                                <StyledCheckboxLabel>
                                  <input
                                    aria-label={`Folder routing stop rules ${mailboxRule.id}`}
                                    checked={
                                      editingFolderRoutingRuleFormState.stopFurtherRules
                                    }
                                    type="checkbox"
                                    onChange={() =>
                                      setEditingFolderRoutingRuleFormState(
                                        (currentValue) => ({
                                          ...currentValue,
                                          stopFurtherRules:
                                            !currentValue.stopFurtherRules,
                                        }),
                                      )
                                    }
                                  />
                                  stop further rule evaluation
                                </StyledCheckboxLabel>
                              </StyledCheckboxGrid>
                            </StyledFormGrid>
                          ) : mailboxRule.ruleType === 'customer-auto-link' ? (
                            <StyledCheckboxGrid>
                              <StyledCheckboxLabel>
                                <input
                                  aria-label={`Customer auto-link only unlinked ${mailboxRule.id}`}
                                  checked={
                                    editingCustomerAutoLinkRuleFormState.onlyUnlinkedThreads
                                  }
                                  type="checkbox"
                                  onChange={() =>
                                    setEditingCustomerAutoLinkRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        onlyUnlinkedThreads:
                                          !currentValue.onlyUnlinkedThreads,
                                      }),
                                    )
                                  }
                                />
                                only unlinked threads
                              </StyledCheckboxLabel>
                              <StyledCheckboxLabel>
                                <input
                                  aria-label={`Customer auto-link require known contact ${mailboxRule.id}`}
                                  checked={
                                    editingCustomerAutoLinkRuleFormState.requireKnownContact
                                  }
                                  type="checkbox"
                                  onChange={() =>
                                    setEditingCustomerAutoLinkRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        requireKnownContact:
                                          !currentValue.requireKnownContact,
                                      }),
                                    )
                                  }
                                />
                                require known contact
                              </StyledCheckboxLabel>
                              <StyledCheckboxLabel>
                                <input
                                  aria-label={`Customer auto-link link person ${mailboxRule.id}`}
                                  checked={
                                    editingCustomerAutoLinkRuleFormState.linkToPerson
                                  }
                                  type="checkbox"
                                  onChange={() =>
                                    setEditingCustomerAutoLinkRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        linkToPerson: !currentValue.linkToPerson,
                                      }),
                                    )
                                  }
                                />
                                link to person
                              </StyledCheckboxLabel>
                              <StyledCheckboxLabel>
                                <input
                                  aria-label={`Customer auto-link link company ${mailboxRule.id}`}
                                  checked={
                                    editingCustomerAutoLinkRuleFormState.linkToCompany
                                  }
                                  type="checkbox"
                                  onChange={() =>
                                    setEditingCustomerAutoLinkRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        linkToCompany:
                                          !currentValue.linkToCompany,
                                      }),
                                    )
                                  }
                                />
                                link to company
                              </StyledCheckboxLabel>
                              <StyledCheckboxLabel>
                                <input
                                  aria-label={`Customer auto-link attach opportunity ${mailboxRule.id}`}
                                  checked={
                                    editingCustomerAutoLinkRuleFormState.attachToLatestOpportunity
                                  }
                                  type="checkbox"
                                  onChange={() =>
                                    setEditingCustomerAutoLinkRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        attachToLatestOpportunity:
                                          !currentValue.attachToLatestOpportunity,
                                      }),
                                    )
                                  }
                                />
                                attach to latest open opportunity
                              </StyledCheckboxLabel>
                              <StyledCheckboxLabel>
                                <input
                                  aria-label={`Customer auto-link create lead ${mailboxRule.id}`}
                                  checked={
                                    editingCustomerAutoLinkRuleFormState.createLeadWhenUnmatched
                                  }
                                  type="checkbox"
                                  onChange={() =>
                                    setEditingCustomerAutoLinkRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        createLeadWhenUnmatched:
                                          !currentValue.createLeadWhenUnmatched,
                                      }),
                                    )
                                  }
                                />
                                create lead when unmatched
                              </StyledCheckboxLabel>
                            </StyledCheckboxGrid>
                          ) : mailboxRule.ruleType ===
                            'subordinate-escalation' ? (
                            <StyledCheckboxGrid>
                              <StyledCheckboxLabel>
                                <input
                                  aria-label={`Subordinate escalation only assigned ${mailboxRule.id}`}
                                  checked={
                                    editingSubordinateEscalationRuleFormState.onlyAssignedThreads
                                  }
                                  type="checkbox"
                                  onChange={() =>
                                    setEditingSubordinateEscalationRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        onlyAssignedThreads:
                                          !currentValue.onlyAssignedThreads,
                                      }),
                                    )
                                  }
                                />
                                only assigned subordinate threads
                              </StyledCheckboxLabel>
                              <StyledCheckboxLabel>
                                <input
                                  aria-label={`Subordinate escalation create task ${mailboxRule.id}`}
                                  checked={
                                    editingSubordinateEscalationRuleFormState.createTask
                                  }
                                  type="checkbox"
                                  onChange={() =>
                                    setEditingSubordinateEscalationRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        createTask:
                                          !currentValue.createTask,
                                      }),
                                    )
                                  }
                                />
                                create escalation task
                              </StyledCheckboxLabel>
                              <StyledCheckboxLabel>
                                <input
                                  aria-label={`Subordinate escalation notify owner ${mailboxRule.id}`}
                                  checked={
                                    editingSubordinateEscalationRuleFormState.notifyOwner
                                  }
                                  type="checkbox"
                                  onChange={() =>
                                    setEditingSubordinateEscalationRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        notifyOwner:
                                          !currentValue.notifyOwner,
                                      }),
                                    )
                                  }
                                />
                                notify current owner
                              </StyledCheckboxLabel>
                              <StyledCheckboxLabel>
                                <input
                                  aria-label={`Subordinate escalation escalate manager ${mailboxRule.id}`}
                                  checked={
                                    editingSubordinateEscalationRuleFormState.escalateToManager
                                  }
                                  type="checkbox"
                                  onChange={() =>
                                    setEditingSubordinateEscalationRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        escalateToManager:
                                          !currentValue.escalateToManager,
                                      }),
                                    )
                                  }
                                />
                                escalate to manager
                              </StyledCheckboxLabel>
                              <StyledCheckboxLabel>
                                <input
                                  aria-label={`Subordinate escalation reassign primary ${mailboxRule.id}`}
                                  checked={
                                    editingSubordinateEscalationRuleFormState.reassignToPrimarySender
                                  }
                                  type="checkbox"
                                  onChange={() =>
                                    setEditingSubordinateEscalationRuleFormState(
                                      (currentValue) => ({
                                        ...currentValue,
                                        reassignToPrimarySender:
                                          !currentValue.reassignToPrimarySender,
                                      }),
                                    )
                                  }
                                />
                                reassign to primary sender route
                              </StyledCheckboxLabel>
                            </StyledCheckboxGrid>
                          ) : (
                            <StyledTextArea
                              aria-label={`Rule actions ${mailboxRule.id}`}
                              value={editingActionsJson}
                              onChange={(event) =>
                                setEditingActionsJson(event.target.value)
                              }
                            />
                          )
                        ) : (
                          formatJson(mailboxRule.actionsJson)
                        )}
                      </td>
                      <td>
                        <StyledStatus
                          tone={mailboxRule.enabled ? 'success' : 'neutral'}
                        >
                          {mailboxRule.enabled ? 'enabled' : 'disabled'}
                        </StyledStatus>
                      </td>
                      <td>
                        {editingRuleId === mailboxRule.id ? (
                          <>
                            <Button
                              title="Save rule"
                              disabled={
                                editingName.trim().length === 0 ||
                                editingPriority.trim().length === 0
                              }
                              onClick={() => void saveMailboxRule(mailboxRule.id)}
                            />
                            <Button title="Cancel edit" onClick={cancelEditingMailboxRule} />
                          </>
                        ) : (
                          <>
                            <Button
                              title="Edit rule"
                              onClick={() =>
                                startEditingMailboxRule({
                                  id: mailboxRule.id,
                                  name: mailboxRule.name,
                                  priority: mailboxRule.priority,
                                  ruleType: mailboxRule.ruleType,
                                  conditionsJson: mailboxRule.conditionsJson,
                                  actionsJson: mailboxRule.actionsJson,
                                })
                              }
                            />
                            <Button
                              title={mailboxRule.enabled ? 'Disable rule' : 'Enable rule'}
                              onClick={() =>
                                void toggleMailboxRule(mailboxRule.id, mailboxRule.enabled)
                              }
                            />
                            <Button
                              title="Preview rule"
                              onClick={() => {
                                setExpandedPreviewRuleId((currentValue) =>
                                  currentValue === mailboxRule.id ? null : mailboxRule.id,
                                );

                                if (!preview) {
                                  void loadMailboxRulePreview(mailboxRule.id);
                                }
                              }}
                            />
                          </>
                        )}
                      </td>
                    </tr>
                        {isPreviewExpanded ? (
                          <tr>
                            <td colSpan={8}>
                              <StyledPanel>
                                <StyledSectionTitle>Dry-run preview</StyledSectionTitle>
                                <StyledSectionText>
                                  This preview samples real mailbox threads for the current
                                  rule. It shows candidate threads and planned actions,
                                  not fake hit counts.
                                </StyledSectionText>
                                {previewLoadingRuleId === mailboxRule.id && !preview ? (
                                  <StyledEmpty>Loading preview threads...</StyledEmpty>
                                ) : !preview ? (
                                  <StyledEmpty>No preview available yet.</StyledEmpty>
                                ) : (
                                  <>
                                    <StyledSectionText>
                                      Status:{' '}
                                      <StyledStatus tone={getStatusTone(preview.status)}>
                                        {preview.status}
                                      </StyledStatus>{' '}
                                      | Candidates: {preview.candidateCount}
                                    </StyledSectionText>
                                    {preview.blockers.length > 0 ||
                                    preview.warnings.length > 0 ? (
                                      <StyledSectionText>
                                        {[...preview.blockers, ...preview.warnings].join(
                                          ' ',
                                        )}
                                      </StyledSectionText>
                                    ) : null}
                                    {preview.candidates.length === 0 ? (
                                      <StyledEmpty>
                                        No candidate threads matched the current mailbox and
                                        rule conditions.
                                      </StyledEmpty>
                                    ) : (
                                      <StyledTable>
                                        <thead>
                                          <tr>
                                            <th>Thread</th>
                                            <th>Sender</th>
                                            <th>Received</th>
                                            <th>Signals</th>
                                            <th>CRM state</th>
                                            <th>Planned actions</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {preview.candidates.map((candidate) => (
                                            <tr key={candidate.threadId}>
                                              <td>
                                                <strong>{candidate.subject}</strong>
                                                <br />
                                                {candidate.threadId}
                                              </td>
                                              <td>{candidate.senderHandle ?? 'Unknown sender'}</td>
                                              <td>
                                                {candidate.receivedAt
                                                  ? new Date(
                                                      candidate.receivedAt,
                                                    ).toLocaleString()
                                                  : 'Unknown time'}
                                              </td>
                                              <td>{candidate.matchedSignals.join(' · ')}</td>
                                              <td>
                                                {candidate.crmLinked
                                                  ? 'CRM linked'
                                                  : 'CRM unlinked'}
                                                <br />
                                                {candidate.pending ? 'Pending' : 'Clear'} /{' '}
                                                {candidate.taskLinked
                                                  ? 'Task linked'
                                                  : 'No task link'}
                                              </td>
                                              <td>
                                                {candidate.plannedActions.length > 0
                                                  ? candidate.plannedActions.join(' · ')
                                                  : 'No explicit actions'}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </StyledTable>
                                    )}
                                  </>
                                )}
                              </StyledPanel>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </StyledTable>
            )}
          </StyledPanel>

          <StyledPanel>
            <StyledSectionTitle>Rule readiness preview</StyledSectionTitle>
            <StyledSectionText>
              This preview checks mailbox health, active assignees, and folder
              references before you treat a rule as operational. It is a
              readiness gate, not a fake hit counter.
            </StyledSectionText>

            {mailboxRuleReadiness.length === 0 ? (
              <StyledEmpty>No mailbox rule readiness data yet.</StyledEmpty>
            ) : (
              <StyledTable>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Rule</th>
                    <th>Mailbox</th>
                    <th>Assignments</th>
                    <th>Folder checks</th>
                    <th>Warnings / blockers</th>
                  </tr>
                </thead>
                <tbody>
                  {mailboxRuleReadiness.map((previewItem) => (
                    <tr key={previewItem.ruleId}>
                      <td>
                        <StyledStatus
                          tone={getStatusTone(previewItem.status)}
                        >
                          {formatRuleReadinessStatus(previewItem.status)}
                        </StyledStatus>
                      </td>
                      <td>
                        <strong>{previewItem.ruleName}</strong>
                        <br />
                        {previewItem.ruleType}
                      </td>
                      <td>
                        {previewItem.emailAddress ?? 'Unknown mailbox'}
                        <br />
                        mailbox {previewItem.mailboxStatus} / validation{' '}
                        {previewItem.validationStatus}
                        <br />
                        channel{' '}
                        {previewItem.messageChannelDetected ? 'detected' : 'missing'}
                      </td>
                      <td>
                        active {previewItem.activeAssignmentCount}
                        <br />
                        primary {previewItem.primaryAssignmentCount}
                      </td>
                      <td>
                        {previewItem.sourceFolder ? (
                          <>
                            source: {previewItem.sourceFolder} (
                            {previewItem.sourceFolderExists ? 'ok' : 'missing'})
                            <br />
                          </>
                        ) : null}
                        {previewItem.targetFolder ? (
                          <>
                            target: {previewItem.targetFolder} (
                            {previewItem.targetFolderExists ? 'ok' : 'missing'})
                          </>
                        ) : previewItem.sourceFolder ? null : (
                          'No folder dependency'
                        )}
                      </td>
                      <td>
                        {previewItem.blockers.length === 0 &&
                        previewItem.warnings.length === 0
                          ? 'Ready for runtime execution checks.'
                          : [...previewItem.blockers, ...previewItem.warnings].join(' ')}
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
