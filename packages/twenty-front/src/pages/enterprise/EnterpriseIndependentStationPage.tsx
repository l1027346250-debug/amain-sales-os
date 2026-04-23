import { useCallback, useEffect, useMemo, useState } from 'react';

import { styled } from '@linaria/react';

import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { EnterprisePermissionGuard } from '@/enterprise/shared/components/EnterprisePermissionGuard';
import { enterprisePermissionCodes } from '@/enterprise/shared/constants/enterprisePermissions';
import { EnterpriseShell } from '@/enterprise/shared/components/EnterpriseShell';
import { enterpriseNavigationGroups } from '@/enterprise/shared/constants/enterpriseNavigation';
import { useEnterpriseApiRequest } from '@/enterprise/shared/hooks/useEnterpriseApiRequest';
import { useEnterprisePermissions } from '@/enterprise/shared/hooks/useEnterprisePermissions';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type PartialWorkspaceMember } from '@/settings/roles/types/RoleWithPartialMembers';

type WebsiteBinding = {
  id: string;
  websiteName: string;
  websiteUrl: string;
  provider: string;
  status: 'bound' | 'paused' | 'unbound';
  boundAt: string | null;
  unboundAt: string | null;
  metadataJson: {
    autoBindForm?: boolean;
    notificationChannels?: string[];
    notificationRecipients?: string[];
    webhookSecretHash?: string;
    webhookSecretHint?: string;
  } | null;
};

type FormMapping = {
  id?: string;
  externalFieldCode: string;
  crmFieldCode: string;
  required: boolean;
};

type AssignmentRule = {
  id?: string;
  ruleName: string;
  assignmentType: string;
  assigneeIds: string[];
  departmentIds: string[];
  conditionJson: {
    country?: string;
    sourcePage?: string;
  } | null;
  enabled: boolean;
  sortOrder: number;
};

type InquiryCrmRecord = {
  action:
    | 'blocked'
    | 'created_person'
    | 'reused_person'
    | 'restored_person'
    | 'skipped_no_email';
  companyId: string | null;
  noteId: string | null;
  personId: string | null;
};

type WebsiteInquiry = {
  id: string;
  externalInquiryId: string;
  inquiryStatus: 'accepted' | 'pending_assignment' | 'blocked' | 'duplicate';
  leadId: string | null;
  assignedTo: string | null;
  payloadJson: Record<string, unknown>;
  decisionJson: {
    crmRecord?: InquiryCrmRecord;
    missingRequiredFields?: string[];
  } | null;
  createdAt: string;
};

type WebsiteInquiryListResponse = {
  items: WebsiteInquiry[];
  page: number;
  pageSize: number;
  total: number;
};

type InquiryFilters = {
  page: number;
  pageSize: number;
  search: string;
  statuses: WebsiteInquiry['inquiryStatus'][];
};

type InquiryDraft = {
  assignedTo: string;
  inquiryStatus: WebsiteInquiry['inquiryStatus'];
};

type WorkspaceMemberOption = {
  label: string;
  value: string;
};

type WebsiteFormState = {
  websiteName: string;
  websiteUrl: string;
  provider: string;
  status: 'bound' | 'paused' | 'unbound';
  autoBindForm: boolean;
  notificationChannels: string;
  notificationRecipients: string;
  webhookSecret: string;
};

type AssignmentRuleFormState = {
  ruleName: string;
  assignmentType: string;
  assigneeIds: string[];
  departmentIds: string;
  country: string;
  sourcePage: string;
  enabled: boolean;
  sortOrder: number;
};

const buildSidebar = () =>
  enterpriseNavigationGroups.map((section) => ({
    title: section.label,
    items: section.items.map((item) => item.label),
  }));

const StyledGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledPanel = styled.section`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledHeader = styled.div`
  align-items: flex-start;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
`;

const StyledTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledSubTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledDescription = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  line-height: ${themeCssVariables.text.lineHeight.md};
  margin: ${themeCssVariables.spacing[1]} 0 0;
`;

const StyledTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledTab = styled.button`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};

  &[data-active='true'] {
    background: ${themeCssVariables.color.blue};
    border-color: ${themeCssVariables.border.color.blue};
    color: ${themeCssVariables.font.color.inverted};
  }
`;

const StyledContentGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: 340px minmax(0, 1fr) 360px;

  @media (max-width: 1280px) {
    grid-template-columns: 1fr;
  }
`;

const StyledList = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledListItem = styled.button`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: grid;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[3]};
  text-align: left;

  &[data-active='true'] {
    background: ${themeCssVariables.background.secondary};
    border-color: ${themeCssVariables.border.color.medium};
  }
`;

const StyledMeta = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledStatus = styled.span<{ status: WebsiteBinding['status'] }>`
  color: ${({ status }) =>
    status === 'bound'
      ? themeCssVariables.snackBar.success.color
      : themeCssVariables.font.color.secondary};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledInquiryStatus = styled.span<{ status: WebsiteInquiry['inquiryStatus'] }>`
  color: ${({ status }) =>
    status === 'accepted'
      ? themeCssVariables.snackBar.success.color
      : status === 'blocked'
        ? themeCssVariables.snackBar.error.color
        : themeCssVariables.font.color.secondary};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;

  th,
  td {
    border-bottom: 1px solid ${themeCssVariables.border.color.light};
    padding: ${themeCssVariables.spacing[3]};
    text-align: left;
    vertical-align: top;
  }

  th {
    color: ${themeCssVariables.font.color.light};
    font-size: ${themeCssVariables.font.size.sm};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

const StyledForm = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledField = styled.label`
  display: grid;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledChoiceGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  max-height: 220px;
  overflow: auto;
`;

const StyledLabel = styled.span`
  color: ${themeCssVariables.font.color.light};
  font-size: ${themeCssVariables.font.size.sm};
`;

const inputStyles = `
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  min-height: 36px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledInput = styled.input`
  ${inputStyles}
`;

const StyledSelect = styled.select`
  ${inputStyles}
`;

const StyledCheckbox = styled.label`
  align-items: center;
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledToolbar = styled.div`
  align-items: end;
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(220px, 1fr) 180px 120px auto;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const StyledPagination = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledBulkBar = styled.div`
  align-items: end;
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: auto minmax(160px, 220px) minmax(160px, 220px) auto;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const StyledTableEditor = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[2]};
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  padding: ${themeCssVariables.spacing[5]} 0;
  text-align: center;
`;

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString('zh-CN') : '-';

const splitList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const joinList = (value: string[] | undefined) => (value ?? []).join(', ');

