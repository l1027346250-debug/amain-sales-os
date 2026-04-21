import { useCallback, useEffect, useMemo, useState } from 'react';

import { styled } from '@linaria/react';

import { EnterprisePermissionGuard } from '@/enterprise/shared/components/EnterprisePermissionGuard';
import { EnterpriseShell } from '@/enterprise/shared/components/EnterpriseShell';
import { enterpriseNavigationGroups } from '@/enterprise/shared/constants/enterpriseNavigation';
import { useEnterpriseApiRequest } from '@/enterprise/shared/hooks/useEnterpriseApiRequest';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type SalesPlaybook = {
  id: string;
  playbookName: string;
  description: string | null;
  enabled: boolean;
  updatedAt: string;
};

type SalesPlaybookStage = {
  id?: string;
  playbookId?: string;
  stageName: string;
  stageCode: string;
  sortOrder: number;
  enabled: boolean;
};

type SalesPlaybookItem = {
  id?: string;
  stageId?: string;
  itemType: string;
  title: string;
  content: string | null;
  attachmentIds: string[];
  suggestionJson: {
    nextAction?: string;
    applicableObjects?: string[];
  } | null;
  sortOrder: number;
  enabled: boolean;
};

type PlaybookFormState = {
  playbookName: string;
  description: string;
  enabled: boolean;
};

