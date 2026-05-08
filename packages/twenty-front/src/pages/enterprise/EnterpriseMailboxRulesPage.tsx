import { Fragment, useMemo, useState } from 'react';

import { EnterprisePermissionGuard } from '@/enterprise/shared/components/EnterprisePermissionGuard';
import { EnterpriseShell } from '@/enterprise/shared/components/EnterpriseShell';
import { enterprisePermissionCodes } from '@/enterprise/shared/constants/enterprisePermissions';
import {
  createTradeCrmRecordSource,
  getTradeCrmRecordPathFromSource,
} from '@/trade-crm/shared/navigation/tradeCrmRecordSource';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { CoreObjectNameSingular } from 'twenty-shared/types';
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
  StyledMetaItem,
  StyledMetaList,
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

const mailboxRulesRecordSource = createTradeCrmRecordSource({
  href: '/enterprise/mailbox/rules',
  workspaceKey: 'admin',
  workspaceLabel: 'Admin',
  viewKey: 'mailbox-rules',
  viewLabel: 'Mailbox Rules',
  trail: 'mailbox-rule-result',
});

const getMailboxRuleResultRecordHref = (input: {
  kind: 'task' | 'person' | 'company' | 'opportunity';
  recordId: string;
}) => {
  const objectNameSingular =
    input.kind === 'task'
      ? CoreObjectNameSingular.Task
      : input.kind === 'person'
        ? CoreObjectNameSingular.Person
        : input.kind === 'company'
          ? CoreObjectNameSingular.Company
          : CoreObjectNameSingular.Opportunity;

  return getTradeCrmRecordPathFromSource({
    objectNameSingular,
    objectRecordId: input.recordId,
    source: mailboxRulesRecordSource,
  });
};

