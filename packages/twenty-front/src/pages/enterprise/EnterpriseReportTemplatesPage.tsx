import { useCallback, useEffect, useMemo, useState } from 'react';

import { styled } from '@linaria/react';

import { EnterprisePermissionGuard } from '@/enterprise/shared/components/EnterprisePermissionGuard';
import { EnterpriseShell } from '@/enterprise/shared/components/EnterpriseShell';
import { enterpriseNavigationGroups } from '@/enterprise/shared/constants/enterpriseNavigation';
import { useEnterpriseApiRequest } from '@/enterprise/shared/hooks/useEnterpriseApiRequest';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type EnterpriseReportTemplate = {
  id: string;
  templateName: string;
  templateCode: string;
  reportType: string;
  description: string | null;
  sectionKeys: string[];
  recipientRoleCodes: string[];
  deliveryChannel: string;
  isActive: boolean;
  isDefault: boolean;
  version: number;
  updatedAt: string;
};

type EnterpriseReportTemplateVersion = {
  id: string;
  versionNumber: number;
  createdAt: string;
  createdByWorkspaceMemberId: string | null;
  isActive: boolean;
  isDefault: boolean;
};

type EnterpriseReportTemplatePreview = {
  title: string;
  subtitle: string;
  description: string;
  recipients: string[];
  status: {
    isActive: boolean;
    isDefault: boolean;
  };
  sections: Array<{
    key: string;
    title: string;
    summary: string;
  }>;
  generatedAt: string;
};

const REPORT_TYPE_OPTIONS = ['daily', 'weekly', 'monthly', 'quarterly', 'custom'];
const DELIVERY_CHANNEL_OPTIONS = ['dashboard', 'email'];

const StyledGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledHero = styled.section`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledHeroTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledHeroText = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.md};
  line-height: ${themeCssVariables.text.lineHeight.md};
  margin: 0;
`;

const StyledWorkspace = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: minmax(0, 320px) minmax(0, 1fr) minmax(0, 360px);

  @media (max-width: 1280px) {
    grid-template-columns: 1fr;
  }
`;

const StyledPanel = styled.section`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledDescription = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledTemplateList = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledTemplateCard = styled.button<{ $active: boolean }>`
  background: ${({ $active }) =>
    $active
      ? themeCssVariables.background.transparent.light
      : themeCssVariables.background.primary};
  border: 1px solid
    ${({ $active }) =>
      $active
        ? themeCssVariables.border.color.blue
        : themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  cursor: pointer;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
  text-align: left;
`;

const StyledTemplateHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledTemplateName = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledTemplateMeta = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: ${themeCssVariables.text.lineHeight.md};
`;

const StyledBadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledBadge = styled.span<{ $tone?: 'default' | 'success' | 'warning' }>`
  background: ${({ $tone }) =>
    $tone === 'success'
      ? themeCssVariables.snackBar.success.color + '1a'
      : $tone === 'warning'
        ? themeCssVariables.color.yellow10
        : themeCssVariables.background.secondary};
  border-radius: ${themeCssVariables.border.radius.rounded};
  color: ${({ $tone }) =>
    $tone === 'success'
      ? themeCssVariables.snackBar.success.color
      : $tone === 'warning'
        ? themeCssVariables.color.yellow7
        : themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  padding: 4px 8px;
`;

const StyledForm = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledField = styled.label`
  display: grid;
  gap: ${themeCssVariables.spacing[1]};
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
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.md};
  min-height: 40px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};

  &:focus {
    border-color: ${themeCssVariables.border.color.blue};
    outline: none;
  }
`;

const StyledInput = styled.input`
  ${inputStyles}
`;

const StyledSelect = styled.select`
  ${inputStyles}
`;

const StyledTextArea = styled.textarea`
  ${inputStyles}
  min-height: 96px;
  resize: vertical;
`;

const StyledCheckbox = styled.label`
  align-items: center;
  color: ${themeCssVariables.font.color.primary};
  display: inline-flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledVersionList = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledVersionItem = styled.button<{ $active: boolean }>`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid
    ${({ $active }) =>
      $active
        ? themeCssVariables.border.color.blue
        : themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  cursor: pointer;
  display: grid;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[3]};
  text-align: left;
`;

