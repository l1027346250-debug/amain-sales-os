import { useEffect, useMemo, useState } from 'react';

import { EnterprisePermissionGuard } from '@/enterprise/shared/components/EnterprisePermissionGuard';
import { EnterpriseShell } from '@/enterprise/shared/components/EnterpriseShell';
import { enterpriseNavigationGroups } from '@/enterprise/shared/constants/enterpriseNavigation';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { styled } from '@linaria/react';
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
  entityType: string;
  fieldCode: string;
  fieldName: string;
  fieldType: string;
  groupCode: string | null;
  enabled: boolean;
  syncStatus: string;
  syncErrorMessage: string | null;
};

const StyledGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledRow = styled.div`
  align-items: end;
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 180px 1fr 1fr 160px auto;
`;

const StyledField = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledLabel = styled.span`
  color: ${themeCssVariables.font.color.light};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledInput = styled.input`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledSelect = styled.select`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;

  th,
  td {
    border-bottom: 1px solid ${themeCssVariables.border.color.medium};
    padding: ${themeCssVariables.spacing[3]};
    text-align: left;
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
        ? themeCssVariables.font.color.success
        : themeCssVariables.font.color.secondary};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

export const EnterpriseCustomFieldsPage = () => {
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const [entities, setEntities] = useState<EnterpriseEntity[]>([]);
  const [fields, setFields] = useState<EnterpriseField[]>([]);
  const [entityType, setEntityType] = useState('lead');
  const [fieldName, setFieldName] = useState('');
  const [fieldCode, setFieldCode] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [groupCode, setGroupCode] = useState('base');
  const [isSaving, setIsSaving] = useState(false);

  const sidebar = useMemo(
    () =>
      enterpriseNavigationGroups.map((section) => ({
        title: section.label,
        items: section.items.map((item) => item.label),
      })),
    [],
  );

  const loadEntities = async () => {
    const response = await fetch('/api/enterprise/entities', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load enterprise entities');
    }

    const data = (await response.json()) as EnterpriseEntity[];
    setEntities(data);
  };

  const loadFields = async (nextEntityType: string) => {
    const query = new URLSearchParams({ entityType: nextEntityType });
    const response = await fetch(`/api/enterprise/fields?${query.toString()}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load enterprise fields');
    }

    const data = (await response.json()) as EnterpriseField[];
    setFields(data);
  };

  useEffect(() => {
    loadEntities().catch(() =>
      enqueueErrorSnackBar({ message: '无法加载企业管理对象列表' }),
    );
  }, [enqueueErrorSnackBar]);

  useEffect(() => {
    loadFields(entityType).catch(() =>
      enqueueErrorSnackBar({ message: '无法加载自定义字段列表' }),
    );
  }, [enqueueErrorSnackBar, entityType]);

  const createField = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/enterprise/fields', {
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
          searchable: true,
          exportable: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create field');
      }

      enqueueSuccessSnackBar({ message: '字段已创建，正在同步 metadata' });
      setFieldName('');
      setFieldCode('');
      await loadFields(entityType);
    } catch {
      enqueueErrorSnackBar({ message: '创建字段失败' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EnterprisePermissionGuard>
      <EnterpriseShell title="自定义字段" sidebar={sidebar}>
        <StyledGrid>
          <StyledRow>
            <StyledField>
              <StyledLabel>对象</StyledLabel>
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
                  </option>
                ))}
              </StyledSelect>
            </StyledField>
            <StyledField>
              <StyledLabel>字段名</StyledLabel>
              <StyledInput
                value={fieldName}
                onChange={(event) => setFieldName(event.target.value)}
              />
            </StyledField>
            <StyledField>
              <StyledLabel>字段编码</StyledLabel>
              <StyledInput
                value={fieldCode}
                onChange={(event) => setFieldCode(event.target.value)}
              />
            </StyledField>
            <StyledField>
              <StyledLabel>字段类型</StyledLabel>
              <StyledSelect
                value={fieldType}
                onChange={(event) => setFieldType(event.target.value)}
              >
                <option value="text">text</option>
                <option value="textarea">textarea</option>
                <option value="number">number</option>
                <option value="select">select</option>
                <option value="multiSelect">multiSelect</option>
                <option value="boolean">boolean</option>
                <option value="date">date</option>
              </StyledSelect>
            </StyledField>
            <Button
              title="创建字段"
              disabled={!fieldName || !fieldCode || isSaving}
              onClick={createField}
            />
          </StyledRow>
          <StyledField>
            <StyledLabel>字段分组</StyledLabel>
            <StyledInput
              value={groupCode}
              onChange={(event) => setGroupCode(event.target.value)}
            />
          </StyledField>
          <StyledTable>
            <thead>
              <tr>
                <th>字段名</th>
                <th>编码</th>
                <th>类型</th>
                <th>分组</th>
                <th>状态</th>
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
                        ? ` · ${field.syncErrorMessage}`
                        : ''}
                    </StyledStatus>
                  </td>
                </tr>
              ))}
            </tbody>
          </StyledTable>
        </StyledGrid>
      </EnterpriseShell>
    </EnterprisePermissionGuard>
  );
};
