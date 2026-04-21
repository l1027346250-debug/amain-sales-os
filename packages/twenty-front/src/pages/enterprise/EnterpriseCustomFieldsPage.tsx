import { useEffect, useMemo, useState } from 'react';

import { styled } from '@linaria/react';

import { EnterprisePermissionGuard } from '@/enterprise/shared/components/EnterprisePermissionGuard';
import { EnterpriseShell } from '@/enterprise/shared/components/EnterpriseShell';
import { enterpriseNavigationGroups } from '@/enterprise/shared/constants/enterpriseNavigation';
import { useEnterpriseApiRequest } from '@/enterprise/shared/hooks/useEnterpriseApiRequest';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type EnterpriseEntity = {
  entityType: string;
  label: string;
  metadataName: string | null;
  available: boolean;
};

type EnterpriseField = {
  id: string;
  fieldCode: string;
  fieldName: string;
  fieldType: string;
  groupCode: string | null;
  enabled: boolean;
  syncStatus: string;
  syncErrorMessage: string | null;
};

type EnterpriseFieldOptionInput = {
  optionCode: string;
  optionLabel: string;
  color?: string;
  sortOrder?: number;
  enabled?: boolean;
};

const enterpriseFieldTypeOptions = [
  'text',
  'textarea',
  'number',
  'select',
  'multiSelect',
  'boolean',
  'date',
] as const;

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

const StyledPanel = styled.section`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledSectionHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
`;

const StyledSectionTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledSectionText = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledFormGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 180px 1fr 1fr 180px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const StyledField = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledFieldSpan = styled.div`
  grid-column: 1 / -1;
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

const StyledTextarea = styled.textarea`
  ${inputStyles}
  min-height: 112px;
  resize: vertical;
`;

const StyledActionRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
`;

const StyledCheckboxRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledCheckboxLabel = styled.label`
  align-items: center;
  color: ${themeCssVariables.font.color.primary};
  display: inline-flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
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

const StyledStatus = styled.span<{ tone: 'neutral' | 'danger' | 'success' }>`
  color: ${({ tone }) =>
    tone === 'danger'
      ? themeCssVariables.font.color.danger
      : tone === 'success'
        ? themeCssVariables.snackBar.success.color
        : themeCssVariables.font.color.secondary};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.md};
  padding: ${themeCssVariables.spacing[6]} 0;
  text-align: center;