const StyledPreviewSection = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  padding-top: ${themeCssVariables.spacing[3]};
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.md};
  padding: ${themeCssVariables.spacing[6]} 0;
  text-align: center;
`;

const StyledPreviewNotice = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[3]};
`;

const buildSidebar = () =>
  enterpriseNavigationGroups.map((section) => ({
    title: section.label,
    items: section.items.map((item) => item.label),
  }));

const normalizeTextareaList = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const defaultFormState = {
  templateName: '销售日报模板',
  templateCode: 'sales-daily',
  reportType: 'daily',
  deliveryChannel: 'dashboard',
  description: '聚焦销售动作、重点客户推进和异常提醒，给管理层一个可复核的日报骨架。',
  sectionKeysInput: 'summary\ncustomer-focus\nfollow-up-risk\nowner-progress',
  recipientRolesInput: 'sales-manager\nteam-lead',
  isActive: true,
  isDefault: true,
};

export const EnterpriseReportTemplatesPage = () => {
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const [templates, setTemplates] = useState<EnterpriseReportTemplate[]>([]);
  const [versions, setVersions] = useState<EnterpriseReportTemplateVersion[]>([]);
  const [preview, setPreview] = useState<EnterpriseReportTemplatePreview | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(
    null,
  );
  const [templateName, setTemplateName] = useState(defaultFormState.templateName);
  const [templateCode, setTemplateCode] = useState(defaultFormState.templateCode);
  const [reportType, setReportType] = useState(defaultFormState.reportType);
  const [deliveryChannel, setDeliveryChannel] = useState(defaultFormState.deliveryChannel);
  const [description, setDescription] = useState(defaultFormState.description);
  const [sectionKeysInput, setSectionKeysInput] = useState(defaultFormState.sectionKeysInput);
  const [recipientRolesInput, setRecipientRolesInput] = useState(defaultFormState.recipientRolesInput);
  const [isActive, setIsActive] = useState(defaultFormState.isActive);
  const [isDefault, setIsDefault] = useState(defaultFormState.isDefault);
  const [isSaving, setIsSaving] = useState(false);

  const sidebar = useMemo(buildSidebar, []);
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );
  const isViewingHistoricalVersion =
    selectedVersionNumber !== null &&
    selectedTemplate !== null &&
    selectedVersionNumber !== selectedTemplate.version;

  const resetForm = useCallback(() => {
    setSelectedTemplateId(null);
    setSelectedVersionNumber(null);
    setTemplateName(defaultFormState.templateName);
    setTemplateCode(defaultFormState.templateCode);
    setReportType(defaultFormState.reportType);
    setDeliveryChannel(defaultFormState.deliveryChannel);
    setDescription(defaultFormState.description);
    setSectionKeysInput(defaultFormState.sectionKeysInput);
    setRecipientRolesInput(defaultFormState.recipientRolesInput);
    setIsActive(defaultFormState.isActive);
    setIsDefault(defaultFormState.isDefault);
    setVersions([]);
    setPreview(null);
  }, []);

  const loadTemplates = useCallback(async () => {
    const response = await enterpriseApiRequest('/api/enterprise/report-templates', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load enterprise report templates');
    }

    const data = (await response.json()) as EnterpriseReportTemplate[];

    setTemplates(data);
    setSelectedTemplateId((currentValue) => currentValue ?? data[0]?.id ?? null);
  }, []);

  const loadTemplateDetails = useCallback(
    async (templateId: string) => {
      const response = await enterpriseApiRequest(
        `/api/enterprise/report-templates/${templateId}/versions`,
        {
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to load report template versions');
      }

      setVersions((await response.json()) as EnterpriseReportTemplateVersion[]);
    },
    [],
  );

  const loadTemplatePreview = useCallback(
    async (templateId: string, versionNumber?: number | null) => {
      const previewUrl =
        versionNumber === null || versionNumber === undefined
          ? `/api/enterprise/report-templates/${templateId}/preview`
          : `/api/enterprise/report-templates/${templateId}/preview?version=${versionNumber}`;
      const response = await enterpriseApiRequest(previewUrl, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load report template preview');
      }

      setPreview((await response.json()) as EnterpriseReportTemplatePreview);
    },
    [],
  );

  useEffect(() => {
    void loadTemplates().catch(() =>
      enqueueErrorSnackBar({ message: '无法加载报告模板列表' }),
    );
  }, [enqueueErrorSnackBar, loadTemplates]);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    setTemplateName(selectedTemplate.templateName);
    setTemplateCode(selectedTemplate.templateCode);
    setReportType(selectedTemplate.reportType);
    setDeliveryChannel(selectedTemplate.deliveryChannel);
    setDescription(selectedTemplate.description ?? '');
    setSectionKeysInput(selectedTemplate.sectionKeys.join('\n'));
    setRecipientRolesInput(selectedTemplate.recipientRoleCodes.join('\n'));
    setIsActive(selectedTemplate.isActive);
    setIsDefault(selectedTemplate.isDefault);

    void loadTemplateDetails(selectedTemplate.id).catch(() =>
      enqueueErrorSnackBar({ message: '无法加载模板版本记录' }),
    );
  }, [enqueueErrorSnackBar, loadTemplateDetails, selectedTemplate]);

  useEffect(() => {
    if (!selectedTemplateId) {
      return;
    }

    void loadTemplatePreview(
      selectedTemplateId,
      selectedVersionNumber,
    ).catch(() =>
      enqueueErrorSnackBar({ message: '无法加载模板预览' }),
    );
  }, [
    enqueueErrorSnackBar,
    loadTemplatePreview,
    selectedTemplateId,
    selectedVersionNumber,
  ]);

  const saveTemplate = async () => {
    setIsSaving(true);

    try {
      const payload = {
        templateName,
        templateCode,
        reportType,
        deliveryChannel,
        description,
        sectionKeys: normalizeTextareaList(sectionKeysInput),
        recipientRoleCodes: normalizeTextareaList(recipientRolesInput),
        isActive,
        isDefault,
      };
      const response = await enterpriseApiRequest(
        selectedTemplateId
          ? `/api/enterprise/report-templates/${selectedTemplateId}`
          : '/api/enterprise/report-templates',
        {
          method: selectedTemplateId ? 'PUT' : 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to save enterprise report template');
      }

      const savedTemplate = (await response.json()) as EnterpriseReportTemplate;

      enqueueSuccessSnackBar({
        message: selectedTemplateId ? '模板已更新' : '模板已创建',
      });
      setSelectedTemplateId(savedTemplate.id);
      setSelectedVersionNumber(null);
      await loadTemplates();
      await Promise.all([
        loadTemplateDetails(savedTemplate.id),
        loadTemplatePreview(savedTemplate.id),
      ]);
    } catch {
      enqueueErrorSnackBar({ message: '保存报告模板失败' });
    } finally {
      setIsSaving(false);
    }
  };

  const mutateTemplateState = async (
    templateId: string,
    action: 'set-default' | 'activate' | 'deactivate',
    successMessage: string,
  ) => {
    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/report-templates/${templateId}/${action}`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to change template state');
      }

      enqueueSuccessSnackBar({ message: successMessage });
      setSelectedVersionNumber(null);
      await loadTemplates();
      await Promise.all([
        loadTemplateDetails(templateId),
        loadTemplatePreview(templateId),
      ]);
    } catch {
      enqueueErrorSnackBar({ message: '模板状态更新失败' });
    }
  };

  return (
    <EnterprisePermissionGuard>
      <EnterpriseShell title="报告模板" sidebar={sidebar}>
        <StyledGrid>
          <StyledHero>
            <StyledHeroTitle>企业管理报告模板中心</StyledHeroTitle>
            <StyledHeroText>
              当前版本支持模板版本记录、模板预览、启停控制和默认模板策略。后续报告生成器和定时调度将直接依赖这里的结构定义。
            </StyledHeroText>
          </StyledHero>

          <StyledWorkspace>
            <StyledPanel>
              <div>
                <StyledTitle>模板列表</StyledTitle>
                <StyledDescription>
                  每个报告类型只保留一个默认模板。默认模板必须处于启用状态。
                </StyledDescription>
              </div>

              <Button title="新建模板" onClick={resetForm} />

              {templates.length === 0 ? (
                <StyledEmpty>还没有模板，先创建第一份报告模板。</StyledEmpty>
              ) : (
                <StyledTemplateList>
                  {templates.map((template) => (
                    <StyledTemplateCard
                      key={template.id}
                      type="button"
                      $active={template.id === selectedTemplateId}
                      onClick={() => {
                        setSelectedTemplateId(template.id);
                        setSelectedVersionNumber(null);
                      }}
                    >
                      <StyledTemplateHeader>
                        <StyledTemplateName>{template.templateName}</StyledTemplateName>
                        <StyledBadge $tone={template.isActive ? 'success' : 'warning'}>
                          {template.isActive ? '启用中' : '已停用'}
                        </StyledBadge>
                      </StyledTemplateHeader>
                      <StyledBadgeRow>
                        {template.isDefault ? <StyledBadge>默认模板</StyledBadge> : null}
                        <StyledBadge>v{template.version}</StyledBadge>
                        <StyledBadge>{template.reportType}</StyledBadge>
                      </StyledBadgeRow>
                      <StyledTemplateMeta>
                        代码：{template.templateCode}
                        <br />
                        更新时间：{new Date(template.updatedAt).toLocaleString()}
                      </StyledTemplateMeta>
                    </StyledTemplateCard>
                  ))}
                </StyledTemplateList>
              )}
            </StyledPanel>

            <StyledPanel>
              <div>
                <StyledTitle>{selectedTemplateId ? '编辑模板' : '新建模板'}</StyledTitle>
                <StyledDescription>
                  这里配置模板骨架，不直接生成真实数据。版本记录会自动在每次变更时沉淀下来。
                </StyledDescription>
              </div>

              <StyledForm>
                <StyledField>
                  <StyledLabel>模板名称</StyledLabel>
                  <StyledInput
                    value={templateName}
                    onChange={(event) => setTemplateName(event.target.value)}
                  />
                </StyledField>

                <StyledField>
                  <StyledLabel>模板编码</StyledLabel>
                  <StyledInput
                    value={templateCode}
                    disabled={selectedTemplateId !== null}
                    onChange={(event) => setTemplateCode(event.target.value)}
                  />
                </StyledField>

                <StyledField>
                  <StyledLabel>报告类型</StyledLabel>
                  <StyledSelect
                    value={reportType}
                    onChange={(event) => setReportType(event.target.value)}
                  >
                    {REPORT_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </StyledSelect>
                </StyledField>

                <StyledField>
                  <StyledLabel>投递渠道</StyledLabel>
                  <StyledSelect
                    value={deliveryChannel}
                    onChange={(event) => setDeliveryChannel(event.target.value)}
                  >
                    {DELIVERY_CHANNEL_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </StyledSelect>
                </StyledField>

                <StyledField>
                  <StyledLabel>模板说明</StyledLabel>
                  <StyledTextArea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </StyledField>

                <StyledField>
                  <StyledLabel>章节键（每行一个）</StyledLabel>
                  <StyledTextArea
                    value={sectionKeysInput}
                    onChange={(event) => setSectionKeysInput(event.target.value)}
                  />
                </StyledField>

                <StyledField>
                  <StyledLabel>接收角色（每行一个）</StyledLabel>
                  <StyledTextArea
                    value={recipientRolesInput}
                    onChange={(event) => setRecipientRolesInput(event.target.value)}
                  />
                </StyledField>

                <StyledCheckbox>
                  <input
                    checked={isActive}
                    type="checkbox"
                    onChange={(event) => setIsActive(event.target.checked)}
                  />
                  启用模板
                </StyledCheckbox>

                <StyledCheckbox>
                  <input
                    checked={isDefault}
                    type="checkbox"
                    onChange={(event) => setIsDefault(event.target.checked)}
                  />
                  设为该报告类型默认模板
                </StyledCheckbox>

                <StyledActionRow>
                  <Button
                    accent="blue"
                    disabled={isSaving}
                    title={isSaving ? '保存中...' : '保存模板'}
                    onClick={saveTemplate}
                  />
                  <Button title="重置表单" onClick={resetForm} />
                </StyledActionRow>
              </StyledForm>
            </StyledPanel>

            <StyledPanel>
              <div>
                <StyledTitle>模板预览与版本</StyledTitle>
                <StyledDescription>
                  这里用于校对当前模板结构，以及确认默认策略是否正确落到最新版本。
                </StyledDescription>
              </div>

              {selectedTemplateId ? (
                <StyledActionRow>
                  {isViewingHistoricalVersion ? (
                    <Button
                      title="切回当前版本"
                      onClick={() => setSelectedVersionNumber(null)}
                    />
                  ) : null}
                  <Button
                    title="设为默认"
                    disabled={
                      isViewingHistoricalVersion ||
                      selectedTemplate?.isDefault === true
                    }
                    onClick={() =>
                      void mutateTemplateState(
                        selectedTemplateId,
                        'set-default',
                        '已切换为默认模板',
                      )
                    }
                  />
                  <Button
                    disabled={isViewingHistoricalVersion}
                    title={isActive ? '停用' : '启用'}
                    onClick={() =>
                      void mutateTemplateState(
                        selectedTemplateId,
                        isActive ? 'deactivate' : 'activate',
                        isActive ? '模板已停用' : '模板已启用',
                      )
                    }
                  />
                </StyledActionRow>
              ) : null}

              {preview ? (
                <>
                  {isViewingHistoricalVersion ? (
                    <StyledPreviewNotice>
                      当前正在查看历史版本 v{selectedVersionNumber}。历史版本仅用于校对，不允许直接变更默认状态或启停。
                    </StyledPreviewNotice>
                  ) : (
                    <StyledPreviewNotice>
                      当前展示最新版本预览。模板启停和默认模板策略只对最新版本生效。
                    </StyledPreviewNotice>
                  )}
                  <div>
                    <StyledTitle>{preview.title}</StyledTitle>
                    <StyledDescription>{preview.subtitle}</StyledDescription>
                  </div>
                  <StyledDescription>{preview.description}</StyledDescription>
                  <StyledBadgeRow>
                    <StyledBadge $tone={preview.status.isActive ? 'success' : 'warning'}>
                      {preview.status.isActive ? '启用中' : '已停用'}
                    </StyledBadge>
                    {preview.status.isDefault ? <StyledBadge>默认模板</StyledBadge> : null}
                    <StyledBadge>接收角色：{preview.recipients.join(', ') || '未设置'}</StyledBadge>
                  </StyledBadgeRow>
                  {preview.sections.map((section) => (
                    <StyledPreviewSection key={section.key}>
                      <StyledTitle>{section.title}</StyledTitle>
                      <StyledDescription>{section.summary}</StyledDescription>
                    </StyledPreviewSection>
                  ))}
                  <StyledDescription>
                    预览生成时间：{new Date(preview.generatedAt).toLocaleString()}
                  </StyledDescription>
                </>
              ) : (
                <StyledEmpty>选择模板后这里会显示最新预览。</StyledEmpty>
              )}

              <div>
                <StyledTitle>版本记录</StyledTitle>
                <StyledDescription>
                  当前每次保存、设为默认或启停都会生成一条新的模板快照。
                </StyledDescription>
              </div>

              {versions.length === 0 ? (
                <StyledEmpty>还没有版本记录。</StyledEmpty>
              ) : (
                <StyledVersionList>
                  {versions.map((version) => (
                    <StyledVersionItem
                      key={version.id}
                      type="button"
                      $active={
                        selectedVersionNumber === null
                          ? version.versionNumber === selectedTemplate?.version
                          : version.versionNumber === selectedVersionNumber
                      }
                      onClick={() => setSelectedVersionNumber(version.versionNumber)}
                    >
                      <StyledTemplateHeader>
                        <StyledTemplateName>v{version.versionNumber}</StyledTemplateName>
                        <StyledBadgeRow>
                          {version.versionNumber === selectedTemplate?.version ? (
                            <StyledBadge>当前</StyledBadge>
                          ) : null}
                          {version.isDefault ? <StyledBadge>默认</StyledBadge> : null}
                          <StyledBadge $tone={version.isActive ? 'success' : 'warning'}>
                            {version.isActive ? '启用' : '停用'}
                          </StyledBadge>
                        </StyledBadgeRow>
                      </StyledTemplateHeader>
                      <StyledTemplateMeta>
                        创建时间：{new Date(version.createdAt).toLocaleString()}
                      </StyledTemplateMeta>
                    </StyledVersionItem>
                  ))}
                </StyledVersionList>
              )}
            </StyledPanel>
          </StyledWorkspace>
        </StyledGrid>
      </EnterpriseShell>
    </EnterprisePermissionGuard>
  );
};


