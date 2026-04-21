import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { styled } from '@linaria/react';

import { EnterprisePermissionGuard } from '@/enterprise/shared/components/EnterprisePermissionGuard';
import { EnterpriseShell } from '@/enterprise/shared/components/EnterpriseShell';
import { enterpriseNavigationGroups } from '@/enterprise/shared/constants/enterpriseNavigation';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { AppPath } from 'twenty-shared/types';
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
  sortOrder: number;
};

type EnterpriseLayoutItem = {
  id: string;
  fieldDefinitionId: string;
  groupCode: string | null;
  required: boolean;
  visible: boolean;
  readonly: boolean;
  sortOrder: number;
};

type EnterpriseFieldLayoutRow = {
  fieldDefinitionId: string;
  fieldName: string;
  fieldCode: string;
  fieldType: string;
  groupCode: string;
  required: boolean;
  visible: boolean;
  readonly: boolean;
  sortOrder: number;
};

const pageSceneOptions = [
  { value: 'create', label: '新建表单' },
  { value: 'edit', label: '编辑表单' },
  { value: 'detail', label: '详情页' },
  { value: 'list', label: '列表页' },
  { value: 'filter', label: '筛选器' },
  { value: 'export', label: '导出字段' },
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

const StyledFilters = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 220px 220px 1fr auto;

  @media (max-width: 1080px) {
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

const StyledSelect = styled.select`
  ${inputStyles}
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  width: 100%;

  th,
  td {
    border-bottom: 1px solid ${themeCssVariables.border.color.light};
    padding: ${themeCssVariables.spacing[3]};
    text-align: left;
    vertical-align: middle;
  }

  th {
    color: ${themeCssVariables.font.color.light};
    font-size: ${themeCssVariables.font.size.sm};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

const StyledInput = styled.input`
  ${inputStyles}
  min-height: 36px;
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

const StyledCheckbox = styled.input`
  height: 16px;
  width: 16px;
`;

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
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

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.md};
  padding: ${themeCssVariables.spacing[6]} 0;
  text-align: center;
`;

const buildSidebar = () =>
  enterpriseNavigationGroups.map((section) => ({
    title: section.label,
    items: section.items.map((item) => item.label),
  }));

export const EnterpriseFieldLayoutPage = () => {
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const navigate = useNavigate();
  const { entityType: routeEntityType } = useParams<{ entityType: string }>();
  const [entities, setEntities] = useState<EnterpriseEntity[]>([]);
  const [entityType, setEntityType] = useState(routeEntityType ?? 'lead');
  const [pageScene, setPageScene] =
    useState<(typeof pageSceneOptions)[number]['value']>('detail');
  const [rows, setRows] = useState<EnterpriseFieldLayoutRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const sidebar = useMemo(buildSidebar, []);

  const loadEntities = async () => {
    const response = await fetch('/api/enterprise/entities', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load enterprise entities');
    }

    const data = (await response.json()) as EnterpriseEntity[];

    setEntities(data);

    const currentEntity = data.find(
      (entity) => entity.entityType === entityType && entity.available,
    );

    if (!currentEntity) {
      const firstAvailableEntity = data.find((entity) => entity.available);

      if (firstAvailableEntity) {
        setEntityType(firstAvailableEntity.entityType);
      }
    }
  };

  const loadLayout = async (nextEntityType: string, nextPageScene: string) => {
    const [fieldsResponse, layoutsResponse] = await Promise.all([
      fetch(`/api/enterprise/fields?${new URLSearchParams({ entityType: nextEntityType })}`, {
        credentials: 'include',
      }),
      fetch(
        `/api/enterprise/field-layouts?${new URLSearchParams({
          entityType: nextEntityType,
          pageScene: nextPageScene,
        })}`,
        {
          credentials: 'include',
        },
      ),
    ]);

    if (!fieldsResponse.ok || !layoutsResponse.ok) {
      throw new Error('Failed to load field layouts');
    }

    const fields = (await fieldsResponse.json()) as EnterpriseField[];
    const layouts = (await layoutsResponse.json()) as EnterpriseLayoutItem[];
    const layoutMap = new Map(
      layouts.map((layout) => [layout.fieldDefinitionId, layout]),
    );

    const nextRows = fields
      .map((field) => {
        const layout = layoutMap.get(field.id);

        return {
          fieldDefinitionId: field.id,
          fieldName: field.fieldName,
          fieldCode: field.fieldCode,
          fieldType: field.fieldType,
          groupCode: layout?.groupCode ?? field.groupCode ?? 'company_info',
          required: layout?.required ?? false,
          visible: layout?.visible ?? true,
          readonly: layout?.readonly ?? false,
          sortOrder: layout?.sortOrder ?? field.sortOrder,
        };
      })
      .sort((left, right) => left.sortOrder - right.sortOrder);

    setRows(nextRows);
  };

  useEffect(() => {
    void loadEntities().catch(() =>
      enqueueErrorSnackBar({ message: '无法加载企业管理对象列表' }),
    );
  }, [enqueueErrorSnackBar]);

  useEffect(() => {
    if (!entityType) {
      return;
    }

    void loadLayout(entityType, pageScene).catch(() =>
      enqueueErrorSnackBar({ message: '无法加载字段显示配置' }),
    );
  }, [enqueueErrorSnackBar, entityType, pageScene]);

  useEffect(() => {
    if (!entityType || routeEntityType === entityType) {
      return;
    }

    navigate(
      AppPath.EnterpriseFieldDisplay.replace(':entityType', entityType),
      { replace: true },
    );
  }, [entityType, navigate, routeEntityType]);

  const updateRow = (
    fieldDefinitionId: string,
    patch: Partial<EnterpriseFieldLayoutRow>,
  ) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.fieldDefinitionId === fieldDefinitionId
          ? { ...row, ...patch }
          : row,
      ),
    );
  };

  const saveLayouts = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/enterprise/field-layouts', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          pageScene,
          items: rows.map((row, index) => ({
            fieldDefinitionId: row.fieldDefinitionId,
            groupCode: row.groupCode,
            required: row.required,
            visible: row.visible,
            readonly: row.readonly,
            sortOrder: Number.isNaN(row.sortOrder) ? index : row.sortOrder,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save field layouts');
      }

      enqueueSuccessSnackBar({ message: '字段显示配置已保存' });
      await loadLayout(entityType, pageScene);
    } catch {
      enqueueErrorSnackBar({ message: '保存字段显示配置失败' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EnterprisePermissionGuard>
      <EnterpriseShell title="字段显示" sidebar={sidebar}>
        <StyledGrid>
          <StyledHero>
            <StyledHeroTitle>字段布局中心</StyledHeroTitle>
            <StyledHeroText>
              配置字段在不同业务场景中的显示方式。当前页面已经接通 enterprise 字段定义与 field layout 配置接口，可以直接保存到后端表结构。
            </StyledHeroText>
          </StyledHero>

          <StyledPanel>
            <StyledHeader>
              <div>
                <StyledTitle>布局筛选</StyledTitle>
                <StyledDescription>
                  按对象与页面场景配置字段可见、必填、只读和顺序。
                </StyledDescription>
              </div>
              <Button
                title="保存布局"
                disabled={rows.length === 0 || isSaving}
                onClick={saveLayouts}
              />
            </StyledHeader>

            <StyledFilters>
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
                <StyledLabel>页面场景</StyledLabel>
                <StyledSelect
                  value={pageScene}
                  onChange={(event) =>
                    setPageScene(
                      event.target.value as (typeof pageSceneOptions)[number]['value'],
                    )
                  }
                >
                  {pageSceneOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </StyledSelect>
              </StyledField>
            </StyledFilters>

            <StyledHint>
              当前版本采用“全量覆盖保存”。每次保存都会重写该对象和场景下的布局配置。
            </StyledHint>
          </StyledPanel>

          <StyledPanel>
            <StyledHeader>
              <div>
                <StyledTitle>字段布局表</StyledTitle>
                <StyledDescription>
                  先配置 detail、create、edit 三个核心场景，后续再扩展 list、filter、export 的联动渲染。
                </StyledDescription>
              </div>
              <Button
                variant="secondary"
                title="重新加载"
                onClick={() => void loadLayout(entityType, pageScene)}
              />
            </StyledHeader>

            {rows.length === 0 ? (
              <StyledEmpty>当前对象还没有可配置的 enterprise 字段。</StyledEmpty>
            ) : (
              <StyledTable>
                <thead>
                  <tr>
                    <th>字段名称</th>
                    <th>字段编码</th>
                    <th>类型</th>
                    <th>分组</th>
                    <th>排序</th>
                    <th>可见</th>
                    <th>必填</th>
                    <th>只读</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.fieldDefinitionId}>
                      <td>{row.fieldName}</td>
                      <td>{row.fieldCode}</td>
                      <td>{row.fieldType}</td>
                      <td>
                        <StyledInput
                          value={row.groupCode}
                          onChange={(event) =>
                            updateRow(row.fieldDefinitionId, {
                              groupCode: event.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <StyledInput
                          type="number"
                          value={row.sortOrder}
                          onChange={(event) =>
                            updateRow(row.fieldDefinitionId, {
                              sortOrder: Number(event.target.value),
                            })
                          }
                        />
                      </td>
                      <td>
                        <StyledCheckbox
                          checked={row.visible}
                          type="checkbox"
                          onChange={(event) =>
                            updateRow(row.fieldDefinitionId, {
                              visible: event.target.checked,
                            })
                          }
                        />
                      </td>
                      <td>
                        <StyledCheckbox
                          checked={row.required}
                          type="checkbox"
                          onChange={(event) =>
                            updateRow(row.fieldDefinitionId, {
                              required: event.target.checked,
                            })
                          }
                        />
                      </td>
                      <td>
                        <StyledCheckbox
                          checked={row.readonly}
                          type="checkbox"
                          onChange={(event) =>
                            updateRow(row.fieldDefinitionId, {
                              readonly: event.target.checked,
                            })
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

