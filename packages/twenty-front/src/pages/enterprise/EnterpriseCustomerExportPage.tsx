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
  fileExpiresAt: string | null;
  retryCount: number;
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
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledStatus = styled.span<{ tone: 'neutral' | 'danger' | 'success' | 'warning' }>`
  color: ${({ tone }) =>
    tone === 'danger'
      ? themeCssVariables.font.color.danger
      : tone === 'success'
        ? themeCssVariables.snackBar.success.color
        : tone === 'warning'
          ? themeCssVariables.color.yellow7
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
  jobs.some(
    (job) =>
      job.status === 'pending' ||
      job.status === 'running' ||
      job.status === 'retrying',
  );

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

      enqueueSuccessSnackBar({ message: '客户导出任务已进入后台队列' });
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
        `/api/enterprise/customer-export/jobs/${job.id}/file-access`,
        {
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to get file access');
      }

      const data = (await response.json()) as {
        downloadUrl: string;
        fileName: string;
      };

      const anchorElement = document.createElement('a');
      anchorElement.href = data.downloadUrl;
      anchorElement.download = data.fileName;
      anchorElement.target = '_blank';
      anchorElement.rel = 'noreferrer';
      anchorElement.click();
      enqueueSuccessSnackBar({ message: '已生成临时下载链接' });
      await loadJobs();
    } catch {
      enqueueErrorSnackBar({ message: '获取客户导出文件失败' });
    }
  };

  const renderStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '待执行';
      case 'running':
        return '执行中';
      case 'retrying':
        return '重试中';
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

  const renderStatusTone = (
    status: string,
  ): 'neutral' | 'danger' | 'success' | 'warning' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      case 'expired':
      case 'retrying':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <EnterprisePermissionGuard>
      <EnterpriseShell title="客户导出" sidebar={sidebar}>
        <StyledGrid>
          <StyledHero>
            <StyledHeroTitle>客户导出工作台</StyledHeroTitle>
            <StyledHeroText>
              当前链路已经支持字段选择、数量预估、后台导出、失败重试、临时签名下载链接和过期回收。
            </StyledHeroText>
          </StyledHero>

          <StyledPanel>
            <StyledHeader>
              <div>
                <StyledTitle>新建导出任务</StyledTitle>
                <StyledDescription>
                  先定义筛选条件和字段范围，再把任务送入后台。导出文件默认保留 7 天，过期后会被自动清理。
                </StyledDescription>
              </div>
              <StyledMetric>
                <span>预计客户数</span>
                <StyledMetricValue>
                  {isPreviewLoading ? '...' : previewCount ?? '--'}
                </StyledMetricValue>
              </StyledMetric>
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
                  onChange={(event) => setKeyword(event.target.value)}
                />
              </StyledField>

              <StyledField>
                <StyledLabel>负责人 ID</StyledLabel>
                <StyledInput
                  value={accountOwnerId}
                  onChange={(event) => setAccountOwnerId(event.target.value)}
                />
              </StyledField>

              <StyledActionCell>
                <Button
                  title={isPreviewLoading ? '计算中...' : '预估数量'}
                  onClick={() => void runPreviewCount()}
                />
                <Button
                  accent="blue"
                  disabled={isSaving}
                  title={isSaving ? '提交中...' : '创建任务'}
                  onClick={() => void createExportJob()}
                />
              </StyledActionCell>
            </StyledFormGrid>

            <div>
              <StyledTitle>导出字段</StyledTitle>
              <StyledHint>
                基础字段和企业管理自定义字段可以混合导出。至少保留一个字段。
              </StyledHint>
            </div>

            <StyledMultiSelect>
              {fieldOptions.map((field) => {
                const checked = selectedFieldCodes.includes(field.fieldCode);

                return (
                  <StyledFieldOption key={field.fieldCode}>
                    <input
                      checked={checked}
                      type="checkbox"
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedFieldCodes((currentFieldCodes) => [
                            ...currentFieldCodes,
                            field.fieldCode,
                          ]);

                          return;
                        }

                        setSelectedFieldCodes((currentFieldCodes) =>
                          currentFieldCodes.filter(
                            (fieldCode) => fieldCode !== field.fieldCode,
                          ),
                        );
                      }}
                    />
                    <span>{field.fieldName}</span>
                  </StyledFieldOption>
                );
              })}
            </StyledMultiSelect>
          </StyledPanel>

          <StyledPanel>
            <div>
              <StyledTitle>导出任务列表</StyledTitle>
              <StyledDescription>
                完成后的文件会通过临时签名链接访问。失败任务会自动尝试重试，达到上限后再进入失败状态。
              </StyledDescription>
            </div>

            {jobs.length === 0 ? (
              <StyledEmpty>还没有客户导出任务。</StyledEmpty>
            ) : (
              <StyledTable>
                <thead>
                  <tr>
                    <th>任务</th>
                    <th>状态</th>
                    <th>客户数</th>
                    <th>字段数</th>
                    <th>过期时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <div>{job.taskName}</div>
                        <StyledHint>
                          创建时间：{new Date(job.createdAt).toLocaleString()}
                          {job.retryCount > 0 ? ` · 已重试 ${job.retryCount} 次` : ''}
                        </StyledHint>
                        {job.errorMessage ? (
                          <StyledHint>{job.errorMessage}</StyledHint>
                        ) : null}
                      </td>
                      <td>
                        <StyledStatus tone={renderStatusTone(job.status)}>
                          {renderStatusLabel(job.status)}
                        </StyledStatus>
                      </td>
                      <td>{job.customerCount ?? '--'}</td>
                      <td>{job.selectedFieldCodes.length}</td>
                      <td>
                        {job.fileExpiresAt
                          ? new Date(job.fileExpiresAt).toLocaleString()
                          : '--'}
                      </td>
                      <td>
                        <StyledActionCell>
                          {job.status === 'completed' ? (
                            <Button
                              title="下载"
                              onClick={() => void downloadExportJob(job)}
                            />
                          ) : null}
                          {job.status === 'failed' || job.status === 'expired' ? (
                            <Button
                              title="重新执行"
                              onClick={() => void requeueExportJob(job)}
                            />
                          ) : null}
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


