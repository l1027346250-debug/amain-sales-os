import { useCallback, useEffect, useMemo, useState } from 'react';

import { styled } from '@linaria/react';

import { EnterprisePermissionGuard } from '@/enterprise/shared/components/EnterprisePermissionGuard';
import { EnterpriseShell } from '@/enterprise/shared/components/EnterpriseShell';
import { enterpriseNavigationGroups } from '@/enterprise/shared/constants/enterpriseNavigation';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type EnterpriseField = {
  id: string;
  fieldCode: string;
  fieldName: string;
};

type EnterpriseCustomerExportJob = {
  id: string;
  taskName: string;
  selectedFieldCodes: string[];
  customerCount: number | null;
  status: string;
  fileUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
};

const baseCustomerExportFields = [
  { fieldCode: 'name', fieldName: '客户名称' },
  { fieldCode: 'domainName', fieldName: '网站域名' },
  { fieldCode: 'accountOwnerId', fieldName: '负责人' },
  { fieldCode: 'createdAt', fieldName: '创建时间' },
];

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

const StyledFormGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 1fr 280px 220px auto;

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

const StyledInput = styled.input`
  ${inputStyles}
`;

const StyledMultiSelect = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const StyledFieldOption = styled.label`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  display: inline-flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledMetric = styled.div`
  align-items: center;
  display: inline-flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMetricValue = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
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
  gap: ${themeCssVariables.spacing[2]};
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

const buildSidebar = () =>
  enterpriseNavigationGroups.map((section) => ({
    title: section.label,
    items: section.items.map((item) => item.label),
  }));

const hasProcessingJobs = (jobs: EnterpriseCustomerExportJob[]) =>
  jobs.some((job) => job.status === 'pending' || job.status === 'running');

