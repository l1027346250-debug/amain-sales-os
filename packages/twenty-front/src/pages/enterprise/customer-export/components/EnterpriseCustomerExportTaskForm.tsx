import { styled } from '@linaria/react';

import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type EnterpriseCustomerExportTaskFormProps = {
  accountOwnerId: string;
  canCreateExport: boolean;
  hasValidationErrors: boolean;
  isPreviewLoading: boolean;
  isSaving: boolean;
  keyword: string;
  previewCount: number | null;
  taskName: string;
  onAccountOwnerIdChange: (accountOwnerId: string) => void;
  onCreateExportJob: () => void | Promise<void>;
  onKeywordChange: (keyword: string) => void;
  onPreviewCount: () => void | Promise<void>;
  onTaskNameChange: (taskName: string) => void;
};

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

const StyledActionCell = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

export const EnterpriseCustomerExportTaskForm = ({
  accountOwnerId,
  canCreateExport,
  hasValidationErrors,
  isPreviewLoading,
  isSaving,
  keyword,
  previewCount,
  taskName,
  onAccountOwnerIdChange,
  onCreateExportJob,
  onKeywordChange,
  onPreviewCount,
  onTaskNameChange,
}: EnterpriseCustomerExportTaskFormProps) => (
  <>
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
          onChange={(event) => onTaskNameChange(event.target.value)}
        />
      </StyledField>

      <StyledField>
        <StyledLabel>关键词</StyledLabel>
        <StyledInput
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
        />
      </StyledField>

      <StyledField>
        <StyledLabel>负责人 ID</StyledLabel>
        <StyledInput
          value={accountOwnerId}
          onChange={(event) => onAccountOwnerIdChange(event.target.value)}
        />
      </StyledField>

      <StyledActionCell>
        <Button
          disabled={hasValidationErrors}
          title={isPreviewLoading ? '计算中...' : '预估数量'}
          onClick={() => void onPreviewCount()}
        />
        <Button
          accent="blue"
          disabled={isSaving || !canCreateExport || hasValidationErrors}
          title={isSaving ? '提交中...' : '创建任务'}
          onClick={() => void onCreateExportJob()}
        />
      </StyledActionCell>
    </StyledFormGrid>
  </>
);
