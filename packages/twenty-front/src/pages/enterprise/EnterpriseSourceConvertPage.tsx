import { useCallback, useEffect, useMemo, useState } from 'react';

import { styled } from '@linaria/react';

import { EnterprisePermissionGuard } from '@/enterprise/shared/components/EnterprisePermissionGuard';
import { enterprisePermissionCodes } from '@/enterprise/shared/constants/enterprisePermissions';
import { EnterpriseShell } from '@/enterprise/shared/components/EnterpriseShell';
import { enterpriseNavigationGroups } from '@/enterprise/shared/constants/enterpriseNavigation';
import { useEnterpriseApiRequest } from '@/enterprise/shared/hooks/useEnterpriseApiRequest';
import { useEnterprisePermissions } from '@/enterprise/shared/hooks/useEnterprisePermissions';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type SourceCategory = {
  code: string;
  label: string;
  ruleCount: number;
  enabledCount: number;
};

type SourceChannel = {
  id: string;
  categoryCode: string;
  sourceCode: string;
  sourceName: string;
  secondSourceName: string | null;
};

type SourceConvertRule = {
  id: string;
  sourceChannelId: string;
  depositEntityType: 'lead' | 'customer';
  targetLeadStatus: string | null;
  targetCustomerStage: string | null;
  autoTagIds: string[];
  includeFunnelStats: boolean;
  enabled: boolean;
  ruleJson: {
    duplicatePolicy?: string;
    workflowEnabled?: boolean;
    idempotencyKey?: string[];
  } | null;
  ruleEditedAt: string | null;
  dataSyncedAt: string | null;
  sourceChannel: SourceChannel | null;
};

type BlacklistRule = {
  id: string;
  ruleType: string;
  ruleValue: string;
  action: string;
  enabled: boolean;
  createdAt: string;
};