const toWebsiteFormState = (websiteBinding: WebsiteBinding): WebsiteFormState => ({
  websiteName: websiteBinding.websiteName,
  websiteUrl: websiteBinding.websiteUrl,
  provider: websiteBinding.provider,
  status: websiteBinding.status,
  autoBindForm: websiteBinding.metadataJson?.autoBindForm ?? true,
  notificationChannels: joinList(
    websiteBinding.metadataJson?.notificationChannels ?? ['system'],
  ),
  notificationRecipients: joinList(
    websiteBinding.metadataJson?.notificationRecipients ?? [],
  ),
  webhookSecret: '',
});

const toAssignmentRuleFormState = (
  rule: AssignmentRule,
): AssignmentRuleFormState => ({
  ruleName: rule.ruleName,
  assignmentType: rule.assignmentType,
  assigneeIds: rule.assigneeIds,
  departmentIds: joinList(rule.departmentIds),
  country: rule.conditionJson?.country ?? '',
  sourcePage: rule.conditionJson?.sourcePage ?? '',
  enabled: rule.enabled,
  sortOrder: rule.sortOrder,
});

const getPayloadText = (
  payloadJson: Record<string, unknown>,
  key: string,
  fallback = '-',
) => {
  const value = payloadJson[key];

  return value === undefined || value === null || String(value).trim() === ''
    ? fallback
    : String(value);
};

const formatInquiryStatus = (status: WebsiteInquiry['inquiryStatus']) => {
  const labels: Record<WebsiteInquiry['inquiryStatus'], string> = {
    accepted: '已接收',
    blocked: '已阻断',
    duplicate: '重复',
    pending_assignment: '待分配',
  };

  return labels[status];
};

const inquiryStatusOptions: {
  label: string;
  value: WebsiteInquiry['inquiryStatus'];
}[] = [
  { label: '已接收', value: 'accepted' },
  { label: '待分配', value: 'pending_assignment' },
  { label: '已阻断', value: 'blocked' },
  { label: '重复', value: 'duplicate' },
];

const formatWorkspaceMemberLabel = (workspaceMember: PartialWorkspaceMember) => {
  const fullName = `${workspaceMember.name.firstName ?? ''} ${workspaceMember.name.lastName ?? ''}`.trim();

  return fullName || workspaceMember.userEmail;
};

const formatCrmAction = (action: InquiryCrmRecord['action'] | undefined) => {
  if (!action) {
    return '-';
  }

  const labels: Record<InquiryCrmRecord['action'], string> = {
    blocked: '未写入',
    created_person: '新建客户',
    reused_person: '复用客户',
    restored_person: '恢复客户',
    skipped_no_email: '缺少邮箱',
  };

  return labels[action];
};

const generateWebhookSecret = () =>
  `ent_${crypto.randomUUID().replaceAll('-', '')}`;