`;

const parseOptionsInput = (value: string): EnterpriseFieldOptionInput[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [rawCode, rawLabel] = line.includes(':')
        ? line.split(':', 2)
        : [line, line];

      const optionCode = rawCode.trim().replace(/\s+/g, '_');
      const optionLabel = rawLabel.trim() || rawCode.trim();

      return {
        optionCode,
        optionLabel,
        sortOrder: index,
        enabled: true,
      };
    });

const buildSidebar = () =>
  enterpriseNavigationGroups.map((section) => ({
    title: section.label,
    items: section.items.map((item) => item.label),
  }));

export const EnterpriseCustomFieldsPage = () => {
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const [entities, setEntities] = useState<EnterpriseEntity[]>([]);
  const [fields, setFields] = useState<EnterpriseField[]>([]);
  const [entityType, setEntityType] = useState('lead');
  const [fieldName, setFieldName] = useState('');
  const [fieldCode, setFieldCode] = useState('');
  const [fieldType, setFieldType] =
    useState<(typeof enterpriseFieldTypeOptions)[number]>('text');
  const [groupCode, setGroupCode] = useState('company_info');
  const [optionsDraft, setOptionsDraft] = useState('');
  const [searchable, setSearchable] = useState(true);
  const [exportable, setExportable] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const sidebar = useMemo(buildSidebar, []);
  const isSelectType =
    fieldType === 'select' || fieldType === 'multiSelect';

  const loadEntities = async () => {
    const response = await enterpriseApiRequest('/api/enterprise/entities', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load enterprise entities');
    }

    const data = (await response.json()) as EnterpriseEntity[];

    setEntities(data);

    if (!data.some((entity) => entity.entityType === entityType && entity.available)) {
      const firstAvailableEntity = data.find((entity) => entity.available);

      if (firstAvailableEntity) {
        setEntityType(firstAvailableEntity.entityType);
      }
    }
  };

  const loadFields = async (nextEntityType: string) => {
    const query = new URLSearchParams({ entityType: nextEntityType });
    const response = await enterpriseApiRequest(
      `/api/enterprise/fields?${query.toString()}`,
      {
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error('Failed to load enterprise fields');
    }

    const data = (await response.json()) as EnterpriseField[];

    setFields(data);
  };

  useEffect(() => {
    void loadEntities().catch(() =>
      enqueueErrorSnackBar({ message: '无法加载企业管理对象列表' }),
    );
  }, [enqueueErrorSnackBar]);

  useEffect(() => {
    void loadFields(entityType).catch(() =>
      enqueueErrorSnackBar({ message: '无法加载自定义字段列表' }),
    );
  }, [enqueueErrorSnackBar, entityType]);

  const createField = async () => {
    setIsSaving(true);

    try {
      const options = isSelectType ? parseOptionsInput(optionsDraft) : [];
      const response = await enterpriseApiRequest('/api/enterprise/fields', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          fieldName,
          fieldCode,
          fieldType,
          groupCode,
          enabled: true,
          searchable,
          exportable,
          options,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create enterprise field');
      }

      enqueueSuccessSnackBar({ message: '字段已创建，并已提交 metadata 同步' });
      setFieldName('');
      setFieldCode('');
      setOptionsDraft('');
      await loadFields(entityType);
    } catch {
      enqueueErrorSnackBar({ message: '创建字段失败，请检查字段编码和选项格式' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EnterprisePermissionGuard>
      <EnterpriseShell title="自定义字段" sidebar={sidebar}>
        <StyledGrid>
          <StyledHero>
            <StyledHeroTitle>企业字段中心</StyledHeroTitle>
            <StyledHeroText>
              在这里定义企业管理专属字段，并将字段投影到 Twenty metadata。字段创建后会影响后续的页面布局、筛选、导出和业务对象扩展。
            </StyledHeroText>
          </StyledHero>

          <StyledPanel>
            <StyledSectionHeader>
              <div>
                <StyledSectionTitle>新增字段</StyledSectionTitle>
                <StyledSectionText>
                  支持 lead、customer、opportunity 三类对象。字段编码在同一对象内必须唯一。
                </StyledSectionText>
              </div>
              <Button
                variant="secondary"
                title="刷新列表"
                onClick={() => void loadFields(entityType)}
              />
            </StyledSectionHeader>

            <StyledFormGrid>
              <StyledField>
                <StyledLabel>业务对象</StyledLabel>
                <StyledSelect
                  value={entityType}
                  onChange={(event) => setEntityType(event.target.value)}
                >
                  {entities.map((entity) => (
                    <option
                      key={entity.entityType}
                      value={entity.entityType}
                      disabled={!entity.available}
                    >
                      {entity.label}
                      {entity.available ? '' : '（当前工作区未启用）'}
                    </option>
                  ))}
                </StyledSelect>
              </StyledField>

              <StyledField>
                <StyledLabel>字段名称</StyledLabel>
                <StyledInput
                  value={fieldName}
                  placeholder="例如：客户质量"
                  onChange={(event) => setFieldName(event.target.value)}
                />
              </StyledField>

              <StyledField>
                <StyledLabel>字段编码</StyledLabel>
                <StyledInput
                  value={fieldCode}
                  placeholder="例如：customer_quality"
                  onChange={(event) => setFieldCode(event.target.value)}
                />
              </StyledField>

              <StyledField>
                <StyledLabel>字段类型</StyledLabel>
                <StyledSelect
                  value={fieldType}
                  onChange={(event) =>
                    setFieldType(
                      event.target.value as (typeof enterpriseFieldTypeOptions)[number],
                    )
                  }
                >
                  {enterpriseFieldTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </StyledSelect>
              </StyledField>

              <StyledField>
                <StyledLabel>字段分组</StyledLabel>
                <StyledInput
                  value={groupCode}
                  placeholder="例如：company_info"
                  onChange={(event) => setGroupCode(event.target.value)}
                />
              </StyledField>

              {isSelectType ? (
                <StyledFieldSpan>
                  <StyledField>
                    <StyledLabel>选项配置</StyledLabel>
                    <StyledTextarea
                      value={optionsDraft}
                      placeholder={'每行一个选项，格式为 code:label\n例如：high:高价值'}
                      onChange={(event) => setOptionsDraft(event.target.value)}
                    />
                  </StyledField>
                </StyledFieldSpan>
              ) : null}
            </StyledFormGrid>

            <StyledActionRow>
              <StyledCheckboxRow>
                <StyledCheckboxLabel>
                  <input
                    checked={searchable}
                    type="checkbox"
                    onChange={(event) => setSearchable(event.target.checked)}
                  />
                  可搜索
                </StyledCheckboxLabel>
                <StyledCheckboxLabel>
                  <input
                    checked={exportable}
                    type="checkbox"
                    onChange={(event) => setExportable(event.target.checked)}
                  />
                  可导出
                </StyledCheckboxLabel>
              </StyledCheckboxRow>

              <Button
                title="创建字段"
                disabled={
                  !fieldName.trim() ||
                  !fieldCode.trim() ||
                  (isSelectType && parseOptionsInput(optionsDraft).length === 0) ||
                  isSaving
                }
                onClick={createField}
              />
            </StyledActionRow>

            <StyledHint>
              下拉类字段需要配置选项。当前版本会在创建字段后立即触发 metadata 投影。
            </StyledHint>
          </StyledPanel>

          <StyledPanel>
            <StyledSectionHeader>
              <div>
                <StyledSectionTitle>字段列表</StyledSectionTitle>
                <StyledSectionText>
                  当前对象下已定义字段及其同步状态。
                </StyledSectionText>
              </div>
            </StyledSectionHeader>

            {fields.length === 0 ? (
              <StyledEmpty>当前对象还没有企业自定义字段。</StyledEmpty>
            ) : (
              <StyledTable>
                <thead>
                  <tr>
                    <th>字段名称</th>
                    <th>字段编码</th>
                    <th>类型</th>
                    <th>分组</th>
                    <th>状态</th>
                    <th>启用</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr key={field.id}>
                      <td>{field.fieldName}</td>
                      <td>{field.fieldCode}</td>
                      <td>{field.fieldType}</td>
                      <td>{field.groupCode ?? '-'}</td>
                      <td>
                        <StyledStatus
                          tone={
                            field.syncStatus === 'failed'
                              ? 'danger'
                              : field.syncStatus === 'synced'
                                ? 'success'
                                : 'neutral'
                          }
                        >
                          {field.syncStatus}
                          {field.syncErrorMessage
                            ? ` | ${field.syncErrorMessage}`
                            : ''}
                        </StyledStatus>
                      </td>
                      <td>{field.enabled ? '是' : '否'}</td>
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