type RuleFormState = {
  depositEntityType: 'lead' | 'customer';
  targetLeadStatus: string;
  targetCustomerStage: string;
  autoTagIds: string;
  includeFunnelStats: boolean;
  enabled: boolean;
  duplicatePolicy: string;
  workflowEnabled: boolean;
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

const StyledTab = styled.button<{ active: boolean }>`
  background: ${({ active }) =>
    active ? themeCssVariables.color.blue : themeCssVariables.background.secondary};
  border: 1px solid
    ${({ active }) =>
      active
        ? themeCssVariables.border.color.blue
        : themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${({ active }) =>
    active
      ? themeCssVariables.font.color.inverted
      : themeCssVariables.font.color.primary};
  cursor: pointer;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledContentGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: minmax(0, 1fr) 380px;

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
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

const StyledLinkButton = styled.button`
  background: transparent;
  border: 0;
  color: ${themeCssVariables.color.blue};
  cursor: pointer;
  padding: 0;
`;

const StyledStatus = styled.span<{ enabled: boolean }>`
  color: ${({ enabled }) =>
    enabled
      ? themeCssVariables.snackBar.success.color
      : themeCssVariables.font.color.secondary};
  font-weight: ${themeCssVariables.font.weight.medium};
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

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  padding: ${themeCssVariables.spacing[5]} 0;
  text-align: center;
`;

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString('zh-CN') : '-';

const toFormState = (rule: SourceConvertRule): RuleFormState => ({
  depositEntityType: rule.depositEntityType,
  targetLeadStatus: rule.targetLeadStatus ?? '',
  targetCustomerStage: rule.targetCustomerStage ?? '',
  autoTagIds: rule.autoTagIds.join(', '),
  includeFunnelStats: rule.includeFunnelStats,
  enabled: rule.enabled,
  duplicatePolicy: rule.ruleJson?.duplicatePolicy ?? 'skip',
  workflowEnabled: rule.ruleJson?.workflowEnabled ?? false,
});

export const EnterpriseSourceConvertPage = () => {
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const { hasEnterprisePermission } = useEnterprisePermissions();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const [categories, setCategories] = useState<SourceCategory[]>([]);
  const [activeCategoryCode, setActiveCategoryCode] = useState('okki');
  const [rules, setRules] = useState<SourceConvertRule[]>([]);
  const [blacklistRules, setBlacklistRules] = useState<BlacklistRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState<RuleFormState | null>(null);
  const [blacklistType, setBlacklistType] = useState('email');
  const [blacklistValue, setBlacklistValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const canUpdateSourceConvert = hasEnterprisePermission(
    enterprisePermissionCodes.sourceConvertUpdate,
  );
  const canUpdateBlacklist = hasEnterprisePermission(
    enterprisePermissionCodes.sourceConvertBlacklistUpdate,
  );

  const selectedRule = useMemo(
    () => rules.find((rule) => rule.id === selectedRuleId) ?? null,
    [rules, selectedRuleId],
  );

  const loadCategories = useCallback(async () => {
    const response = await enterpriseApiRequest(
      '/api/enterprise/source-convert/categories',
      { credentials: 'include' },
    );

    if (!response.ok) {
      throw new Error('Failed to load source categories');
    }

    const data = (await response.json()) as SourceCategory[];

    setCategories(data);
  }, [enterpriseApiRequest]);

  const loadRules = useCallback(async () => {
    const response = await enterpriseApiRequest(
      `/api/enterprise/source-convert/rules?categoryCode=${activeCategoryCode}`,
      { credentials: 'include' },
    );

    if (!response.ok) {
      throw new Error('Failed to load source convert rules');
    }

    const data = (await response.json()) as SourceConvertRule[];

    setRules(data);
    setSelectedRuleId((currentRuleId) =>
      data.some((rule) => rule.id === currentRuleId)
        ? currentRuleId
        : data[0]?.id ?? null,
    );
  }, [activeCategoryCode, enterpriseApiRequest]);

  const loadBlacklist = useCallback(async () => {
    const response = await enterpriseApiRequest(
      '/api/enterprise/source-convert/blacklist',
      { credentials: 'include' },
    );

    if (!response.ok) {
      throw new Error('Failed to load blacklist');
    }

    setBlacklistRules((await response.json()) as BlacklistRule[]);
  }, [enterpriseApiRequest]);

  useEffect(() => {
    loadCategories().catch(() =>
      enqueueErrorSnackBar({ message: '无法加载来源分类' }),
    );
  }, [enqueueErrorSnackBar, loadCategories]);

  useEffect(() => {
    loadRules().catch(() =>
      enqueueErrorSnackBar({ message: '无法加载来源规则' }),
    );
  }, [enqueueErrorSnackBar, loadRules]);

  useEffect(() => {
    loadBlacklist().catch(() =>
      enqueueErrorSnackBar({ message: '无法加载黑名单' }),
    );
  }, [enqueueErrorSnackBar, loadBlacklist]);

  useEffect(() => {
    setRuleForm(selectedRule ? toFormState(selectedRule) : null);
  }, [selectedRule]);

  const saveRule = async () => {
    if (!canUpdateSourceConvert) {
      enqueueErrorSnackBar({ message: '没有修改来源流转规则的权限' });

      return;
    }

    if (!selectedRule || !ruleForm) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/source-convert/rules/${selectedRule.id}`,
        {
          body: JSON.stringify({
            depositEntityType: ruleForm.depositEntityType,
            targetLeadStatus: ruleForm.targetLeadStatus,
            targetCustomerStage: ruleForm.targetCustomerStage,
            autoTagIds: ruleForm.autoTagIds
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean),
            includeFunnelStats: ruleForm.includeFunnelStats,
            enabled: ruleForm.enabled,
            ruleJson: {
              duplicatePolicy: ruleForm.duplicatePolicy,
              workflowEnabled: ruleForm.workflowEnabled,
              idempotencyKey: ['externalId', 'email'],
            },
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PATCH',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to save source convert rule');
      }

      enqueueSuccessSnackBar({ message: '来源流转规则已保存' });
      await Promise.all([loadRules(), loadCategories()]);
    } catch {
      enqueueErrorSnackBar({ message: '保存来源流转规则失败' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRule = async (rule: SourceConvertRule) => {
    if (!canUpdateSourceConvert) {
      enqueueErrorSnackBar({ message: '没有启停来源流转规则的权限' });

      return;
    }

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/source-convert/rules/${rule.id}/enabled`,
        {
          body: JSON.stringify({ enabled: !rule.enabled }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PATCH',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to toggle source convert rule');
      }

      await Promise.all([loadRules(), loadCategories()]);
    } catch {
      enqueueErrorSnackBar({ message: '更新规则启停失败' });
    }
  };

  const addBlacklistRule = async () => {
    if (!canUpdateBlacklist) {
      enqueueErrorSnackBar({ message: '没有维护来源黑名单的权限' });

      return;
    }

    if (!blacklistValue.trim()) {
      enqueueErrorSnackBar({ message: '请输入黑名单值' });

      return;
    }

    try {
      const response = await enterpriseApiRequest(
        '/api/enterprise/source-convert/blacklist',
        {
          body: JSON.stringify({
            ruleType: blacklistType,
            ruleValue: blacklistValue,
            action: 'reject',
            enabled: true,
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to create blacklist rule');
      }

      setBlacklistValue('');
      enqueueSuccessSnackBar({ message: '黑名单已新增' });
      await loadBlacklist();
    } catch {
      enqueueErrorSnackBar({ message: '新增黑名单失败' });
    }
  };

  const deleteBlacklistRule = async (blacklistRule: BlacklistRule) => {
    if (!canUpdateBlacklist) {
      enqueueErrorSnackBar({ message: '没有维护来源黑名单的权限' });

      return;
    }

    if (!window.confirm(`确认删除黑名单 ${blacklistRule.ruleValue}？`)) {
      return;
    }

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/source-convert/blacklist/${blacklistRule.id}`,
        {
          credentials: 'include',
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to delete blacklist rule');
      }

      enqueueSuccessSnackBar({ message: '黑名单已删除' });
      await loadBlacklist();
    } catch {
      enqueueErrorSnackBar({ message: '删除黑名单失败' });
    }
  };

  return (
    <EnterprisePermissionGuard
      requiredPermission={enterprisePermissionCodes.sourceConvertRead}
    >
      <EnterpriseShell title="企业管理 / 获客来源流转配置" sidebar={buildSidebar()}>
        <StyledGrid>
          <StyledPanel>
            <StyledHeader>
              <div>
                <StyledTitle>获客来源流转配置</StyledTitle>
                <StyledDescription>
                  先识别来源和黑名单，再按规则决定沉淀为线索或客户，并写入标签、状态、漏斗统计和同步时间。
                </StyledDescription>
              </div>
              <StyledActionRow>
                <Button title="去工作流模板设置" />
                <Button title="查看演示" />
              </StyledActionRow>
            </StyledHeader>
            <StyledTabs>
              {categories.map((category) => (
                <StyledTab
                  active={category.code === activeCategoryCode}
                  key={category.code}
                  onClick={() => setActiveCategoryCode(category.code)}
                  type="button"
                >
                  {category.label} {category.enabledCount}/{category.ruleCount}
                </StyledTab>
              ))}
            </StyledTabs>
          </StyledPanel>

          <StyledContentGrid>
            <StyledPanel>
              <StyledSubTitle>来源规则</StyledSubTitle>
              <StyledTable>
                <thead>
                  <tr>
                    <th>系统来源</th>
                    <th>流量沉淀为</th>
                    <th>状态/阶段</th>
                    <th>自动标签</th>
                    <th>漏斗统计</th>
                    <th>启用</th>
                    <th>规则编辑时间</th>
                    <th>数据同步时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id}>
                      <td>
                        <StyledLinkButton
                          onClick={() => setSelectedRuleId(rule.id)}
                          type="button"
                        >
                          {rule.sourceChannel?.sourceName ?? '-'}
                        </StyledLinkButton>
                        <div>{rule.sourceChannel?.secondSourceName ?? '-'}</div>
                      </td>
                      <td>{rule.depositEntityType === 'lead' ? '线索' : '客户'}</td>
                      <td>
                        {rule.depositEntityType === 'lead'
                          ? rule.targetLeadStatus ?? '-'
                          : rule.targetCustomerStage ?? '-'}
                      </td>
                      <td>{rule.autoTagIds.join(', ') || '-'}</td>
                      <td>{rule.includeFunnelStats ? '进入统计' : '不统计'}</td>
                      <td>
                        <StyledStatus enabled={rule.enabled}>
                          {rule.enabled ? '启用' : '停用'}
                        </StyledStatus>
                      </td>
                      <td>{formatDate(rule.ruleEditedAt)}</td>
                      <td>{formatDate(rule.dataSyncedAt)}</td>
                      <td>
                        <StyledActionRow>
                          <Button
                            title="修改规则"
                            onClick={() => setSelectedRuleId(rule.id)}
                          />
                          <Button
                            disabled={!canUpdateSourceConvert}
                            title={rule.enabled ? '停用' : '启用'}
                            onClick={() => void toggleRule(rule)}
                          />
                        </StyledActionRow>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </StyledTable>
              {rules.length === 0 && <StyledEmpty>当前分类暂无规则。</StyledEmpty>}
            </StyledPanel>

            <StyledGrid>
              <StyledPanel>
                <StyledSubTitle>规则设置</StyledSubTitle>
                {selectedRule && ruleForm ? (
                  <StyledForm>
                    <StyledDescription>
                      {selectedRule.sourceChannel?.sourceName} /{' '}
                      {selectedRule.sourceChannel?.sourceCode}
                    </StyledDescription>
                    <StyledField>
                      <StyledLabel>流量沉淀为</StyledLabel>
                      <StyledSelect
                        onChange={(event) =>
                          setRuleForm({
                            ...ruleForm,
                            depositEntityType: event.target.value as
                              | 'lead'
                              | 'customer',
                          })
                        }
                        value={ruleForm.depositEntityType}
                      >
                        <option value="lead">线索</option>
                        <option value="customer">客户</option>
                      </StyledSelect>
                    </StyledField>
                    <StyledField>
                      <StyledLabel>流转后线索状态</StyledLabel>
                      <StyledInput
                        onChange={(event) =>
                          setRuleForm({
                            ...ruleForm,
                            targetLeadStatus: event.target.value,
                          })
                        }
                        value={ruleForm.targetLeadStatus}
                      />
                    </StyledField>
                    <StyledField>
                      <StyledLabel>流转后客户阶段</StyledLabel>
                      <StyledInput
                        onChange={(event) =>
                          setRuleForm({
                            ...ruleForm,
                            targetCustomerStage: event.target.value,
                          })
                        }
                        value={ruleForm.targetCustomerStage}
                      />
                    </StyledField>
                    <StyledField>
                      <StyledLabel>自动标记标签，逗号分隔</StyledLabel>
                      <StyledInput
                        onChange={(event) =>
                          setRuleForm({
                            ...ruleForm,
                            autoTagIds: event.target.value,
                          })
                        }
                        value={ruleForm.autoTagIds}
                      />
                    </StyledField>
                    <StyledField>
                      <StyledLabel>重复数据策略</StyledLabel>
                      <StyledSelect
                        onChange={(event) =>
                          setRuleForm({
                            ...ruleForm,
                            duplicatePolicy: event.target.value,
                          })
                        }
                        value={ruleForm.duplicatePolicy}
                      >
                        <option value="skip">跳过重复</option>
                        <option value="merge">合并更新</option>
                        <option value="pending">进入待处理</option>
                      </StyledSelect>
                    </StyledField>
                    <StyledCheckbox>
                      <input
                        checked={ruleForm.includeFunnelStats}
                        onChange={(event) =>
                          setRuleForm({
                            ...ruleForm,
                            includeFunnelStats: event.target.checked,
                          })
                        }
                        type="checkbox"
                      />
                      进入销售转化漏斗统计
                    </StyledCheckbox>
                    <StyledCheckbox>
                      <input
                        checked={ruleForm.workflowEnabled}
                        onChange={(event) =>
                          setRuleForm({
                            ...ruleForm,
                            workflowEnabled: event.target.checked,
                          })
                        }
                        type="checkbox"
                      />
                      允许触发后续工作流
                    </StyledCheckbox>
                    <StyledCheckbox>
                      <input
                        checked={ruleForm.enabled}
                        onChange={(event) =>
                          setRuleForm({
                            ...ruleForm,
                            enabled: event.target.checked,
                          })
                        }
                        type="checkbox"
                      />
                      启用规则
                    </StyledCheckbox>
                    <Button
                      accent="blue"
                      disabled={isSaving || !canUpdateSourceConvert}
                      title={isSaving ? '保存中...' : '保存规则'}
                      onClick={() => void saveRule()}
                    />
                  </StyledForm>
                ) : (
                  <StyledEmpty>选择一条规则后编辑。</StyledEmpty>
                )}
              </StyledPanel>

              <StyledPanel>
                <StyledSubTitle>黑名单设置</StyledSubTitle>
                <StyledDescription>
                  命中黑名单优先拒绝或进入待处理，避免重复同步创建无效线索。
                </StyledDescription>
                <StyledActionRow>
                  <StyledSelect
                    onChange={(event) => setBlacklistType(event.target.value)}
                    value={blacklistType}
                  >
                    <option value="email">邮箱</option>
                    <option value="domain">域名</option>
                    <option value="sourceCode">来源编码</option>
                  </StyledSelect>
                  <StyledInput
                    onChange={(event) => setBlacklistValue(event.target.value)}
                    placeholder="输入黑名单值"
                    value={blacklistValue}
                  />
                  <Button
                    disabled={!canUpdateBlacklist}
                    title="新增"
                    onClick={() => void addBlacklistRule()}
                  />
                </StyledActionRow>
                <StyledTable>
                  <thead>
                    <tr>
                      <th>类型</th>
                      <th>值</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blacklistRules.map((blacklistRule) => (
                      <tr key={blacklistRule.id}>
                        <td>{blacklistRule.ruleType}</td>
                        <td>{blacklistRule.ruleValue}</td>
                        <td>
                          <Button
                            disabled={!canUpdateBlacklist}
                            title="删除"
                            onClick={() => void deleteBlacklistRule(blacklistRule)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </StyledTable>
                {blacklistRules.length === 0 && (
                  <StyledEmpty>暂无黑名单规则。</StyledEmpty>
                )}
              </StyledPanel>
            </StyledGrid>
          </StyledContentGrid>
        </StyledGrid>
      </EnterpriseShell>
    </EnterprisePermissionGuard>
  );
};