export const EnterpriseCustomerExportPage = () => {
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const [jobs, setJobs] = useState<EnterpriseCustomerExportJob[]>([]);
  const [fieldOptions, setFieldOptions] = useState(baseCustomerExportFields);
  const [taskName, setTaskName] = useState('客户导出任务');
  const [keyword, setKeyword] = useState('');
  const [accountOwnerId, setAccountOwnerId] = useState('');
  const [selectedFieldCodes, setSelectedFieldCodes] = useState<string[]>(
    baseCustomerExportFields.map((field) => field.fieldCode),
  );
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const sidebar = useMemo(buildSidebar, []);

  const loadJobs = useCallback(async () => {
    const response = await fetch('/api/enterprise/customer-export/jobs', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load customer export jobs');
    }

    const data = (await response.json()) as EnterpriseCustomerExportJob[];

    setJobs(data);
  }, []);

  const loadFieldOptions = useCallback(async () => {
    const response = await fetch('/api/enterprise/fields?entityType=customer', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to load customer export fields');
    }

    const customFields = (await response.json()) as EnterpriseField[];
    const mergedFieldOptions = [
      ...baseCustomerExportFields,
      ...customFields.map((field) => ({
        fieldCode: field.fieldCode,
        fieldName: field.fieldName,
      })),
    ];

    setFieldOptions(mergedFieldOptions);
    setSelectedFieldCodes((currentFieldCodes) => {
      if (currentFieldCodes.length > 0) {
        return currentFieldCodes;
      }

      return mergedFieldOptions.map((field) => field.fieldCode);
    });
  }, []);

  useEffect(() => {
    void Promise.all([loadJobs(), loadFieldOptions()]).catch(() =>
      enqueueErrorSnackBar({ message: '无法加载客户导出页面数据' }),
    );
  }, [enqueueErrorSnackBar, loadFieldOptions, loadJobs]);

  useEffect(() => {
    if (!hasProcessingJobs(jobs)) {
      return;
    }

    const pollingTimer = window.setInterval(() => {
      void loadJobs().catch(() => undefined);
    }, 3000);

    return () => window.clearInterval(pollingTimer);
  }, [jobs, loadJobs]);

  const runPreviewCount = async () => {
    setIsPreviewLoading(true);

    try {
      const response = await fetch(
        '/api/enterprise/customer-export/preview-count',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keyword: keyword.trim() || undefined,
            accountOwnerId: accountOwnerId.trim() || undefined,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to preview customer export count');
      }

      const data = (await response.json()) as {
        estimatedCustomerCount: number;
      };

      setPreviewCount(data.estimatedCustomerCount);
    } catch {
      enqueueErrorSnackBar({ message: '无法预估客户导出数量' });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const createExportJob = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/enterprise/customer-export/jobs', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskName,
          filter: {
            keyword: keyword.trim() || undefined,
            accountOwnerId: accountOwnerId.trim() || undefined,
          },
          selectedFieldCodes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create customer export job');
      }

      enqueueSuccessSnackBar({ message: '客户导出任务已入队' });
      await loadJobs();
    } catch {
      enqueueErrorSnackBar({ message: '创建客户导出任务失败' });
    } finally {
      setIsSaving(false);
    }
  };

  const requeueExportJob = async (job: EnterpriseCustomerExportJob) => {
    try {
      const response = await fetch(
        `/api/enterprise/customer-export/jobs/${job.id}/enqueue`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to enqueue customer export job');
      }

      enqueueSuccessSnackBar({ message: '客户导出任务已重新入队' });
      await loadJobs();
    } catch {
      enqueueErrorSnackBar({ message: '重新执行客户导出任务失败' });
    }
  };

  const downloadExportJob = async (job: EnterpriseCustomerExportJob) => {
    try {
      const response = await fetch(
        `/api/enterprise/customer-export/jobs/${job.id}/download`,
        {
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to download customer export');
      }

      const fileBlob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const fileNameMatch = contentDisposition?.match(/filename="([^"]+)"/);
      const fileName =
        fileNameMatch?.[1] ?? `${job.taskName || 'customer-export'}.csv`;
      const downloadUrl = window.URL.createObjectURL(fileBlob);
      const anchorElement = document.createElement('a');

      anchorElement.href = downloadUrl;
      anchorElement.download = fileName;
      anchorElement.click();
      window.URL.revokeObjectURL(downloadUrl);
      enqueueSuccessSnackBar({ message: '客户导出文件已下载' });
    } catch {
      enqueueErrorSnackBar({ message: '下载客户导出文件失败' });
    }
  };

  const renderStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '待执行';
      case 'running':
        return '生成中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      case 'expired':
        return '已过期';
      default:
        return status;
    }
  };

  const toggleFieldCode = (fieldCode: string) => {
    setSelectedFieldCodes((currentFieldCodes) =>
      currentFieldCodes.includes(fieldCode)
        ? currentFieldCodes.filter((value) => value !== fieldCode)
        : [...currentFieldCodes, fieldCode],
    );
  };

  return (
    <EnterprisePermissionGuard>
      <EnterpriseShell title="客户导出" sidebar={sidebar}>
        <StyledGrid>
          <StyledHero>
            <StyledHeroTitle>客户导出中心</StyledHeroTitle>
            <StyledHeroText>
              当前版本已经接通后台任务、状态轮询和 CSV 下载。创建任务后系统会自动入队执行，任务完成后再提供下载。
            </StyledHeroText>
          </StyledHero>

          <StyledPanel>
            <StyledHeader>
              <div>
                <StyledTitle>创建导出任务</StyledTitle>
                <StyledDescription>
                  当前支持按关键词和负责人筛选客户，并支持系统字段与企业管理自定义字段一起导出。
                </StyledDescription>
              </div>
              <Button
                variant="secondary"
                title="刷新任务"
                onClick={() => void loadJobs()}
              />
            </StyledHeader>

            <StyledFormGrid>
              <StyledField>
                <StyledLabel>任务名称</StyledLabel>
                <StyledInput
                  value={taskName}
                  onChange={(event) => setTaskName(event.target.value)}
                />
              </StyledField>

              <StyledField>
                <StyledLabel>关键词</StyledLabel>
                <StyledInput
                  value={keyword}
                  placeholder="按客户名称模糊筛选"
                  onChange={(event) => setKeyword(event.target.value)}
                />
              </StyledField>

              <StyledField>
                <StyledLabel>负责人 ID</StyledLabel>
                <StyledInput
                  value={accountOwnerId}
                  placeholder="可留空"
                  onChange={(event) => setAccountOwnerId(event.target.value)}
                />
              </StyledField>
            </StyledFormGrid>

            <div>
              <StyledLabel>导出字段</StyledLabel>
              <StyledMultiSelect>
                {fieldOptions.map((field) => (
                  <StyledFieldOption key={field.fieldCode}>
                    <input
                      checked={selectedFieldCodes.includes(field.fieldCode)}
                      type="checkbox"
                      onChange={() => toggleFieldCode(field.fieldCode)}
                    />
                    {field.fieldName}
                    <span>({field.fieldCode})</span>
                  </StyledFieldOption>
                ))}
              </StyledMultiSelect>
            </div>

            <StyledHeader>
              <StyledMetric>
                <StyledLabel>预估客户数</StyledLabel>
                <StyledMetricValue>
                  {previewCount === null ? '-' : previewCount}
                </StyledMetricValue>
              </StyledMetric>

              <div style={{ display: 'flex', gap: themeCssVariables.spacing[3] }}>
                <Button
                  variant="secondary"
                  title="预估数量"
                  disabled={isPreviewLoading}
                  onClick={runPreviewCount}
                />
                <Button
                  title="创建任务"
                  disabled={selectedFieldCodes.length === 0 || isSaving}
                  onClick={createExportJob}
                />
              </div>
            </StyledHeader>

            <StyledHint>
              创建后任务会自动进入后台队列。状态为“已完成”时即可下载 CSV，状态为“失败”时可重新入队。
            </StyledHint>
          </StyledPanel>

          <StyledPanel>
            <StyledHeader>
              <div>
                <StyledTitle>导出任务列表</StyledTitle>
                <StyledDescription>
                  展示当前工作区创建过的客户导出任务，并反映后台执行状态。
                </StyledDescription>
              </div>
            </StyledHeader>

            {jobs.length === 0 ? (
              <StyledEmpty>当前还没有客户导出任务。</StyledEmpty>
            ) : (
              <StyledTable>
                <thead>
                  <tr>
                    <th>任务名称</th>
                    <th>客户数</th>
                    <th>字段数</th>
                    <th>状态</th>
                    <th>创建时间</th>
                    <th>错误信息</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td>{job.taskName}</td>
                      <td>{job.customerCount ?? '-'}</td>
                      <td>{job.selectedFieldCodes.length}</td>
                      <td>
                        <StyledStatus
                          tone={
                            job.status === 'failed'
                              ? 'danger'
                              : job.status === 'completed'
                                ? 'success'
                                : 'neutral'
                          }
                        >
                          {renderStatusLabel(job.status)}
                        </StyledStatus>
                      </td>
                      <td>{new Date(job.createdAt).toLocaleString('zh-CN')}</td>
                      <td>{job.errorMessage ?? '-'}</td>
                      <td>
                        <StyledActionCell>
                          {job.status === 'completed' ? (
                            <Button
                              variant="secondary"
                              title="下载"
                              onClick={() => void downloadExportJob(job)}
                            />
                          ) : job.status === 'failed' ? (
                            <Button
                              variant="secondary"
                              title="重新执行"
                              onClick={() => void requeueExportJob(job)}
                            />
                          ) : (
                            <Button
                              variant="secondary"
                              title="处理中"
                              disabled
                            />
                          )}
                        </StyledActionCell>
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
