import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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

type RecycleRecord = {
  id: string;
  resourceType: string;
  resourceId: string;
  resourceTitle: string | null;
  deletedPayload: Record<string, unknown>;
  deletedByWorkspaceMemberId: string | null;
  deletedAt: string;
  recoverableUntil: string | null;
  restoredAt: string | null;
  purgedAt: string | null;
  status: 'deleted' | 'restored' | 'purged';
};

type RecycleResponse = {
  items: RecycleRecord[];
  page: number;
  limit: number;
  total: number;
};

const recycleResourceTypes = [
  { key: 'email', label: '邮件' },
  { key: 'document', label: '文档' },
  { key: 'product', label: '产品' },
  { key: 'sales-order', label: '销售订单' },
  { key: 'quote', label: '报价单' },
  { key: 'payment', label: '回款单' },
];

const statusLabels = {
  deleted: '待恢复',
  restored: '已恢复',
  purged: '已清空',
};

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
    active
      ? themeCssVariables.color.blue
      : themeCssVariables.background.secondary};
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

const StyledToolbar = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
`;

const StyledSelect = styled.select`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  min-height: 36px;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledContentGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: minmax(0, 1fr) 360px;

  @media (max-width: 1080px) {
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

const StyledActionCell = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledStatus = styled.span<{ tone: 'danger' | 'neutral' | 'success' }>`
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
  padding: ${themeCssVariables.spacing[6]} 0;
  text-align: center;
`;

const StyledSnapshot = styled.pre`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: ${themeCssVariables.text.lineHeight.md};
  margin: 0;
  max-height: 420px;
  overflow: auto;
  padding: ${themeCssVariables.spacing[3]};
  white-space: pre-wrap;
`;

const buildSidebar = () =>
  enterpriseNavigationGroups.map((section) => ({
    title: section.label,
    items: section.items.map((item) => item.label),
  }));

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString('zh-CN') : '-';

const getRecordTitle = (record: RecycleRecord) =>
  record.resourceTitle || `${record.resourceType} / ${record.resourceId}`;

const getStatusTone = (status: RecycleRecord['status']) =>
  status === 'deleted' ? 'danger' : status === 'restored' ? 'success' : 'neutral';

export const EnterpriseRecycleBinPage = () => {
  const { resourceType } = useParams();
  const navigate = useNavigate();
  const activeResourceType = resourceType ?? 'email';
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const { hasEnterprisePermission } = useEnterprisePermissions();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const [status, setStatus] = useState('deleted');
  const [records, setRecords] = useState<RecycleRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canPurgeRecycle = hasEnterprisePermission(
    enterprisePermissionCodes.recyclePurge,
  );
  const canRestoreRecycle = hasEnterprisePermission(
    enterprisePermissionCodes.recycleRestore,
  );

  const activeResourceLabel =
    recycleResourceTypes.find((item) => item.key === activeResourceType)?.label ??
    activeResourceType;
  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedRecordId) ?? null,
    [records, selectedRecordId],
  );

  const loadRecords = useCallback(async () => {
    setIsLoading(true);

    try {
      const searchParams = new URLSearchParams({
        status,
        limit: '50',
      });
      const response = await enterpriseApiRequest(
        `/api/enterprise/recycle/${activeResourceType}?${searchParams.toString()}`,
        { credentials: 'include' },
      );

      if (!response.ok) {
        throw new Error('Failed to load enterprise recycle records');
      }

      const data = (await response.json()) as RecycleResponse;

      setRecords(data.items);
      setTotal(data.total);
      setSelectedRecordId((currentRecordId) =>
        data.items.some((record) => record.id === currentRecordId)
          ? currentRecordId
          : data.items[0]?.id ?? null,
      );
    } catch {
      enqueueErrorSnackBar({ message: '无法加载回收箱记录' });
    } finally {
      setIsLoading(false);
    }
  }, [
    activeResourceType,
    enqueueErrorSnackBar,
    enterpriseApiRequest,
    status,
  ]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const restoreRecord = async (record: RecycleRecord) => {
    if (!canRestoreRecycle) {
      enqueueErrorSnackBar({ message: '没有恢复回收站记录的权限' });

      return;
    }

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/recycle/${record.resourceType}/${record.id}/restore`,
        {
          credentials: 'include',
          method: 'POST',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to restore recycle record');
      }

      enqueueSuccessSnackBar({ message: '记录已恢复' });
      await loadRecords();
    } catch {
      enqueueErrorSnackBar({ message: '恢复记录失败' });
    }
  };

  const purgeRecord = async (record: RecycleRecord) => {
    if (!canPurgeRecycle) {
      enqueueErrorSnackBar({ message: '没有清空回收站记录的权限' });

      return;
    }

    if (!window.confirm('确认永久清空该记录？该操作会写入审计日志。')) {
      return;
    }

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/recycle/${record.resourceType}/${record.id}`,
        {
          credentials: 'include',
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to purge recycle record');
      }

      enqueueSuccessSnackBar({ message: '记录已清空' });
      await loadRecords();
    } catch {
      enqueueErrorSnackBar({ message: '清空记录失败' });
    }
  };

  const purgeResourceType = async () => {
    if (!canPurgeRecycle) {
      enqueueErrorSnackBar({ message: '没有批量清空回收站记录的权限' });

      return;
    }

    if (!window.confirm(`确认清空所有 ${activeResourceLabel} 回收记录？`)) {
      return;
    }

    try {
      const response = await enterpriseApiRequest(
        `/api/enterprise/recycle/${activeResourceType}`,
        {
          credentials: 'include',
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to purge recycle resource type');
      }

      enqueueSuccessSnackBar({ message: `${activeResourceLabel} 回收记录已清空` });
      await loadRecords();
    } catch {
      enqueueErrorSnackBar({ message: '批量清空失败' });
    }
  };

  return (
    <EnterprisePermissionGuard
      requiredPermission={enterprisePermissionCodes.recycleRead}
    >
      <EnterpriseShell title="企业管理 / 回收箱" sidebar={buildSidebar()}>
        <StyledGrid>
          <StyledPanel>
            <StyledHeader>
              <div>
                <StyledTitle>回收箱</StyledTitle>
                <StyledDescription>
                  集中管理邮件、文档、产品、销售订单、报价单和回款单的删除快照。恢复和清空都会进入企业管理审计日志。
                </StyledDescription>
              </div>
              <Button
                accent="danger"
                disabled={
                  records.length === 0 || status !== 'deleted' || !canPurgeRecycle
                }
                title={`一键清空${activeResourceLabel}`}
                onClick={() => void purgeResourceType()}
              />
            </StyledHeader>
            <StyledTabs>
              {recycleResourceTypes.map((item) => (
                <StyledTab
                  active={item.key === activeResourceType}
                  key={item.key}
                  onClick={() => navigate(`/enterprise/data/recycle/${item.key}`)}
                  type="button"
                >
                  {item.label}
                </StyledTab>
              ))}
            </StyledTabs>
          </StyledPanel>

          <StyledPanel>
            <StyledToolbar>
              <div>
                {isLoading
                  ? '加载中...'
                  : `${activeResourceLabel} ${statusLabels[status as RecycleRecord['status']] ?? status}：${total} 条`}
              </div>
              <StyledSelect
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                <option value="deleted">待恢复</option>
                <option value="restored">已恢复</option>
                <option value="purged">已清空</option>
              </StyledSelect>
            </StyledToolbar>

            <StyledContentGrid>
              <div>
                <StyledTable>
                  <thead>
                    <tr>
                      <th>资源</th>
                      <th>删除时间</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <button
                            onClick={() => setSelectedRecordId(record.id)}
                            type="button"
                          >
                            {getRecordTitle(record)}
                          </button>
                        </td>
                        <td>{formatDate(record.deletedAt)}</td>
                        <td>
                          <StyledStatus tone={getStatusTone(record.status)}>
                            {statusLabels[record.status]}
                          </StyledStatus>
                        </td>
                        <td>
                          <StyledActionCell>
                            <Button
                              disabled={
                                record.status !== 'deleted' || !canRestoreRecycle
                              }
                              title="恢复"
                              onClick={() => void restoreRecord(record)}
                            />
                            <Button
                              disabled={record.status === 'purged' || !canPurgeRecycle}
                              title="清空"
                              onClick={() => void purgeRecord(record)}
                            />
                          </StyledActionCell>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </StyledTable>
                {records.length === 0 && (
                  <StyledEmpty>当前分类暂无回收记录。</StyledEmpty>
                )}
              </div>

              <StyledPanel>
                <StyledTitle>删除快照</StyledTitle>
                {selectedRecord ? (
                  <>
                    <StyledDescription>
                      {getRecordTitle(selectedRecord)} · 删除于{' '}
                      {formatDate(selectedRecord.deletedAt)}
                    </StyledDescription>
                    <StyledSnapshot>
                      {JSON.stringify(selectedRecord.deletedPayload, null, 2)}
                    </StyledSnapshot>
                  </>
                ) : (
                  <StyledEmpty>选择一条记录查看快照。</StyledEmpty>
                )}
              </StyledPanel>
            </StyledContentGrid>
          </StyledPanel>
        </StyledGrid>
      </EnterpriseShell>
    </EnterprisePermissionGuard>
  );
};