type ItemFormState = {
  itemType: string;
  title: string;
  content: string;
  attachmentIds: string;
  applicableObjects: string;
  nextAction: string;
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

const StyledContentGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: 300px 360px minmax(0, 1fr);

  @media (max-width: 1280px) {
    grid-template-columns: 1fr;
  }
`;

const StyledList = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledListItem = styled.button<{ active: boolean }>`
  background: ${({ active }) =>
    active ? themeCssVariables.background.secondary : themeCssVariables.background.primary};
  border: 1px solid
    ${({ active }) =>
      active
        ? themeCssVariables.border.color.medium
        : themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: grid;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[3]};
  text-align: left;
`;

const StyledStageFieldGroup = styled.div<{ active: boolean }>`
  background: ${({ active }) =>
    active ? themeCssVariables.background.secondary : themeCssVariables.background.primary};
  border: 1px solid
    ${({ active }) =>
      active
        ? themeCssVariables.border.color.medium
        : themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledMeta = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledStatus = styled.span<{ enabled: boolean }>`
  color: ${({ enabled }) =>
    enabled
      ? themeCssVariables.snackBar.success.color
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

const StyledTextArea = styled.textarea`
  ${inputStyles}
  min-height: 112px;
  resize: vertical;
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

const formatDate = (value: string) => new Date(value).toLocaleString('zh-CN');

const splitList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const joinList = (values: string[] | undefined) => (values ?? []).join(', ');

const toPlaybookFormState = (playbook: SalesPlaybook): PlaybookFormState => ({
  playbookName: playbook.playbookName,
  description: playbook.description ?? '',
  enabled: playbook.enabled,
});

const toItemFormState = (item: SalesPlaybookItem): ItemFormState => ({
  itemType: item.itemType,
  title: item.title,
  content: item.content ?? '',
  attachmentIds: joinList(item.attachmentIds),
  applicableObjects: joinList(item.suggestionJson?.applicableObjects),
  nextAction: item.suggestionJson?.nextAction ?? '',
  enabled: item.enabled,
  sortOrder: item.sortOrder,
});

export const EnterpriseSalesPlaybookPage = () => {
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const [playbooks, setPlaybooks] = useState<SalesPlaybook[]>([]);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string | null>(
    null,
  );
  const [stages, setStages] = useState<SalesPlaybookStage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [items, setItems] = useState<SalesPlaybookItem[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [playbookForm, setPlaybookForm] = useState<PlaybookFormState | null>(
    null,
  );
  const [itemForm, setItemForm] = useState<ItemFormState | null>(null);
  const [newPlaybookName, setNewPlaybookName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedPlaybook = useMemo(
    () => playbooks.find((playbook) => playbook.id === selectedPlaybookId) ?? null,
    [playbooks, selectedPlaybookId],
  );

  const selectedStage = useMemo(
    () => stages.find((stage) => stage.id === selectedStageId) ?? null,
    [selectedStageId, stages],
  );

  const selectedItem = items[selectedItemIndex] ?? null;

  const loadPlaybooks = useCallback(async () => {
    const response = await enterpriseApiRequest('/api/enterprise/sales-playbooks', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load sales playbooks');
    }

    const data = (await response.json()) as SalesPlaybook[];

    setPlaybooks(data);
    setSelectedPlaybookId((currentPlaybookId) =>
      data.some((playbook) => playbook.id === currentPlaybookId)
        ? currentPlaybookId
        : data[0]?.id ?? null,
    );
  }, [enterpriseApiRequest]);

  const loadStages = useCallback(async () => {
    if (!selectedPlaybookId) {
      setStages([]);
      setSelectedStageId(null);

      return;
    }

    const response = await enterpriseApiRequest(
      `/api/enterprise/sales-playbooks/${selectedPlaybookId}/stages`,
      { credentials: 'include' },
    );

    if (!response.ok) {
      throw new Error('Failed to load playbook stages');
    }

    const data = (await response.json()) as SalesPlaybookStage[];

    setStages(data);
    setSelectedStageId((currentStageId) =>
      data.some((stage) => stage.id === currentStageId)
        ? currentStageId
        : data[0]?.id ?? null,
    );
  }, [enterpriseApiRequest, selectedPlaybookId]);

  const loadItems = useCallback(async () => {
    if (!selectedStageId) {
      setItems([]);

      return;
    }

    const response = await enterpriseApiRequest(
      `/api/enterprise/sales-playbook-stages/${selectedStageId}/items`,
      { credentials: 'include' },
    );

    if (!response.ok) {
      throw new Error('Failed to load playbook items');
    }

    setItems((await response.json()) as SalesPlaybookItem[]);
    setSelectedItemIndex(0);
  }, [enterpriseApiRequest, selectedStageId]);

  useEffect(() => {
    loadPlaybooks().catch(() =>
      enqueueErrorSnackBar({ message: '无法加载销售助手流程' }),
    );
  }, [enqueueErrorSnackBar, loadPlaybooks]);

  useEffect(() => {
    loadStages().catch(() =>
      enqueueErrorSnackBar({ message: '无法加载销售阶段' }),
    );
  }, [enqueueErrorSnackBar, loadStages]);

  useEffect(() => {
    loadItems().catch(() =>
      enqueueErrorSnackBar({ message: '无法加载阶段内容' }),
    );
  }, [enqueueErrorSnackBar, loadItems]);

  useEffect(() => {
    setPlaybookForm(selectedPlaybook ? toPlaybookFormState(selectedPlaybook) : null);
  }, [selectedPlaybook]);

  useEffect(() => {
    setItemForm(selectedItem ? toItemFormState(selectedItem) : null);
  }, [selectedItem]);

  const createPlaybook = async () => {
    if (!newPlaybookName.trim()) {
      enqueueErrorSnackBar({ message: '请输入流程名称' });

      return;
    }

    setIsSaving(true);

    try {
      const response = await enterpriseApiRequest('/api/enterprise/sales-playbooks', {
        body: JSON.stringify({
          playbookName: newPlaybookName,
          description: '自定义销售标准流程',
          enabled: true,
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create playbook');
      }

      setNewPlaybookName('');
      enqueueSuccessSnackBar({ message: '销售流程已创建' });
      await loadPlaybooks();
    } catch {
      enqueueErrorSnackBar({ message: '创建销售流程失败' });
    } finally {
      setIsSaving(false);
    }
  };

  const savePlaybook = async () => {
    if (!selectedPlaybook || !playbookForm) {
      return;
    }

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/sales-playbooks/${selectedPlaybook.id}`,
        {
          body: JSON.stringify(playbookForm),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PATCH',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to save playbook');
      }

      enqueueSuccessSnackBar({ message: '销售流程已保存' });
      await loadPlaybooks();
    } catch {
      enqueueErrorSnackBar({ message: '保存销售流程失败' });
    }
  };

  const saveStages = async () => {
    if (!selectedPlaybook) {
      return;
    }

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/sales-playbooks/${selectedPlaybook.id}/stages`,
        {
          body: JSON.stringify({ stages }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PUT',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to save stages');
      }

      enqueueSuccessSnackBar({ message: '销售阶段已保存' });
      await loadStages();
    } catch {
      enqueueErrorSnackBar({ message: '保存销售阶段失败' });
    }
  };

  const saveItems = async () => {
    if (!selectedStage || !itemForm) {
      return;
    }

    const nextItems = items.map((item, index) =>
      index === selectedItemIndex
        ? {
            ...item,
            itemType: itemForm.itemType,
            title: itemForm.title,
            content: itemForm.content,
            attachmentIds: splitList(itemForm.attachmentIds),
            suggestionJson: {
              applicableObjects: splitList(itemForm.applicableObjects),
              nextAction: itemForm.nextAction,
            },
            enabled: itemForm.enabled,
            sortOrder: itemForm.sortOrder,
          }
        : item,
    );

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/sales-playbook-stages/${selectedStage.id}/items`,
        {
          body: JSON.stringify({ items: nextItems }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PUT',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to save items');
      }

      enqueueSuccessSnackBar({ message: '阶段内容已保存' });
      await loadItems();
    } catch {
      enqueueErrorSnackBar({ message: '保存阶段内容失败' });
    }
  };

  const updateStage = (index: number, patch: Partial<SalesPlaybookStage>) => {
    setStages(
      stages.map((stage, stageIndex) =>
        stageIndex === index ? { ...stage, ...patch } : stage,
      ),
    );
  };

  const addStage = () => {
    setStages([
      ...stages,
      {
        stageName: '新阶段',
        stageCode: `stage-${stages.length + 1}`,
        sortOrder: stages.length + 1,
        enabled: true,
      },
    ]);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        itemType: 'script',
        title: '新话术',
        content: '',
        attachmentIds: [],
        suggestionJson: { applicableObjects: ['lead'] },
        sortOrder: items.length + 1,
        enabled: true,
      },
    ]);
    setSelectedItemIndex(items.length);
  };

  return (
    <EnterprisePermissionGuard>
      <EnterpriseShell title="企业管理 / 销售助手管理" sidebar={buildSidebar()}>
        <StyledGrid>
          <StyledPanel>
            <StyledHeader>
              <div>
                <StyledTitle>谈单指南</StyledTitle>
                <StyledDescription>
                  配置销售标准流程、阶段、环节、话术、文档和建议。业务侧可通过阶段读取当前销售助手内容，用于商机、询盘和客户跟进页。
                </StyledDescription>
              </div>
              <StyledActionRow>
                <Button title="使用指南" />
                <Button title="谈单指南设置" />
              </StyledActionRow>
            </StyledHeader>
          </StyledPanel>

          <StyledContentGrid>
            <StyledPanel>
              <StyledSubTitle>销售标准流程</StyledSubTitle>
              <StyledForm>
                <StyledField>
                  <StyledLabel>流程名称</StyledLabel>
                  <StyledInput
                    onChange={(event) => setNewPlaybookName(event.target.value)}
                    placeholder="例如 外贸标准谈单流程"
                    value={newPlaybookName}
                  />
                </StyledField>
                <Button
                  accent="blue"
                  disabled={isSaving}
                  title="新建流程"
                  onClick={() => void createPlaybook()}
                />
              </StyledForm>
              <StyledList>
                {playbooks.map((playbook) => (
                  <StyledListItem
                    active={playbook.id === selectedPlaybookId}
                    key={playbook.id}
                    onClick={() => setSelectedPlaybookId(playbook.id)}
                    type="button"
                  >
                    <strong>{playbook.playbookName}</strong>
                    <StyledMeta>{playbook.description ?? '无描述'}</StyledMeta>
                    <StyledMeta>
                      <StyledStatus enabled={playbook.enabled}>
                        {playbook.enabled ? '启用' : '停用'}
                      </StyledStatus>{' '}
                      · {formatDate(playbook.updatedAt)}
                    </StyledMeta>
                  </StyledListItem>
                ))}
              </StyledList>
            </StyledPanel>

            <StyledPanel>
              <StyledSubTitle>阶段维护</StyledSubTitle>
              {playbookForm && (
                <StyledForm>
                  <StyledField>
                    <StyledLabel>流程名称</StyledLabel>
                    <StyledInput
                      onChange={(event) =>
                        setPlaybookForm({
                          ...playbookForm,
                          playbookName: event.target.value,
                        })
                      }
                      value={playbookForm.playbookName}
                    />
                  </StyledField>
                  <StyledField>
                    <StyledLabel>说明</StyledLabel>
                    <StyledTextArea
                      onChange={(event) =>
                        setPlaybookForm({
                          ...playbookForm,
                          description: event.target.value,
                        })
                      }
                      value={playbookForm.description}
                    />
                  </StyledField>
                  <StyledCheckbox>
                    <input
                      checked={playbookForm.enabled}
                      onChange={(event) =>
                        setPlaybookForm({
                          ...playbookForm,
                          enabled: event.target.checked,
                        })
                      }
                      type="checkbox"
                    />
                    启用流程
                  </StyledCheckbox>
                  <Button title="保存流程" onClick={() => void savePlaybook()} />
                </StyledForm>
              )}
              <StyledHeader>
                <StyledSubTitle>阶段列表</StyledSubTitle>
                <Button title="新增阶段" onClick={addStage} />
              </StyledHeader>
              <StyledTable>
                <thead>
                  <tr>
                    <th>顺序</th>
                    <th>阶段</th>
                    <th>启用</th>
                  </tr>
                </thead>
                <tbody>
                  {stages.map((stage, index) => (
                    <tr key={`${stage.id ?? 'new'}-${index}`}>
                      <td>
                        <StyledInput
                          onChange={(event) =>
                            updateStage(index, {
                              sortOrder: Number(event.target.value) || index + 1,
                            })
                          }
                          type="number"
                          value={stage.sortOrder}
                        />
                      </td>
                      <td>
                        <StyledStageFieldGroup
                          active={stage.id === selectedStageId}
                          onClick={() => setSelectedStageId(stage.id ?? null)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setSelectedStageId(stage.id ?? null);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <StyledInput
                            onChange={(event) =>
                              updateStage(index, { stageName: event.target.value })
                            }
                            value={stage.stageName}
                          />
                          <StyledInput
                            onChange={(event) =>
                              updateStage(index, { stageCode: event.target.value })
                            }
                            value={stage.stageCode}
                          />
                        </StyledStageFieldGroup>
                      </td>
                      <td>
                        <input
                          checked={stage.enabled}
                          onChange={(event) =>
                            updateStage(index, { enabled: event.target.checked })
                          }
                          type="checkbox"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </StyledTable>
              <Button title="保存阶段排序" onClick={() => void saveStages()} />
            </StyledPanel>

            <StyledGrid>
              <StyledPanel>
                <StyledHeader>
                  <div>
                    <StyledSubTitle>
                      {selectedStage?.stageName ?? '阶段内容'}
                    </StyledSubTitle>
                    <StyledDescription>
                      当前阶段下的话术、文档和建议会被业务侧读取接口返回。
                    </StyledDescription>
                  </div>
                  <Button title="新增内容" onClick={addItem} />
                </StyledHeader>
                <StyledTabs>
                  {items.map((item, index) => (
                    <StyledTab
                      active={index === selectedItemIndex}
                      key={`${item.id ?? 'new'}-${index}`}
                      onClick={() => setSelectedItemIndex(index)}
                      type="button"
                    >
                      {item.title || '未命名'}
                    </StyledTab>
                  ))}
                </StyledTabs>
                {items.length === 0 && (
                  <StyledEmpty>当前阶段暂无内容，点击新增内容。</StyledEmpty>
                )}
              </StyledPanel>

              <StyledPanel>
                <StyledSubTitle>内容编辑</StyledSubTitle>
                {itemForm ? (
                  <StyledForm>
                    <StyledField>
                      <StyledLabel>内容类型</StyledLabel>
                      <StyledSelect
                        onChange={(event) =>
                          setItemForm({ ...itemForm, itemType: event.target.value })
                        }
                        value={itemForm.itemType}
                      >
                        <option value="script">话术</option>
                        <option value="document">文档</option>
                        <option value="suggestion">建议</option>
                        <option value="checklist">检查项</option>
                      </StyledSelect>
                    </StyledField>
                    <StyledField>
                      <StyledLabel>标题</StyledLabel>
                      <StyledInput
                        onChange={(event) =>
                          setItemForm({ ...itemForm, title: event.target.value })
                        }
                        value={itemForm.title}
                      />
                    </StyledField>
                    <StyledField>
                      <StyledLabel>话术或说明</StyledLabel>
                      <StyledTextArea
                        onChange={(event) =>
                          setItemForm({ ...itemForm, content: event.target.value })
                        }
                        value={itemForm.content}
                      />
                    </StyledField>
                    <StyledField>
                      <StyledLabel>附件 ID，逗号分隔</StyledLabel>
                      <StyledInput
                        onChange={(event) =>
                          setItemForm({
                            ...itemForm,
                            attachmentIds: event.target.value,
                          })
                        }
                        value={itemForm.attachmentIds}
                      />
                    </StyledField>
                    <StyledField>
                      <StyledLabel>适用对象，逗号分隔</StyledLabel>
                      <StyledInput
                        onChange={(event) =>
                          setItemForm({
                            ...itemForm,
                            applicableObjects: event.target.value,
                          })
                        }
                        placeholder="lead,opportunity,customer,order"
                        value={itemForm.applicableObjects}
                      />
                    </StyledField>
                    <StyledField>
                      <StyledLabel>建议动作</StyledLabel>
                      <StyledInput
                        onChange={(event) =>
                          setItemForm({ ...itemForm, nextAction: event.target.value })
                        }
                        placeholder="create_follow_up_task"
                        value={itemForm.nextAction}
                      />
                    </StyledField>
                    <StyledCheckbox>
                      <input
                        checked={itemForm.enabled}
                        onChange={(event) =>
                          setItemForm({ ...itemForm, enabled: event.target.checked })
                        }
                        type="checkbox"
                      />
                      启用内容
                    </StyledCheckbox>
                    <Button
                      accent="blue"
                      title="保存阶段内容"
                      onClick={() => void saveItems()}
                    />
                  </StyledForm>
                ) : (
                  <StyledEmpty>选择或新增一条阶段内容。</StyledEmpty>
                )}
              </StyledPanel>
            </StyledGrid>
          </StyledContentGrid>
        </StyledGrid>
      </EnterpriseShell>
    </EnterprisePermissionGuard>
  );
};

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
