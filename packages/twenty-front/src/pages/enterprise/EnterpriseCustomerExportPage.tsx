import { useCallback, useEffect, useMemo, useState } from 'react';

import { styled } from '@linaria/react';

import { EnterprisePermissionGuard } from '@/enterprise/shared/components/EnterprisePermissionGuard';
import { enterprisePermissionCodes } from '@/enterprise/shared/constants/enterprisePermissions';
import { useEnterprisePermissions } from '@/enterprise/shared/hooks/useEnterprisePermissions';
import { EnterpriseShell } from '@/enterprise/shared/components/EnterpriseShell';
import { enterpriseNavigationGroups } from '@/enterprise/shared/constants/enterpriseNavigation';
import { useEnterpriseApiRequest } from '@/enterprise/shared/hooks/useEnterpriseApiRequest';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { EnterpriseCustomerExportEnterpriseFilterSection } from '~/pages/enterprise/customer-export/components/EnterpriseCustomerExportEnterpriseFilterSection';
import { EnterpriseCustomerExportFieldSelection } from '~/pages/enterprise/customer-export/components/EnterpriseCustomerExportFieldSelection';
import { EnterpriseCustomerExportJobList } from '~/pages/enterprise/customer-export/components/EnterpriseCustomerExportJobList';
import { EnterpriseCustomerExportTaskForm } from '~/pages/enterprise/customer-export/components/EnterpriseCustomerExportTaskForm';
import { useEnterpriseCustomerExportFields } from '~/pages/enterprise/customer-export/hooks/useEnterpriseCustomerExportFields';
import { type EnterpriseCustomerExportJob } from '~/pages/enterprise/customer-export/types/enterprise-customer-export.types';
import { themeCssVariables } from 'twenty-ui/theme-constants';

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
  const enterpriseApiRequest = useEnterpriseApiRequest();
  const { hasEnterprisePermission } = useEnterprisePermissions();
  const [jobs, setJobs] = useState<EnterpriseCustomerExportJob[]>([]);
  const {
    activeEnterpriseFilterSummaries,
    clearEnterpriseFilterValues,
    enterpriseFilterFieldOptionsByFieldId,
    enterpriseFilterFields,
    enterpriseFilterValidationMessages,
    enterpriseFilterValues,
    fieldOptions,
    getEnterpriseFieldFilters,
    hasEnterpriseFilterValidationErrors,
    loadFieldOptions,
    selectedFieldCodes,
    setSelectedFieldCodes,
    updateEnterpriseFilterValue,
  } = useEnterpriseCustomerExportFields();
  const [taskName, setTaskName] = useState('客户导出任务');
  const [keyword, setKeyword] = useState('');
  const [accountOwnerId, setAccountOwnerId] = useState('');
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const sidebar = useMemo(buildSidebar, []);
  const canCreateExport = hasEnterprisePermission(
    enterprisePermissionCodes.customerExportCreate,
  );
  const canDownloadExport = hasEnterprisePermission(
    enterprisePermissionCodes.customerExportDownload,
  );

  const loadJobs = useCallback(async () => {
    const response = await enterpriseApiRequest(
      '/api/enterprise/customer-export/jobs',
      {
      credentials: 'include',
      },
    );

    if (!response.ok) {
      throw new Error('Failed to load customer export jobs');
    }

    const data = (await response.json()) as EnterpriseCustomerExportJob[];

    setJobs(data);
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
    if (hasEnterpriseFilterValidationErrors) {
      enqueueErrorSnackBar({ message: '请先修正企业字段筛选条件' });

      return;
    }

    setIsPreviewLoading(true);
    const enterpriseFieldFilters = getEnterpriseFieldFilters();

    try {
      const response = await enterpriseApiRequest(
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
            enterpriseFieldFilters:
              enterpriseFieldFilters.length > 0
                ? enterpriseFieldFilters
                : undefined,
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
    if (!canCreateExport) {
      enqueueErrorSnackBar({ message: '没有创建客户导出任务的权限' });

      return;
    }

    if (hasEnterpriseFilterValidationErrors) {
      enqueueErrorSnackBar({ message: '请先修正企业字段筛选条件' });

      return;
    }

    setIsSaving(true);
    const enterpriseFieldFilters = getEnterpriseFieldFilters();

    try {
      const response = await enterpriseApiRequest(
        '/api/enterprise/customer-export/jobs',
        {
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
            enterpriseFieldFilters:
              enterpriseFieldFilters.length > 0
                ? enterpriseFieldFilters
                : undefined,
          },
          selectedFieldCodes,
        }),
        },
      );

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
    if (!canCreateExport) {
      enqueueErrorSnackBar({ message: '没有重新执行客户导出任务的权限' });

      return;
    }

    try {
      const response = await enterpriseApiRequest(
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
    if (!canDownloadExport) {
      enqueueErrorSnackBar({ message: '没有下载客户导出文件的权限' });

      return;
    }

    try {
      const response = await enterpriseApiRequest(
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

  return (
    <EnterprisePermissionGuard
      requiredPermission={enterprisePermissionCodes.customerExportRead}
    >
      <EnterpriseShell title="客户导出" sidebar={sidebar}>
        <StyledGrid>
          <StyledHero>
            <StyledHeroTitle>客户导出工作台</StyledHeroTitle>
            <StyledHeroText>
              当前链路已经支持字段选择、数量预估、后台导出、失败重试、临时签名下载链接和过期回收。
            </StyledHeroText>
          </StyledHero>

          <StyledPanel>
            <EnterpriseCustomerExportTaskForm
              accountOwnerId={accountOwnerId}
              canCreateExport={canCreateExport}
              hasValidationErrors={hasEnterpriseFilterValidationErrors}
              isPreviewLoading={isPreviewLoading}
              isSaving={isSaving}
              keyword={keyword}
              previewCount={previewCount}
              taskName={taskName}
              onAccountOwnerIdChange={setAccountOwnerId}
              onCreateExportJob={createExportJob}
              onKeywordChange={setKeyword}
              onPreviewCount={runPreviewCount}
              onTaskNameChange={setTaskName}
            />

            <EnterpriseCustomerExportEnterpriseFilterSection
              activeFilterSummaries={activeEnterpriseFilterSummaries}
              fieldOptionsByFieldId={enterpriseFilterFieldOptionsByFieldId}
              fields={enterpriseFilterFields}
              filterValues={enterpriseFilterValues}
              validationMessages={enterpriseFilterValidationMessages}
              onClearFilters={() => {
                clearEnterpriseFilterValues();
                setPreviewCount(null);
              }}
              onFilterValueChange={(fieldId, nextValue) => {
                updateEnterpriseFilterValue(fieldId, nextValue);
                setPreviewCount(null);
              }}
            />

            <EnterpriseCustomerExportFieldSelection
              fieldOptions={fieldOptions}
              selectedFieldCodes={selectedFieldCodes}
              onSelectedFieldCodesChange={setSelectedFieldCodes}
            />
          </StyledPanel>

          <StyledPanel>
            <EnterpriseCustomerExportJobList
              canCreateExport={canCreateExport}
              canDownloadExport={canDownloadExport}
              jobs={jobs}
              onDownloadExportJob={downloadExportJob}
              onRequeueExportJob={requeueExportJob}
            />
          </StyledPanel>
        </StyledGrid>
      </EnterpriseShell>
    </EnterprisePermissionGuard>
  );
};