export const EnterpriseIndependentStationPage = () => {
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const { hasEnterprisePermission } = useEnterprisePermissions();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const currentWorkspaceMembers = useAtomStateValue(currentWorkspaceMembersState);
  const [activeTab, setActiveTab] = useState<'websites' | 'notifications'>(
    'websites',
  );
  const [websiteBindings, setWebsiteBindings] = useState<WebsiteBinding[]>([]);
  const [selectedWebsiteBindingId, setSelectedWebsiteBindingId] = useState<
    string | null
  >(null);
  const [websiteForm, setWebsiteForm] = useState<WebsiteFormState | null>(null);
  const [formMappings, setFormMappings] = useState<FormMapping[]>([]);
  const [assignmentRules, setAssignmentRules] = useState<AssignmentRule[]>([]);
  const [websiteInquiries, setWebsiteInquiries] = useState<WebsiteInquiry[]>([]);
  const [websiteInquiryTotal, setWebsiteInquiryTotal] = useState(0);
  const [inquiryDrafts, setInquiryDrafts] = useState<
    Record<string, InquiryDraft>
  >({});
  const [selectedInquiryIds, setSelectedInquiryIds] = useState<string[]>([]);
  const [bulkInquiryStatus, setBulkInquiryStatus] = useState('');
  const [bulkAssignedTo, setBulkAssignedTo] = useState('');
  const [inquiryFilters, setInquiryFilters] = useState<InquiryFilters>({
    page: 1,
    pageSize: 20,
    search: '',
    statuses: [],
  });
  const [assignmentRuleForm, setAssignmentRuleForm] =
    useState<AssignmentRuleFormState | null>(null);
  const [newWebsiteName, setNewWebsiteName] = useState('');
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const canBindWebsite = hasEnterprisePermission(
    enterprisePermissionCodes.independentStationBind,
  );
  const canUnbindWebsite = hasEnterprisePermission(
    enterprisePermissionCodes.independentStationUnbind,
  );
  const canUpdateWebsite = hasEnterprisePermission(
    enterprisePermissionCodes.independentStationUpdate,
  );

  const selectedWebsiteBinding = useMemo(
    () =>
      websiteBindings.find(
        (websiteBinding) => websiteBinding.id === selectedWebsiteBindingId,
      ) ?? null,
    [selectedWebsiteBindingId, websiteBindings],
  );

  const selectedAssignmentRule = assignmentRules[0] ?? null;
  const totalInquiryPages = Math.max(
    1,
    Math.ceil(websiteInquiryTotal / inquiryFilters.pageSize),
  );
  const workspaceMemberOptions = useMemo<WorkspaceMemberOption[]>(
    () =>
      currentWorkspaceMembers.map((workspaceMember) => ({
        label: formatWorkspaceMemberLabel(workspaceMember),
        value: workspaceMember.id,
      })),
    [currentWorkspaceMembers],
  );
  const assignmentRuleNeedsAssignees =
    assignmentRuleForm?.assignmentType === 'fixed_user' ||
    assignmentRuleForm?.assignmentType === 'round_robin';

  const loadWebsiteBindings = useCallback(async () => {
    const response = await enterpriseApiRequest(
      '/api/enterprise/independent-stations',
      { credentials: 'include' },
    );

    if (!response.ok) {
      throw new Error('Failed to load independent station bindings');
    }

    const data = (await response.json()) as WebsiteBinding[];

    setWebsiteBindings(data);
    setSelectedWebsiteBindingId((currentWebsiteBindingId) =>
      data.some((websiteBinding) => websiteBinding.id === currentWebsiteBindingId)
        ? currentWebsiteBindingId
        : data[0]?.id ?? null,
    );
  }, [enterpriseApiRequest]);

  const loadWebsiteDetails = useCallback(async () => {
    if (!selectedWebsiteBindingId) {
      setFormMappings([]);
      setAssignmentRules([]);
      setWebsiteInquiries([]);
      setWebsiteInquiryTotal(0);
      setInquiryDrafts({});
      setSelectedInquiryIds([]);
      setBulkInquiryStatus('');
      setBulkAssignedTo('');

      return;
    }

    const inquirySearchParams = new URLSearchParams({
      page: inquiryFilters.page.toString(),
      pageSize: inquiryFilters.pageSize.toString(),
    });

    if (inquiryFilters.search.trim()) {
      inquirySearchParams.set('search', inquiryFilters.search.trim());
    }

    if (inquiryFilters.statuses.length > 0) {
      inquirySearchParams.set('statuses', inquiryFilters.statuses.join(','));
    }

    const [formMappingsResponse, assignmentRulesResponse, inquiriesResponse] =
      await Promise.all([
        enterpriseApiRequest(
          `/api/enterprise/independent-stations/${selectedWebsiteBindingId}/form-mappings`,
          { credentials: 'include' },
        ),
        enterpriseApiRequest(
          `/api/enterprise/independent-stations/${selectedWebsiteBindingId}/assignment-rules`,
          { credentials: 'include' },
        ),
        enterpriseApiRequest(
          `/api/enterprise/independent-stations/${selectedWebsiteBindingId}/inquiries?${inquirySearchParams.toString()}`,
          { credentials: 'include' },
        ),
      ]);

    if (
      !formMappingsResponse.ok ||
      !assignmentRulesResponse.ok ||
      !inquiriesResponse.ok
    ) {
      throw new Error('Failed to load independent station details');
    }

    setFormMappings((await formMappingsResponse.json()) as FormMapping[]);
    setAssignmentRules((await assignmentRulesResponse.json()) as AssignmentRule[]);
    const inquiryResponse =
      (await inquiriesResponse.json()) as WebsiteInquiryListResponse;

    setWebsiteInquiries(inquiryResponse.items);
    setWebsiteInquiryTotal(inquiryResponse.total);
    setInquiryDrafts(
      Object.fromEntries(
        inquiryResponse.items.map((inquiry) => [
          inquiry.id,
          {
            assignedTo: inquiry.assignedTo ?? '',
            inquiryStatus: inquiry.inquiryStatus,
          },
        ]),
      ),
    );
    setSelectedInquiryIds([]);
    setBulkInquiryStatus('');
    setBulkAssignedTo('');
  }, [enterpriseApiRequest, inquiryFilters, selectedWebsiteBindingId]);

  useEffect(() => {
    loadWebsiteBindings().catch(() =>
      enqueueErrorSnackBar({ message: '无法加载独立站绑定' }),
    );
  }, [enqueueErrorSnackBar, loadWebsiteBindings]);

  useEffect(() => {
    loadWebsiteDetails().catch(() =>
      enqueueErrorSnackBar({ message: '无法加载独立站配置' }),
    );
  }, [enqueueErrorSnackBar, loadWebsiteDetails]);

  useEffect(() => {
    setWebsiteForm(
      selectedWebsiteBinding ? toWebsiteFormState(selectedWebsiteBinding) : null,
    );
  }, [selectedWebsiteBinding]);

  useEffect(() => {
    setAssignmentRuleForm(
      selectedAssignmentRule
        ? toAssignmentRuleFormState(selectedAssignmentRule)
        : null,
    );
  }, [selectedAssignmentRule]);

  useEffect(() => {
    setInquiryFilters((currentFilters) => ({
      ...currentFilters,
      page: 1,
    }));
  }, [selectedWebsiteBindingId]);

  const createWebsiteBinding = async () => {
    if (!canBindWebsite) {
      enqueueErrorSnackBar({ message: '没有绑定独立站的权限' });

      return;
    }

    if (!newWebsiteName.trim() || !newWebsiteUrl.trim()) {
      enqueueErrorSnackBar({ message: '请输入网站名称和网址' });

      return;
    }

    setIsSaving(true);

    try {
      const response = await enterpriseApiRequest(
        '/api/enterprise/independent-stations',
        {
          body: JSON.stringify({
            websiteName: newWebsiteName,
            websiteUrl: newWebsiteUrl,
            provider: 'okki_shops',
            metadataJson: {
              autoBindForm: true,
              notificationChannels: ['system'],
              notificationRecipients: [],
            },
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to create independent station binding');
      }

      setNewWebsiteName('');
      setNewWebsiteUrl('');
      enqueueSuccessSnackBar({ message: '独立站已绑定' });
      await loadWebsiteBindings();
    } catch {
      enqueueErrorSnackBar({ message: '绑定独立站失败' });
    } finally {
      setIsSaving(false);
    }
  };

  const saveWebsiteBinding = async () => {
    if (!canUpdateWebsite) {
      enqueueErrorSnackBar({ message: '没有保存独立站配置的权限' });

      return;
    }

    if (!selectedWebsiteBinding || !websiteForm) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/independent-stations/${selectedWebsiteBinding.id}`,
        {
          body: JSON.stringify({
            websiteName: websiteForm.websiteName,
            websiteUrl: websiteForm.websiteUrl,
            provider: websiteForm.provider,
            status: websiteForm.status,
            metadataJson: {
              autoBindForm: websiteForm.autoBindForm,
              notificationChannels: splitList(websiteForm.notificationChannels),
              notificationRecipients: splitList(
                websiteForm.notificationRecipients,
              ),
              ...(websiteForm.webhookSecret.trim()
                ? { webhookSecret: websiteForm.webhookSecret.trim() }
                : {}),
            },
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PATCH',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to save independent station binding');
      }

      enqueueSuccessSnackBar({ message: '独立站配置已保存' });
      await loadWebsiteBindings();
    } catch {
      enqueueErrorSnackBar({ message: '保存独立站配置失败' });
    } finally {
      setIsSaving(false);
    }
  };

  const unbindWebsite = async () => {
    if (!canUnbindWebsite) {
      enqueueErrorSnackBar({ message: '没有解绑独立站的权限' });

      return;
    }

    if (!selectedWebsiteBinding) {
      return;
    }

    if (!window.confirm(`确认解绑 ${selectedWebsiteBinding.websiteName}？`)) {
      return;
    }

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/independent-stations/${selectedWebsiteBinding.id}`,
        { credentials: 'include', method: 'DELETE' },
      );

      if (!response.ok) {
        throw new Error('Failed to unbind independent station');
      }

      enqueueSuccessSnackBar({ message: '独立站已解绑' });
      await loadWebsiteBindings();
    } catch {
      enqueueErrorSnackBar({ message: '解绑独立站失败' });
    }
  };

  const saveFormMappings = async () => {
    if (!canUpdateWebsite) {
      enqueueErrorSnackBar({ message: '没有保存表单字段映射的权限' });

      return;
    }

    if (!selectedWebsiteBinding) {
      return;
    }

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/independent-stations/${selectedWebsiteBinding.id}/form-mappings`,
        {
          body: JSON.stringify({ mappings: formMappings }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PUT',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to save form mappings');
      }

      enqueueSuccessSnackBar({ message: '表单字段映射已保存' });
      await loadWebsiteDetails();
    } catch {
      enqueueErrorSnackBar({ message: '保存表单字段映射失败' });
    }
  };

  const saveAssignmentRules = async () => {
    if (!canUpdateWebsite) {
      enqueueErrorSnackBar({ message: '没有保存询盘分配规则的权限' });

      return;
    }

    if (!selectedWebsiteBinding || !assignmentRuleForm) {
      return;
    }

    if (assignmentRuleNeedsAssignees && assignmentRuleForm.assigneeIds.length === 0) {
      enqueueErrorSnackBar({ message: '请至少选择一位负责人' });

      return;
    }

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/independent-stations/${selectedWebsiteBinding.id}/assignment-rules`,
        {
          body: JSON.stringify({
            rules: [
              {
                ruleName: assignmentRuleForm.ruleName,
                assignmentType: assignmentRuleForm.assignmentType,
                assigneeIds: assignmentRuleForm.assigneeIds,
                departmentIds: splitList(assignmentRuleForm.departmentIds),
                conditionJson: {
                  country: assignmentRuleForm.country,
                  sourcePage: assignmentRuleForm.sourcePage,
                },
                enabled: assignmentRuleForm.enabled,
                sortOrder: assignmentRuleForm.sortOrder,
              },
            ],
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PUT',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to save assignment rules');
      }

      enqueueSuccessSnackBar({ message: '询盘分配规则已保存' });
      await loadWebsiteDetails();
    } catch {
      enqueueErrorSnackBar({ message: '保存询盘分配规则失败' });
    }
  };

  const reprocessInquiry = async (inquiryId: string) => {
    if (!canUpdateWebsite) {
      enqueueErrorSnackBar({ message: '没有重处理独立站询盘的权限' });

      return;
    }

    if (!selectedWebsiteBinding) {
      return;
    }

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/independent-stations/${selectedWebsiteBinding.id}/inquiries/${inquiryId}/reprocess`,
        {
          credentials: 'include',
          method: 'POST',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to reprocess independent station inquiry');
      }

      enqueueSuccessSnackBar({ message: '询盘已重新处理' });
      await loadWebsiteDetails();
    } catch {
      enqueueErrorSnackBar({ message: '重新处理询盘失败' });
    }
  };

  const reprocessIssueInquiries = async () => {
    if (!canUpdateWebsite) {
      enqueueErrorSnackBar({ message: '没有批量重处理独立站询盘的权限' });

      return;
    }

    if (!selectedWebsiteBinding) {
      return;
    }

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/independent-stations/${selectedWebsiteBinding.id}/inquiries/reprocess`,
        {
          body: JSON.stringify({
            statuses: ['blocked', 'pending_assignment'],
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to reprocess independent station inquiries');
      }

      const result = (await response.json()) as { processedCount: number };

      enqueueSuccessSnackBar({
        message: `已重新处理 ${result.processedCount} 条询盘`,
      });
      await loadWebsiteDetails();
    } catch {
      enqueueErrorSnackBar({ message: '批量重新处理询盘失败' });
    }
  };

  const getInquiryDraft = (inquiry: WebsiteInquiry): InquiryDraft =>
    inquiryDrafts[inquiry.id] ?? {
      assignedTo: inquiry.assignedTo ?? '',
      inquiryStatus: inquiry.inquiryStatus,
    };

  const formatAssigneeLabel = (assignedTo: string | null) => {
    if (!assignedTo) {
      return '待分配';
    }

    return (
      workspaceMemberOptions.find(
        (workspaceMemberOption) => workspaceMemberOption.value === assignedTo,
      )?.label ?? assignedTo
    );
  };

  const isInquirySelected = (inquiryId: string) =>
    selectedInquiryIds.includes(inquiryId);

  const isCurrentPageFullySelected =
    websiteInquiries.length > 0 &&
    websiteInquiries.every((inquiry) => selectedInquiryIds.includes(inquiry.id));

  const toggleInquirySelection = (inquiryId: string) => {
    setSelectedInquiryIds((currentInquiryIds) =>
      currentInquiryIds.includes(inquiryId)
        ? currentInquiryIds.filter(
            (currentInquiryId) => currentInquiryId !== inquiryId,
          )
        : [...currentInquiryIds, inquiryId],
    );
  };

  const toggleCurrentPageSelection = () => {
    setSelectedInquiryIds((currentInquiryIds) =>
      isCurrentPageFullySelected
        ? currentInquiryIds.filter(
            (inquiryId) =>
              !websiteInquiries.some((inquiry) => inquiry.id === inquiryId),
          )
        : Array.from(
            new Set([
              ...currentInquiryIds,
              ...websiteInquiries.map((inquiry) => inquiry.id),
            ]),
          ),
    );
  };

  const updateInquiryDraft = (
    inquiry: WebsiteInquiry,
    patch: Partial<InquiryDraft>,
  ) => {
    setInquiryDrafts((currentDrafts) => ({
      ...currentDrafts,
      [inquiry.id]: {
        ...(currentDrafts[inquiry.id] ?? {
          assignedTo: inquiry.assignedTo ?? '',
          inquiryStatus: inquiry.inquiryStatus,
        }),
        ...patch,
      },
    }));
  };

  const updateInquiryPageSize = (pageSize: number) => {
    setInquiryFilters((currentFilters) => ({
      ...currentFilters,
      page: 1,
      pageSize,
    }));
  };

  const toggleAssignmentRuleAssignee = (workspaceMemberId: string) => {
    if (!assignmentRuleForm) {
      return;
    }

    setAssignmentRuleForm({
      ...assignmentRuleForm,
      assigneeIds: assignmentRuleForm.assigneeIds.includes(workspaceMemberId)
        ? assignmentRuleForm.assigneeIds.filter(
            (assigneeId) => assigneeId !== workspaceMemberId,
          )
        : [...assignmentRuleForm.assigneeIds, workspaceMemberId],
    });
  };

  const saveBatchInquiryUpdate = async () => {
    if (!canUpdateWebsite) {
      enqueueErrorSnackBar({ message: '没有批量处置独立站询盘的权限' });

      return;
    }

    if (!selectedWebsiteBinding || selectedInquiryIds.length === 0) {
      return;
    }

    const normalizedAssignedTo =
      bulkAssignedTo === '__unassigned__'
          ? null
          : bulkAssignedTo || undefined;
    const normalizedInquiryStatus = bulkInquiryStatus || undefined;

    if (
      normalizedAssignedTo === undefined &&
      normalizedInquiryStatus === undefined
    ) {
      enqueueErrorSnackBar({ message: '请先选择批量负责人或批量状态' });

      return;
    }

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/independent-stations/${selectedWebsiteBinding.id}/inquiries`,
        {
          body: JSON.stringify({
            inquiryIds: selectedInquiryIds,
            inquiryStatus: normalizedInquiryStatus,
            assignedTo: normalizedAssignedTo,
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PATCH',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update independent station inquiries');
      }

      enqueueSuccessSnackBar({
        message: `已批量更新 ${selectedInquiryIds.length} 条询盘`,
      });
      await loadWebsiteDetails();
    } catch {
      enqueueErrorSnackBar({ message: '批量保存询盘处置失败' });
    }
  };

  const saveInquiryDraft = async (inquiry: WebsiteInquiry) => {
    if (!canUpdateWebsite) {
      enqueueErrorSnackBar({ message: '没有处置独立站询盘的权限' });

      return;
    }

    if (!selectedWebsiteBinding) {
      return;
    }

    const inquiryDraft = getInquiryDraft(inquiry);

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/independent-stations/${selectedWebsiteBinding.id}/inquiries/${inquiry.id}`,
        {
          body: JSON.stringify({
            assignedTo: inquiryDraft.assignedTo.trim() || null,
            inquiryStatus: inquiryDraft.inquiryStatus,
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PATCH',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update independent station inquiry');
      }

      enqueueSuccessSnackBar({ message: '询盘处置已更新' });
      await loadWebsiteDetails();
    } catch {
      enqueueErrorSnackBar({ message: '保存询盘处置失败' });
    }
  };

  const updateInquirySearch = (search: string) => {
    setInquiryFilters((currentFilters) => ({
      ...currentFilters,
      page: 1,
      search,
    }));
  };

  const updateInquiryStatusFilter = (value: string) => {
    setInquiryFilters((currentFilters) => ({
      ...currentFilters,
      page: 1,
      statuses: value
        ? (value.split(',') as WebsiteInquiry['inquiryStatus'][])
        : [],
    }));
  };

  const hasInquiryDraftChanges = (inquiry: WebsiteInquiry) => {
    const inquiryDraft = getInquiryDraft(inquiry);

    return (
      inquiryDraft.assignedTo.trim() !== (inquiry.assignedTo ?? '') ||
      inquiryDraft.inquiryStatus !== inquiry.inquiryStatus
    );
  };

  const goToInquiryPage = (page: number) => {
    setInquiryFilters((currentFilters) => ({
      ...currentFilters,
      page: Math.min(Math.max(page, 1), totalInquiryPages),
    }));
  };

  const addFormMapping = () => {
    if (!canUpdateWebsite) {
      enqueueErrorSnackBar({ message: '没有维护表单字段映射的权限' });

      return;
    }

    setFormMappings([
      ...formMappings,
      { externalFieldCode: '', crmFieldCode: '', required: false },
    ]);
  };

  const updateFormMapping = (
    index: number,
    patch: Partial<FormMapping>,
  ) => {
    setFormMappings(
      formMappings.map((mapping, mappingIndex) =>
        mappingIndex === index ? { ...mapping, ...patch } : mapping,
      ),
    );
  };

  return (
    <EnterprisePermissionGuard
      requiredPermission={enterprisePermissionCodes.independentStationRead}
    >
      <EnterpriseShell title="企业管理 / 独立站管理" sidebar={buildSidebar()}>
        <StyledGrid>
          <StyledPanel>
            <StyledHeader>
              <div>
                <StyledTitle>独立站管理</StyledTitle>
                <StyledDescription>
                  管理 OKKI Shops 等独立站绑定、询盘表单字段映射、通知范围和分配规则。入站 webhook 会先落到企业管理询盘记录，再按规则进入负责人或待分配池。
                </StyledDescription>
              </div>
              <StyledActionRow>
                <Button title="查看线索模块" />
                <Button title="查看网站聊天" />
              </StyledActionRow>
            </StyledHeader>
            <StyledTabs>
              <StyledTab
                data-active={activeTab === 'websites'}
                onClick={() => setActiveTab('websites')}
                type="button"
              >
                绑定网站
              </StyledTab>
              <StyledTab
                data-active={activeTab === 'notifications'}
                onClick={() => setActiveTab('notifications')}
                type="button"
              >
                询盘通知设置
              </StyledTab>
            </StyledTabs>
          </StyledPanel>

          <StyledContentGrid>
            <StyledPanel>
              <StyledSubTitle>网站列表</StyledSubTitle>
              <StyledForm>
                <StyledField>
                  <StyledLabel>网站名称</StyledLabel>
                  <StyledInput
                    onChange={(event) => setNewWebsiteName(event.target.value)}
                    placeholder="例如 OKKI Shops 官网"
                    value={newWebsiteName}
                  />
                </StyledField>
                <StyledField>
                  <StyledLabel>网站地址</StyledLabel>
                  <StyledInput
                    onChange={(event) => setNewWebsiteUrl(event.target.value)}
                    placeholder="https://www.example.com"
                    value={newWebsiteUrl}
                  />
                </StyledField>
                <Button
                  accent="blue"
                  disabled={isSaving || !canBindWebsite}
                  title="绑定新网站"
                  onClick={() => void createWebsiteBinding()}
                />
              </StyledForm>
              <StyledList>
                {websiteBindings.map((websiteBinding) => (
                  <StyledListItem
                    data-active={websiteBinding.id === selectedWebsiteBindingId}
                    key={websiteBinding.id}
                    onClick={() => setSelectedWebsiteBindingId(websiteBinding.id)}
                    type="button"
                  >
                    <strong>{websiteBinding.websiteName}</strong>
                    <StyledMeta>{websiteBinding.websiteUrl}</StyledMeta>
                    <StyledMeta>
                      <StyledStatus status={websiteBinding.status}>
                        {websiteBinding.status}
                      </StyledStatus>{' '}
                      · {websiteBinding.provider} · {formatDate(websiteBinding.boundAt)}
                    </StyledMeta>
                  </StyledListItem>
                ))}
              </StyledList>
              {websiteBindings.length === 0 && (
                <StyledEmpty>暂无绑定网站，请先新增独立站。</StyledEmpty>
              )}
            </StyledPanel>

            <StyledGrid>
              <StyledPanel>
                <StyledSubTitle>
                  {activeTab === 'websites' ? '绑定网站设置' : '通知设置'}
                </StyledSubTitle>
                {websiteForm ? (
                  <StyledForm>
                    <StyledField>
                      <StyledLabel>网站名称</StyledLabel>
                      <StyledInput
                        onChange={(event) =>
                          setWebsiteForm({
                            ...websiteForm,
                            websiteName: event.target.value,
                          })
                        }
                        value={websiteForm.websiteName}
                      />
                    </StyledField>
                    <StyledField>
                      <StyledLabel>网站地址</StyledLabel>
                      <StyledInput
                        onChange={(event) =>
                          setWebsiteForm({
                            ...websiteForm,
                            websiteUrl: event.target.value,
                          })
                        }
                        value={websiteForm.websiteUrl}
                      />
                    </StyledField>
                    <StyledField>
                      <StyledLabel>绑定状态</StyledLabel>
                      <StyledSelect
                        onChange={(event) =>
                          setWebsiteForm({
                            ...websiteForm,
                            status: event.target.value as WebsiteBinding['status'],
                          })
                        }
                        value={websiteForm.status}
                      >
                        <option value="bound">已绑定</option>
                        <option value="paused">暂停接收</option>
                        <option value="unbound">已解绑</option>
                      </StyledSelect>
                    </StyledField>
                    <StyledCheckbox>
                      <input
                        checked={websiteForm.autoBindForm}
                        onChange={(event) =>
                          setWebsiteForm({
                            ...websiteForm,
                            autoBindForm: event.target.checked,
                          })
                        }
                        type="checkbox"
                      />
                      自动绑定询盘表单并写入来源
                    </StyledCheckbox>
                    <StyledField>
                      <StyledLabel>Webhook 密钥</StyledLabel>
                      <StyledInput
                        onChange={(event) =>
                          setWebsiteForm({
                            ...websiteForm,
                            webhookSecret: event.target.value,
                          })
                        }
                        placeholder={
                          selectedWebsiteBinding?.metadataJson?.webhookSecretHint
                            ? `已设置：${selectedWebsiteBinding.metadataJson.webhookSecretHint}`
                            : '未设置，建议生成后保存'
                        }
                        value={websiteForm.webhookSecret}
                      />
                      <StyledMeta>
                        保存后后端只保留密钥哈希；独立站推送需携带请求头
                        x-enterprise-webhook-secret。
                      </StyledMeta>
                    </StyledField>
                    <StyledActionRow>
                      <Button
                        title="生成密钥"
                        onClick={() =>
                          setWebsiteForm({
                            ...websiteForm,
                            webhookSecret: generateWebhookSecret(),
                          })
                        }
                      />
                    </StyledActionRow>
                    {activeTab === 'notifications' && (
                      <>
                        <StyledField>
                          <StyledLabel>通知渠道，逗号分隔</StyledLabel>
                          <StyledInput
                            onChange={(event) =>
                              setWebsiteForm({
                                ...websiteForm,
                                notificationChannels: event.target.value,
                              })
                            }
                            placeholder="system,email"
                            value={websiteForm.notificationChannels}
                          />
                        </StyledField>
                        <StyledField>
                          <StyledLabel>通知对象 ID，逗号分隔</StyledLabel>
                          <StyledInput
                            onChange={(event) =>
                              setWebsiteForm({
                                ...websiteForm,
                                notificationRecipients: event.target.value,
                              })
                            }
                            placeholder="workspaceMemberId 或 departmentId"
                            value={websiteForm.notificationRecipients}
                          />
                        </StyledField>
                      </>
                    )}
                    <StyledActionRow>
                      <Button
                        accent="blue"
                        disabled={isSaving || !canUpdateWebsite}
                        title={isSaving ? '保存中...' : '保存网站配置'}
                        onClick={() => void saveWebsiteBinding()}
                      />
                      <Button
                        disabled={!canUnbindWebsite}
                        title="解绑网站"
                        onClick={() => void unbindWebsite()}
                      />
                    </StyledActionRow>
                  </StyledForm>
                ) : (
                  <StyledEmpty>选择一个绑定网站后配置。</StyledEmpty>
                )}
              </StyledPanel>

              <StyledPanel>
                <StyledHeader>
                  <StyledSubTitle>询盘表单字段映射</StyledSubTitle>
                  <Button
                    disabled={!canUpdateWebsite}
                    title="新增映射"
                    onClick={addFormMapping}
                  />
                </StyledHeader>
                <StyledTable>
                  <thead>
                    <tr>
                      <th>表单字段</th>
                      <th>CRM 字段</th>
                      <th>必填</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formMappings.map((mapping, index) => (
                      <tr key={`${mapping.id ?? 'new'}-${index}`}>
                        <td>
                          <StyledInput
                            onChange={(event) =>
                              updateFormMapping(index, {
                                externalFieldCode: event.target.value,
                              })
                            }
                            value={mapping.externalFieldCode}
                          />
                        </td>
                        <td>
                          <StyledInput
                            onChange={(event) =>
                              updateFormMapping(index, {
                                crmFieldCode: event.target.value,
                              })
                            }
                            value={mapping.crmFieldCode}
                          />
                        </td>
                        <td>
                          <input
                            checked={mapping.required}
                            onChange={(event) =>
                              updateFormMapping(index, {
                                required: event.target.checked,
                              })
                            }
                            type="checkbox"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </StyledTable>
                <Button
                  disabled={!canUpdateWebsite}
                  title="保存字段映射"
                  onClick={() => void saveFormMappings()}
                />
              </StyledPanel>
            </StyledGrid>

            <StyledPanel>
              <StyledSubTitle>询盘分配规则</StyledSubTitle>
              {assignmentRuleForm ? (
                <StyledForm>
                  <StyledField>
                    <StyledLabel>规则名称</StyledLabel>
                    <StyledInput
                      onChange={(event) =>
                        setAssignmentRuleForm({
                          ...assignmentRuleForm,
                          ruleName: event.target.value,
                        })
                      }
                      value={assignmentRuleForm.ruleName}
                    />
                  </StyledField>
                  <StyledField>
                    <StyledLabel>分配类型</StyledLabel>
                    <StyledSelect
                      onChange={(event) =>
                        setAssignmentRuleForm({
                          ...assignmentRuleForm,
                          assignmentType: event.target.value,
                        })
                      }
                      value={assignmentRuleForm.assignmentType}
                    >
                      <option value="pending_pool">进入待分配池</option>
                      <option value="fixed_user">固定负责人</option>
                      <option value="round_robin">负责人轮询</option>
                      <option value="department_pool">部门池</option>
                    </StyledSelect>
                  </StyledField>
                  <StyledField>
                    <StyledLabel>负责人</StyledLabel>
                    <StyledChoiceGrid>
                      {workspaceMemberOptions.map((workspaceMemberOption) => (
                        <StyledCheckbox key={workspaceMemberOption.value}>
                          <input
                            checked={assignmentRuleForm.assigneeIds.includes(
                              workspaceMemberOption.value,
                            )}
                            onChange={() =>
                              toggleAssignmentRuleAssignee(
                                workspaceMemberOption.value,
                              )
                            }
                            type="checkbox"
                          />
                          {workspaceMemberOption.label}
                        </StyledCheckbox>
                      ))}
                    </StyledChoiceGrid>
                    <StyledMeta>
                      {assignmentRuleNeedsAssignees
                        ? `已选择 ${assignmentRuleForm.assigneeIds.length} 位负责人`
                        : '当前分配类型不会直接使用负责人'}
                    </StyledMeta>
                  </StyledField>
                  <StyledField>
                    <StyledLabel>部门 ID，逗号分隔</StyledLabel>
                    <StyledInput
                      onChange={(event) =>
                        setAssignmentRuleForm({
                          ...assignmentRuleForm,
                          departmentIds: event.target.value,
                        })
                      }
                      value={assignmentRuleForm.departmentIds}
                    />
                  </StyledField>
                  <StyledField>
                    <StyledLabel>国家条件</StyledLabel>
                    <StyledInput
                      onChange={(event) =>
                        setAssignmentRuleForm({
                          ...assignmentRuleForm,
                          country: event.target.value,
                        })
                      }
                      placeholder="为空则匹配全部"
                      value={assignmentRuleForm.country}
                    />
                  </StyledField>
                  <StyledField>
                    <StyledLabel>来源页面包含</StyledLabel>
                    <StyledInput
                      onChange={(event) =>
                        setAssignmentRuleForm({
                          ...assignmentRuleForm,
                          sourcePage: event.target.value,
                        })
                      }
                      placeholder="例如 /contact"
                      value={assignmentRuleForm.sourcePage}
                    />
                  </StyledField>
                  <StyledCheckbox>
                    <input
                      checked={assignmentRuleForm.enabled}
                      onChange={(event) =>
                        setAssignmentRuleForm({
                          ...assignmentRuleForm,
                          enabled: event.target.checked,
                        })
                      }
                      type="checkbox"
                    />
                    启用规则
                  </StyledCheckbox>
                  <Button
                    accent="blue"
                    disabled={!canUpdateWebsite}
                    title="保存分配规则"
                    onClick={() => void saveAssignmentRules()}
                  />
                </StyledForm>
              ) : (
                <StyledEmpty>选择网站后生成默认分配规则。</StyledEmpty>
              )}
              {selectedWebsiteBinding && (
                <StyledDescription>
                  Webhook 地址：/webhooks/independent-station/{selectedWebsiteBinding.id}/inquiries
                </StyledDescription>
              )}
            </StyledPanel>
          </StyledContentGrid>

          <StyledPanel>
            <StyledHeader>
              <div>
                <StyledSubTitle>最近询盘入站记录</StyledSubTitle>
                <StyledDescription>
                  展示 webhook 接收结果、字段校验、负责人分配和 CRM 客户写入动作，用于联调独立站表单与后续跟进闭环。
                </StyledDescription>
              </div>
              <StyledActionRow>
                <Button
                  disabled={!canUpdateWebsite}
                  title="批量重处理异常询盘"
                  onClick={() => void reprocessIssueInquiries()}
                />
                <Button title="刷新询盘" onClick={() => void loadWebsiteDetails()} />
              </StyledActionRow>
            </StyledHeader>
            <StyledToolbar>
              <StyledField>
                <StyledLabel>搜索询盘</StyledLabel>
                <StyledInput
                  onChange={(event) => updateInquirySearch(event.target.value)}
                  placeholder="按姓名、邮箱、公司、来源页或外部询盘号搜索"
                  value={inquiryFilters.search}
                />
              </StyledField>
              <StyledField>
                <StyledLabel>状态筛选</StyledLabel>
                <StyledSelect
                  onChange={(event) =>
                    updateInquiryStatusFilter(event.target.value)
                  }
                  value={inquiryFilters.statuses.join(',')}
                >
                  <option value="">全部状态</option>
                  {inquiryStatusOptions.map((statusOption) => (
                    <option key={statusOption.value} value={statusOption.value}>
                      {statusOption.label}
                    </option>
                  ))}
                </StyledSelect>
              </StyledField>
              <StyledField>
                <StyledLabel>每页条数</StyledLabel>
                <StyledSelect
                  onChange={(event) =>
                    updateInquiryPageSize(Number(event.target.value))
                  }
                  value={inquiryFilters.pageSize}
                >
                  {[20, 50, 100].map((pageSizeOption) => (
                    <option key={pageSizeOption} value={pageSizeOption}>
                      {pageSizeOption}
                    </option>
                  ))}
                </StyledSelect>
              </StyledField>
              <StyledMeta>
                共 {websiteInquiryTotal} 条，当前第 {inquiryFilters.page} /{' '}
                {totalInquiryPages} 页
              </StyledMeta>
            </StyledToolbar>
            {websiteInquiries.length > 0 ? (
              <>
                <StyledBulkBar>
                  <StyledCheckbox>
                    <input
                      checked={isCurrentPageFullySelected}
                      onChange={() => toggleCurrentPageSelection()}
                      type="checkbox"
                    />
                    本页全选（已选 {selectedInquiryIds.length} 条）
                  </StyledCheckbox>
                  <StyledField>
                    <StyledLabel>批量负责人</StyledLabel>
                    <StyledSelect
                      onChange={(event) => setBulkAssignedTo(event.target.value)}
                      value={bulkAssignedTo}
                    >
                      <option value="">保持不变</option>
                      <option value="__unassigned__">清空负责人</option>
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
                    <StyledLabel>批量状态</StyledLabel>
                    <StyledSelect
                      onChange={(event) => setBulkInquiryStatus(event.target.value)}
                      value={bulkInquiryStatus}
                    >
                      <option value="">保持不变</option>
                      {inquiryStatusOptions.map((statusOption) => (
                        <option key={statusOption.value} value={statusOption.value}>
                          {statusOption.label}
                        </option>
                      ))}
                    </StyledSelect>
                  </StyledField>
                  <StyledActionRow>
                    <Button
                      disabled={selectedInquiryIds.length === 0 || !canUpdateWebsite}
                      title="批量保存处置"
                      onClick={() => void saveBatchInquiryUpdate()}
                    />
                    <Button
                      disabled={selectedInquiryIds.length === 0}
                      title="清空选择"
                      onClick={() => setSelectedInquiryIds([])}
                    />
                  </StyledActionRow>
                </StyledBulkBar>
                <StyledTable>
                  <thead>
                    <tr>
                      <th>选择</th>
                      <th>客户</th>
                      <th>来源</th>
                      <th>状态</th>
                      <th>分配</th>
                      <th>CRM 写入</th>
                      <th>入站时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {websiteInquiries.map((inquiry) => (
                      <tr key={inquiry.id}>
                        <td>
                          <StyledCheckbox>
                            <input
                              checked={isInquirySelected(inquiry.id)}
                              onChange={() => toggleInquirySelection(inquiry.id)}
                              type="checkbox"
                            />
                          </StyledCheckbox>
                        </td>
                        <td>
                          <strong>{getPayloadText(inquiry.payloadJson, 'name')}</strong>
                          <StyledMeta>
                            {getPayloadText(inquiry.payloadJson, 'email')}
                          </StyledMeta>
                          <StyledMeta>
                            {getPayloadText(inquiry.payloadJson, 'company')}
                          </StyledMeta>
                        </td>
                        <td>
                          {inquiry.externalInquiryId}
                          <StyledMeta>
                            {getPayloadText(inquiry.payloadJson, 'sourcePage')}
                          </StyledMeta>
                        </td>
                        <td>
                          <StyledInquiryStatus status={inquiry.inquiryStatus}>
                            {formatInquiryStatus(inquiry.inquiryStatus)}
                          </StyledInquiryStatus>
                          {inquiry.decisionJson?.missingRequiredFields?.length ? (
                            <StyledMeta>
                              缺失字段：
                              {inquiry.decisionJson.missingRequiredFields.join(
                                ', ',
                              )}
                            </StyledMeta>
                          ) : null}
                          <StyledTableEditor>
                            <StyledSelect
                              onChange={(event) =>
                                updateInquiryDraft(inquiry, {
                                  inquiryStatus:
                                    event.target.value as WebsiteInquiry['inquiryStatus'],
                                })
                              }
                              value={getInquiryDraft(inquiry).inquiryStatus}
                            >
                              {inquiryStatusOptions.map((statusOption) => (
                                <option
                                  key={statusOption.value}
                                  value={statusOption.value}
                                >
                                  {statusOption.label}
                                </option>
                              ))}
                            </StyledSelect>
                          </StyledTableEditor>
                        </td>
                        <td>
                          {formatAssigneeLabel(inquiry.assignedTo)}
                          <StyledMeta>
                            {inquiry.decisionJson?.crmRecord?.companyId
                              ? `公司 ${inquiry.decisionJson.crmRecord.companyId}`
                              : '未关联公司'}
                          </StyledMeta>
                          <StyledTableEditor>
                            <StyledSelect
                              onChange={(event) =>
                                updateInquiryDraft(inquiry, {
                                  assignedTo: event.target.value,
                                })
                              }
                              value={getInquiryDraft(inquiry).assignedTo}
                            >
                              <option value="">待分配</option>
                              {workspaceMemberOptions.map((workspaceMemberOption) => (
                                <option
                                  key={workspaceMemberOption.value}
                                  value={workspaceMemberOption.value}
                                >
                                  {workspaceMemberOption.label}
                                </option>
                              ))}
                              {getInquiryDraft(inquiry).assignedTo &&
                              !workspaceMemberOptions.some(
                                (workspaceMemberOption) =>
                                  workspaceMemberOption.value ===
                                  getInquiryDraft(inquiry).assignedTo,
                              ) ? (
                                <option value={getInquiryDraft(inquiry).assignedTo}>
                                  {getInquiryDraft(inquiry).assignedTo}
                                </option>
                              ) : null}
                            </StyledSelect>
                          </StyledTableEditor>
                        </td>
                        <td>
                          {formatCrmAction(inquiry.decisionJson?.crmRecord?.action)}
                          <StyledMeta>
                            {inquiry.leadId
                              ? `客户 ${inquiry.leadId}`
                              : '未生成客户记录'}
                          </StyledMeta>
                          <StyledMeta>
                            {inquiry.decisionJson?.crmRecord?.noteId
                              ? `备注 ${inquiry.decisionJson.crmRecord.noteId}`
                              : '未生成备注'}
                          </StyledMeta>
                        </td>
                        <td>{formatDate(inquiry.createdAt)}</td>
                        <td>
                          <StyledActionRow>
                            <Button
                              disabled={
                                !hasInquiryDraftChanges(inquiry) || !canUpdateWebsite
                              }
                              title="保存处置"
                              onClick={() => void saveInquiryDraft(inquiry)}
                            />
                            <Button
                              disabled={!canUpdateWebsite}
                              title="重处理"
                              onClick={() => void reprocessInquiry(inquiry.id)}
                            />
                          </StyledActionRow>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </StyledTable>
                <StyledPagination>
                  <StyledMeta>
                    本页 {websiteInquiries.length} 条，累计 {websiteInquiryTotal}{' '}
                    条
                  </StyledMeta>
                  <StyledActionRow>
                    <Button
                      disabled={inquiryFilters.page <= 1}
                      title="上一页"
                      onClick={() => goToInquiryPage(inquiryFilters.page - 1)}
                    />
                    <Button
                      disabled={inquiryFilters.page >= totalInquiryPages}
                      title="下一页"
                      onClick={() => goToInquiryPage(inquiryFilters.page + 1)}
                    />
                  </StyledActionRow>
                </StyledPagination>
              </>
            ) : (
              <StyledEmpty>
                当前筛选条件下暂无询盘记录。完成独立站 webhook 联调后会显示在这里。
              </StyledEmpty>
            )}
          </StyledPanel>
        </StyledGrid>
      </EnterpriseShell>
    </EnterprisePermissionGuard>
  );
};
