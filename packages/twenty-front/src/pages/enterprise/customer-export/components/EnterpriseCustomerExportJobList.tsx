import { styled } from '@linaria/react';

import {
  type EnterpriseCustomerExportJob,
  type EnterpriseCustomerExportStatusTone,
} from '~/pages/enterprise/customer-export/types/enterprise-customer-export.types';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type EnterpriseCustomerExportJobListProps = {
  canCreateExport: boolean;
  canDownloadExport: boolean;
  jobs: EnterpriseCustomerExportJob[];
  onDownloadExportJob: (job: EnterpriseCustomerExportJob) => void | Promise<void>;
  onRequeueExportJob: (job: EnterpriseCustomerExportJob) => void | Promise<void>;
};

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

const StyledStatus = styled.span<{ tone: EnterpriseCustomerExportStatusTone }>`
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
): EnterpriseCustomerExportStatusTone => {
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

export const EnterpriseCustomerExportJobList = ({
  canCreateExport,
  canDownloadExport,
  jobs,
  onDownloadExportJob,
  onRequeueExportJob,
}: EnterpriseCustomerExportJobListProps) => (
  <>
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
                      disabled={!canDownloadExport}
                      title="下载"
                      onClick={() => void onDownloadExportJob(job)}
                    />
                  ) : null}
                  {job.status === 'failed' || job.status === 'expired' ? (
                    <Button
                      disabled={!canCreateExport}
                      title="重新执行"
                      onClick={() => void onRequeueExportJob(job)}
                    />
                  ) : null}
                </StyledActionCell>
              </td>
            </tr>
          ))}
        </tbody>
      </StyledTable>
    )}
  </>
);
