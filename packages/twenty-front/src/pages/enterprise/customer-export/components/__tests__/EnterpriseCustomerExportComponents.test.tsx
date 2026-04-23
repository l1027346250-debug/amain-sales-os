import { fireEvent, render, screen } from '@testing-library/react';

import { EnterpriseCustomerExportFieldSelection } from '~/pages/enterprise/customer-export/components/EnterpriseCustomerExportFieldSelection';
import { EnterpriseCustomerExportJobList } from '~/pages/enterprise/customer-export/components/EnterpriseCustomerExportJobList';
import { EnterpriseCustomerExportTaskForm } from '~/pages/enterprise/customer-export/components/EnterpriseCustomerExportTaskForm';
import { type EnterpriseCustomerExportJob } from '~/pages/enterprise/customer-export/types/enterprise-customer-export.types';

jest.mock('twenty-ui/input', () => ({
  Button: ({
    disabled,
    title,
    onClick,
  }: {
    disabled?: boolean;
    title: string;
    onClick?: () => void;
  }) => (
    <button disabled={disabled} type="button" onClick={onClick}>
      {title}
    </button>
  ),
}));

const createExportJob = (
  overrides: Partial<EnterpriseCustomerExportJob>,
): EnterpriseCustomerExportJob => ({
  id: 'export-job',
  taskName: 'Export customers',
  selectedFieldCodes: ['name', 'domainName'],
  customerCount: 12,
  status: 'completed',
  fileUrl: null,
  fileExpiresAt: '2026-04-23T10:00:00.000Z',
  retryCount: 0,
  errorMessage: null,
  createdAt: '2026-04-23T09:00:00.000Z',
  ...overrides,
});

describe('EnterpriseCustomerExportFieldSelection', () => {
  it('should prevent unselecting the last selected export field', () => {
    const onSelectedFieldCodesChange = jest.fn();

    render(
      <EnterpriseCustomerExportFieldSelection
        fieldOptions={[
          { fieldCode: 'name', fieldName: 'Name' },
          { fieldCode: 'domainName', fieldName: 'Domain' },
        ]}
        selectedFieldCodes={['name']}
        onSelectedFieldCodesChange={onSelectedFieldCodesChange}
      />,
    );

    const selectedCheckbox = screen.getByLabelText('Name');

    expect(selectedCheckbox).toBeDisabled();

    fireEvent.click(selectedCheckbox);

    expect(onSelectedFieldCodesChange).not.toHaveBeenCalled();
  });

  it('should emit the next field code list when selecting and unselecting fields', () => {
    const onSelectedFieldCodesChange = jest.fn();
    const { rerender } = render(
      <EnterpriseCustomerExportFieldSelection
        fieldOptions={[
          { fieldCode: 'name', fieldName: 'Name' },
          { fieldCode: 'domainName', fieldName: 'Domain' },
        ]}
        selectedFieldCodes={['name']}
        onSelectedFieldCodesChange={onSelectedFieldCodesChange}
      />,
    );

    fireEvent.click(screen.getByLabelText('Domain'));

    expect(onSelectedFieldCodesChange).toHaveBeenCalledWith([
      'name',
      'domainName',
    ]);

    rerender(
      <EnterpriseCustomerExportFieldSelection
        fieldOptions={[
          { fieldCode: 'name', fieldName: 'Name' },
          { fieldCode: 'domainName', fieldName: 'Domain' },
        ]}
        selectedFieldCodes={['name', 'domainName']}
        onSelectedFieldCodesChange={onSelectedFieldCodesChange}
      />,
    );

    fireEvent.click(screen.getByLabelText('Domain'));

    expect(onSelectedFieldCodesChange).toHaveBeenLastCalledWith(['name']);
  });
});

describe('EnterpriseCustomerExportTaskForm', () => {
  it('should disable preview and create actions when validation fails', () => {
    render(
      <EnterpriseCustomerExportTaskForm
        accountOwnerId=""
        canCreateExport={true}
        hasValidationErrors={true}
        isPreviewLoading={false}
        isSaving={false}
        keyword=""
        previewCount={null}
        taskName="Export customers"
        onAccountOwnerIdChange={jest.fn()}
        onCreateExportJob={jest.fn()}
        onKeywordChange={jest.fn()}
        onPreviewCount={jest.fn()}
        onTaskNameChange={jest.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button');

    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).toBeDisabled();
  });

  it('should disable create action when create permission is missing', () => {
    render(
      <EnterpriseCustomerExportTaskForm
        accountOwnerId=""
        canCreateExport={false}
        hasValidationErrors={false}
        isPreviewLoading={false}
        isSaving={false}
        keyword=""
        previewCount={10}
        taskName="Export customers"
        onAccountOwnerIdChange={jest.fn()}
        onCreateExportJob={jest.fn()}
        onKeywordChange={jest.fn()}
        onPreviewCount={jest.fn()}
        onTaskNameChange={jest.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button');

    expect(buttons[0]).toBeEnabled();
    expect(buttons[1]).toBeDisabled();
  });
});

describe('EnterpriseCustomerExportJobList', () => {
  it('should disable download action when download permission is missing', () => {
    const onDownloadExportJob = jest.fn();

    render(
      <EnterpriseCustomerExportJobList
        canCreateExport={true}
        canDownloadExport={false}
        jobs={[createExportJob({ status: 'completed' })]}
        onDownloadExportJob={onDownloadExportJob}
        onRequeueExportJob={jest.fn()}
      />,
    );

    const downloadButton = screen.getByRole('button');

    expect(downloadButton).toBeDisabled();

    fireEvent.click(downloadButton);

    expect(onDownloadExportJob).not.toHaveBeenCalled();
  });

  it('should call requeue action for failed jobs when create permission exists', () => {
    const failedJob = createExportJob({
      id: 'failed-job',
      status: 'failed',
    });
    const onRequeueExportJob = jest.fn();

    render(
      <EnterpriseCustomerExportJobList
        canCreateExport={true}
        canDownloadExport={false}
        jobs={[failedJob]}
        onDownloadExportJob={jest.fn()}
        onRequeueExportJob={onRequeueExportJob}
      />,
    );

    fireEvent.click(screen.getByRole('button'));

    expect(onRequeueExportJob).toHaveBeenCalledWith(failedJob);
  });
});