export const EnterpriseMailboxRulesPage = () => {
  const sidebar = useMemo(buildEnterpriseSidebar, []);
  const { enqueueErrorSnackBar } = useSnackBar();
  const { mailboxProfiles } = useEnterpriseMailboxProfiles();
  const {
    createMailboxRule,
    isLoading,
    loadMailboxRulePreview,
    mailboxRuleActivity,
    mailboxRuleResults,
    mailboxRulePreviewsById,
    mailboxRuleReadiness,
    mailboxRules,
    previewLoadingRuleId,
    runMailboxRuleNow,
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
  const [expandedLatestResultRuleId, setExpandedLatestResultRuleId] =
    useState<string | null>(null);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const [resultRuleFilter, setResultRuleFilter] = useState('all');
  const [resultTypeFilter, setResultTypeFilter] = useState('all');

  const selectedMailboxProfile = useMemo(
    () =>
      mailboxProfiles.find((mailboxProfile) => mailboxProfile.id === mailboxProfileId),
    [mailboxProfileId, mailboxProfiles],
  );

  const mailboxRuleCreateBlockedReason = useMemo(() => {
    if (!selectedMailboxProfile) {
      return null;
    }

    if (selectedMailboxProfile.status !== 'active') {
      return 'The selected mailbox is not active. Reactivate it before creating mailbox rules.';
    }

    if (selectedMailboxProfile.validationStatus === 'failed') {
      return (
        selectedMailboxProfile.lastValidationError ??
        'The selected mailbox failed IMAP/SMTP validation. Revalidate it before creating mailbox rules.'
      );
    }

    if (selectedMailboxProfile.validationStatus !== 'validated') {
      return 'Validate and provision this mailbox before attaching mailbox rules.';
    }

    return null;
  }, [selectedMailboxProfile]);

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

  const formatRuleResultExecutionLabel = (value: string) =>
    value === 'preview'
      ? 'Dry-run preview'
      : value === 'runtime'
        ? 'Live run'
        : value;

  const formatRuleResultOutcomeLabel = (
    executionType: string,
    outcome: string,
  ) => {
    if (executionType === 'preview' && outcome === 'matched') {
      return 'Preview would act';
    }

    if (executionType === 'preview' && outcome === 'no-match') {
      return 'Preview found no candidates';
    }

    if (outcome === 'acted') {
      return 'Actions applied';
    }

    if (outcome === 'skipped') {
      return 'Skipped by guardrail';
    }

    if (outcome === 'blocked') {
      return 'Blocked';
    }

    if (outcome === 'failed') {
      return 'Execution failed';
    }

    if (outcome === 'matched') {
      return 'Matched';
    }

    if (outcome === 'no-match') {
      return 'No candidates';
    }

    return outcome;
  };

  const getRuleResultOutcomeTone = (executionType: string, outcome: string) => {
    if (outcome === 'acted') {
      return 'success';
    }

    if (outcome === 'failed' || outcome === 'blocked') {
      return 'neutral';
    }

    if (outcome === 'skipped' || outcome === 'no-match') {
      return 'warning';
    }

    if (executionType === 'preview' && outcome === 'matched') {
      return 'warning';
    }

    return 'success';
  };

  const buildRuleResultNotes = (input: {
    failureReason: string | null;
    matchedSignalsJson: string[] | null;
    metadataJson: Record<string, unknown> | null;
    plannedActionsJson: string[] | null;
    threadId: string | null;
  }) => {
    const notes: string[] = [];

    if (input.failureReason) {
      notes.push(`Reason: ${input.failureReason}`);
    }

    if (input.threadId) {
      notes.push(`Thread: ${input.threadId}`);
    }

    if (input.metadataJson?.taskId && typeof input.metadataJson.taskId === 'string') {
      notes.push(`Task: ${input.metadataJson.taskId}`);
    }

    if (
      input.metadataJson?.unsupportedActions &&
      Array.isArray(input.metadataJson.unsupportedActions) &&
      input.metadataJson.unsupportedActions.length > 0
    ) {
      notes.push(
        `Unsupported: ${input.metadataJson.unsupportedActions.join(', ')}`,
      );
    }

    if (input.matchedSignalsJson && input.matchedSignalsJson.length > 0) {
      notes.push(`Signals: ${input.matchedSignalsJson.join(' | ')}`);
    }

    if (input.plannedActionsJson && input.plannedActionsJson.length > 0) {
      notes.push(`Planned: ${input.plannedActionsJson.join(' | ')}`);
    }

    return notes;
  };

  const buildRuleResultDetailItems = (input: {
    failureReason: string | null;
    matchedSignalsJson: string[] | null;
    metadataJson: Record<string, unknown> | null;
    plannedActionsJson: string[] | null;
    threadId: string | null;
  }) => {
    const detailItems: Array<{
      href?: string;
      label: string;
      value: string;
    }> = [];

    if (input.threadId) {
      detailItems.push({ label: 'Thread', value: input.threadId });
    }

    if (input.metadataJson?.taskId && typeof input.metadataJson.taskId === 'string') {
      detailItems.push({
        href: getMailboxRuleResultRecordHref({
          kind: 'task',
          recordId: input.metadataJson.taskId,
        }),
        label: 'Task',
        value: input.metadataJson.taskId,
      });
    }

    if (
      input.metadataJson?.personId &&
      typeof input.metadataJson.personId === 'string'
    ) {
      detailItems.push({
        href: getMailboxRuleResultRecordHref({
          kind: 'person',
          recordId: input.metadataJson.personId,
        }),
        label: 'Person',
        value: input.metadataJson.personId,
      });
    }

    if (
      input.metadataJson?.companyId &&
      typeof input.metadataJson.companyId === 'string'
    ) {
      detailItems.push({
        href: getMailboxRuleResultRecordHref({
          kind: 'company',
          recordId: input.metadataJson.companyId,
        }),
        label: 'Company',
        value: input.metadataJson.companyId,
      });
    }

    if (
      input.metadataJson?.opportunityId &&
      typeof input.metadataJson.opportunityId === 'string'
    ) {
      detailItems.push({
        href: getMailboxRuleResultRecordHref({
          kind: 'opportunity',
          recordId: input.metadataJson.opportunityId,
        }),
        label: 'Opportunity',
        value: input.metadataJson.opportunityId,
      });
    }

    if (input.failureReason) {
      detailItems.push({ label: 'Failure reason', value: input.failureReason });
    }

    if (input.matchedSignalsJson && input.matchedSignalsJson.length > 0) {
      detailItems.push({
        label: 'Matched signals',
        value: input.matchedSignalsJson.join(' 路 '),
      });
    }

    if (input.plannedActionsJson && input.plannedActionsJson.length > 0) {
      detailItems.push({
        label: 'Planned actions',
        value: input.plannedActionsJson.join(' 路 '),
      });
    }

    if (
      Array.isArray(input.metadataJson?.unsupportedActions) &&
      input.metadataJson.unsupportedActions.length > 0
    ) {
      detailItems.push({
        label: 'Unsupported actions',
        value: input.metadataJson.unsupportedActions.join(' 路 '),
      });
    }

    return detailItems;
  };

  const formatRuleResultSnapshot = (
    resultItem?: (typeof mailboxRuleResults)[number] | null,
  ): {
    executionLabel: string;
    outcomeLabel: string;
    tone: 'neutral' | 'success' | 'warning';
    when: string;
    summary: string;
  } | null => {
    if (!resultItem) {
      return null;
    }

    return {
      executionLabel: formatRuleResultExecutionLabel(resultItem.executionType),
      outcomeLabel: formatRuleResultOutcomeLabel(
        resultItem.executionType,
        resultItem.outcome,
      ),
      tone: getRuleResultOutcomeTone(
        resultItem.executionType,
        resultItem.outcome,
      ),
      when: new Date(resultItem.createdAt).toLocaleString(),
      summary: resultItem.summary,
    };
  };

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

  const filteredMailboxRuleResults = useMemo(
    () =>
      mailboxRuleResults.filter((resultItem) => {
        if (
          resultRuleFilter !== 'all' &&
          resultItem.mailboxRuleId !== resultRuleFilter
        ) {
          return false;
        }

        if (
          resultTypeFilter !== 'all' &&
          `${resultItem.executionType}:${resultItem.outcome}` !== resultTypeFilter
        ) {
          return false;
        }

        return true;
      }),
    [mailboxRuleResults, resultRuleFilter, resultTypeFilter],
  );

  const filteredRuleResultSummary = useMemo(
    () => ({
      actedRuns: filteredMailboxRuleResults.filter(
        (resultItem) => resultItem.outcome === 'acted',
      ).length,
      blockedRuns: filteredMailboxRuleResults.filter(
        (resultItem) => resultItem.outcome === 'blocked',
      ).length,
      failedRuns: filteredMailboxRuleResults.filter(
        (resultItem) => resultItem.outcome === 'failed',
      ).length,
      liveRuns: filteredMailboxRuleResults.filter(
        (resultItem) => resultItem.executionType === 'runtime',
      ).length,
      previewRuns: filteredMailboxRuleResults.filter(
        (resultItem) => resultItem.executionType === 'preview',
      ).length,
      skippedRuns: filteredMailboxRuleResults.filter(
        (resultItem) =>
          resultItem.outcome === 'skipped' || resultItem.outcome === 'no-match',
      ).length,
    }),
    [filteredMailboxRuleResults],
  );

  const latestRuleResultByRuleId = useMemo(
    () =>
      mailboxRuleResults.reduce<Record<string, (typeof mailboxRuleResults)[number]>>(
        (currentValue, resultItem) => {
          const existingResult = currentValue[resultItem.mailboxRuleId];

          if (
            !existingResult ||
            new Date(resultItem.createdAt).getTime() >
              new Date(existingResult.createdAt).getTime()
          ) {
            currentValue[resultItem.mailboxRuleId] = resultItem;
          }

          return currentValue;
        },
        {},
      ),
    [mailboxRuleResults],
  );

  const handleRunMailboxRuleNow = async (mailboxRuleId: string) => {
    await runMailboxRuleNow(mailboxRuleId);
    setExpandedLatestResultRuleId(mailboxRuleId);
  };

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
                      {mailboxProfile.validationStatus !== 'validated'
                        ? ` (${mailboxProfile.validationStatus})`
                        : ''}
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

            {selectedMailboxProfile ? (
              <StyledSectionText>
                Mailbox status: {selectedMailboxProfile.status} / validation{' '}
                {selectedMailboxProfile.validationStatus}
                {selectedMailboxProfile.messageChannelId
                  ? ` / channel ${selectedMailboxProfile.messageChannelId}`
                  : ' / channel pending'}
              </StyledSectionText>
            ) : null}

            {mailboxRuleCreateBlockedReason ? (
              <StyledStatus tone="warning">
                {mailboxRuleCreateBlockedReason}
              </StyledStatus>
            ) : null}

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
                !mailboxProfileId.trim() ||
                !name.trim() ||
                !priority.trim() ||
                mailboxRuleCreateBlockedReason !== null
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
            <StyledSectionTitle>Recent rule results</StyledSectionTitle>
            <StyledSectionText>
              This feed separates dry-run previews from live execution. Treat
              preview rows as planning checks; treat live runs as operational
              changes to mailbox state, task creation, or CRM linking.
            </StyledSectionText>
            <StyledMetaList>
              <StyledMetaItem>
                <StyledSectionTitle>Dry-run previews</StyledSectionTitle>
                <StyledStatus tone="warning">
                  {filteredRuleResultSummary.previewRuns}
                </StyledStatus>
              </StyledMetaItem>
              <StyledMetaItem>
                <StyledSectionTitle>Live runs</StyledSectionTitle>
                <StyledStatus tone="success">
                  {filteredRuleResultSummary.liveRuns}
                </StyledStatus>
              </StyledMetaItem>
              <StyledMetaItem>
                <StyledSectionTitle>Actions applied</StyledSectionTitle>
                <StyledStatus tone="success">
                  {filteredRuleResultSummary.actedRuns}
                </StyledStatus>
              </StyledMetaItem>
              <StyledMetaItem>
                <StyledSectionTitle>Blocked / failed</StyledSectionTitle>
                <StyledStatus tone="neutral">
                  {filteredRuleResultSummary.blockedRuns +
                    filteredRuleResultSummary.failedRuns}
                </StyledStatus>
              </StyledMetaItem>
              <StyledMetaItem>
                <StyledSectionTitle>Skipped / no candidates</StyledSectionTitle>
                <StyledStatus tone="warning">
                  {filteredRuleResultSummary.skippedRuns}
                </StyledStatus>
              </StyledMetaItem>
            </StyledMetaList>

            <StyledFormGrid>
              <StyledField>
                <StyledLabel>Filter by rule</StyledLabel>
                <StyledSelect
                  aria-label="Filter results by rule"
                  value={resultRuleFilter}
                  onChange={(event) => setResultRuleFilter(event.target.value)}
                >
                  <option value="all">All rules</option>
                  {mailboxRules.map((mailboxRule) => (
                    <option key={mailboxRule.id} value={mailboxRule.id}>
                      {mailboxRule.name}
                    </option>
                  ))}
                </StyledSelect>
              </StyledField>
              <StyledField>
                <StyledLabel>Filter by result type</StyledLabel>
                <StyledSelect
                  aria-label="Filter results by execution outcome"
                  value={resultTypeFilter}
                  onChange={(event) => setResultTypeFilter(event.target.value)}
                >
                  <option value="all">All result types</option>
                  <option value="preview:matched">Preview would act</option>
                  <option value="preview:no-match">Preview no candidates</option>
                  <option value="preview:blocked">Preview blocked</option>
                  <option value="runtime:acted">Runtime acted</option>
                  <option value="runtime:skipped">Runtime skipped</option>
                  <option value="runtime:no-match">Runtime no candidates</option>
                  <option value="runtime:blocked">Runtime blocked</option>
                  <option value="runtime:failed">Runtime failed</option>
                </StyledSelect>
              </StyledField>
            </StyledFormGrid>

            {filteredMailboxRuleResults.length === 0 ? (
              <StyledEmpty>No rule results yet.</StyledEmpty>
            ) : (
              <StyledTable>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Rule</th>
                    <th>Mailbox</th>
                    <th>Execution</th>
                    <th>Outcome</th>
                    <th>Summary</th>
                    <th>Failure / signals</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMailboxRuleResults.map((resultItem) => {
                    const resultNotes = buildRuleResultNotes({
                      failureReason: resultItem.failureReason,
                      matchedSignalsJson: resultItem.matchedSignalsJson,
                      metadataJson: resultItem.metadataJson,
                      plannedActionsJson: resultItem.plannedActionsJson,
                      threadId: resultItem.threadId,
                    });
                    const resultDetailItems = buildRuleResultDetailItems({
                      failureReason: resultItem.failureReason,
                      matchedSignalsJson: resultItem.matchedSignalsJson,
                      metadataJson: resultItem.metadataJson,
                      plannedActionsJson: resultItem.plannedActionsJson,
                      threadId: resultItem.threadId,
                    });
                    const isResultExpanded = expandedResultId === resultItem.id;

                    return (
                      <Fragment key={resultItem.id}>
                        <tr>
                          <td>{new Date(resultItem.createdAt).toLocaleString()}</td>
                          <td>
                            {resultItem.ruleName ?? resultItem.mailboxRuleId}
                            <br />
                            {resultItem.ruleType ?? 'Unknown type'}
                          </td>
                          <td>{resultItem.emailAddress ?? 'Unknown mailbox'}</td>
                          <td>
                            <StyledStatus
                              tone={
                                resultItem.executionType === 'preview'
                                  ? 'warning'
                                  : 'success'
                              }
                            >
                              {formatRuleResultExecutionLabel(resultItem.executionType)}
                            </StyledStatus>
                          </td>
                          <td>
                            <StyledStatus
                              tone={getRuleResultOutcomeTone(
                                resultItem.executionType,
                                resultItem.outcome,
                              )}
                            >
                              {formatRuleResultOutcomeLabel(
                                resultItem.executionType,
                                resultItem.outcome,
                              )}
                            </StyledStatus>
                          </td>
                          <td>{resultItem.summary}</td>
                          <td>
                            {resultNotes.length === 0
                              ? 'No blocking reason or matched signal recorded.'
                              : null}
                            {resultNotes.map((resultNote) => (
                              <Fragment key={resultNote}>
                                <br />
                                {resultNote}
                              </Fragment>
                            ))}
                            {resultDetailItems.length > 0 ? (
                              <>
                                <br />
                                <Button
                                  title={
                                    isResultExpanded
                                      ? 'Hide result details'
                                      : 'Show result details'
                                  }
                                  onClick={() =>
                                    setExpandedResultId((currentValue) =>
                                      currentValue === resultItem.id ? null : resultItem.id,
                                    )
                                  }
                                />
                              </>
                            ) : null}
                          </td>
                        </tr>
                        {isResultExpanded ? (
                          <tr>
                            <td colSpan={7}>
                              <StyledGrid>
                                <StyledSectionTitle>Thread-level result details</StyledSectionTitle>
                                <StyledFormGrid>
                                  {resultDetailItems.map((detailItem) => (
                                    <StyledMetaItem key={`${resultItem.id}-${detailItem.label}`}>
                                      <strong>{detailItem.label}</strong>
                                      <br />
                                      {detailItem.href ? (
                                        <a href={detailItem.href}>
                                          {detailItem.value}
                                        </a>
                                      ) : (
                                        detailItem.value
                                      )}
                                    </StyledMetaItem>
                                  ))}
                                </StyledFormGrid>
                              </StyledGrid>
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
                      <th>Last result</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                  {mailboxRules.map((mailboxRule) => {
                      const preview = mailboxRulePreviewsById[mailboxRule.id];
                      const latestRuleResultItem =
                        latestRuleResultByRuleId[mailboxRule.id] ?? null;
                      const latestRuleResult = formatRuleResultSnapshot(
                        latestRuleResultItem,
                      );
                      const isPreviewExpanded = expandedPreviewRuleId === mailboxRule.id;
                      const isLatestResultExpanded =
                        expandedLatestResultRuleId === mailboxRule.id &&
                        latestRuleResultItem !== null;
                      const latestResultDetailItems =
                        latestRuleResultItem === null
                          ? []
                          : buildRuleResultDetailItems({
                              failureReason: latestRuleResultItem.failureReason,
                              matchedSignalsJson:
                                latestRuleResultItem.matchedSignalsJson,
                              metadataJson: latestRuleResultItem.metadataJson,
                              plannedActionsJson:
                                latestRuleResultItem.plannedActionsJson,
                              threadId: latestRuleResultItem.threadId,
                            });

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
                          {latestRuleResult ? (
                            <>
                              <StyledStatus tone={latestRuleResult.tone}>
                                {latestRuleResult.outcomeLabel}
                              </StyledStatus>
                              <br />
                              {latestRuleResult.executionLabel} ·{' '}
                              {latestRuleResult.when}
                              <br />
                              {latestRuleResult.summary}
                            </>
                          ) : (
                            'No result yet'
                          )}
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
                            <Button
                              title="Run rule now"
                              onClick={() =>
                                void handleRunMailboxRuleNow(mailboxRule.id)
                              }
                            />
                            {latestRuleResultItem ? (
                              <Button
                                title={
                                  isLatestResultExpanded
                                    ? 'Hide latest run feedback'
                                    : 'Show latest run feedback'
                                }
                                onClick={() =>
                                  setExpandedLatestResultRuleId((currentValue) =>
                                    currentValue === mailboxRule.id
                                      ? null
                                      : mailboxRule.id,
                                  )
                                }
                              />
                            ) : null}
                          </>
                        )}
                      </td>
                    </tr>
                        {isLatestResultExpanded ? (
                          <tr>
                            <td colSpan={9}>
                              <StyledPanel>
                                <StyledSectionTitle>Latest execution feedback</StyledSectionTitle>
                                <StyledSectionText>
                                  This panel keeps the newest run or preview
                                  outcome attached to the current rule so the
                                  operator does not need to scan the global
                                  result ledger after clicking Run rule now.
                                </StyledSectionText>
                                <StyledMetaList>
                                  <StyledMetaItem>
                                    <strong>Execution</strong>
                                    <br />
                                    {latestRuleResult?.executionLabel ?? 'Unknown'}
                                  </StyledMetaItem>
                                  <StyledMetaItem>
                                    <strong>Outcome</strong>
                                    <br />
                                    {latestRuleResult?.outcomeLabel ?? 'Unknown'}
                                  </StyledMetaItem>
                                  <StyledMetaItem>
                                    <strong>When</strong>
                                    <br />
                                    {latestRuleResult?.when ?? 'Unknown'}
                                  </StyledMetaItem>
                                </StyledMetaList>
                                <StyledMetaItem>
                                  <strong>Summary</strong>
                                  <br />
                                  {latestRuleResult?.summary ??
                                    'No summary recorded.'}
                                </StyledMetaItem>
                                {latestResultDetailItems.length > 0 ? (
                                  <StyledFormGrid>
                                    {latestResultDetailItems.map((detailItem) => (
                                      <StyledMetaItem
                                        key={`${mailboxRule.id}-${detailItem.label}`}
                                      >
                                        <strong>{detailItem.label}</strong>
                                        <br />
                                        {detailItem.href ? (
                                          <a href={detailItem.href}>
                                            {detailItem.value}
                                          </a>
                                        ) : (
                                          detailItem.value
                                        )}
                                      </StyledMetaItem>
                                    ))}
                                  </StyledFormGrid>
                                ) : (
                                  <StyledEmpty>
                                    No thread-level details recorded for this run.
                                  </StyledEmpty>
                                )}
                              </StyledPanel>
                            </td>
                          </tr>
                        ) : null}
                        {isPreviewExpanded ? (
                          <tr>
                            <td colSpan={9}>
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
