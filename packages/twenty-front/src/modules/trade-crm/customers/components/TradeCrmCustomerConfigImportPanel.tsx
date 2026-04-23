import { styled } from '@linaria/react';

import { type useTradeCrmCustomerConfigDraft } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';
import {
  type TradeCrmCustomerImportJobResult,
  type useTradeCrmCustomerImportJobs,
} from '@/trade-crm/customers/hooks/useTradeCrmCustomerImportJobs';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type TradeCrmCustomerConfigImportPanelProps = {
  configDraft: ReturnType<typeof useTradeCrmCustomerConfigDraft>;
  hasUnsavedImportConfig: boolean;
  importFileName: string;
  importJobs: ReturnType<typeof useTradeCrmCustomerImportJobs>;
  onImportFileNameChange: (value: string) => void;
};

const RECOMMENDED_IMPORT_FIELDS = [
  'Company Name',
  'Contact Nickname',
  'Contact Email',
  'Company Short Name',
  'Country/Region',
  'Tag',
  'Customer Stage',
  'Customer Source',
  'Website',
  'Phone',
  'Address',
  'Customer Code',
  'Public Pool Group',
  'Facebook',
  'Twitter',
  'LinkedIn',
  'Position',
  'Gender',
];

const getImportDestinationValue = (destination: string) =>
  destination === 'public-pool' ? 'PUBLIC_POOL' : 'CUSTOMER_LIST';

const escapeCsvCell = (value: string | number | null | undefined) => {
  const normalizedValue = String(value ?? '');

  return `"${normalizedValue.replace(/"/g, '""')}"`;
};

const getImportResultCsvContent = (result: TradeCrmCustomerImportJobResult) =>
  [
    [
      'rowNumber',
      'rowLabel',
      'companyName',
      'contactEmail',
      'status',
      'message',
    ],
    ...result.rows.map((row) => [
      row.rowNumber,
      row.rowLabel,
      row.companyName,
      row.contactEmail,
      row.status,
      row.errorMessage,
    ]),
  ]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n');

const downloadImportResultCsv = (result: TradeCrmCustomerImportJobResult) => {
  const blob = new Blob([getImportResultCsvContent(result)], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = window.URL.createObjectURL(blob);
  const anchorElement = document.createElement('a');

  anchorElement.href = url;
  anchorElement.download = `customer-import-${
    result.job?.id ?? 'result'
  }-rows.csv`;
  anchorElement.click();
  window.URL.revokeObjectURL(url);
};

const StyledSplitGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 320px minmax(0, 1fr);

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

const StyledPanel = styled.section`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledPanelTitleRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  margin-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledPanelTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledPanelDescription = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
  margin-bottom: ${themeCssVariables.spacing[3]};
`;

const StyledStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledInlineComposer = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledTextInput = styled.input`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  font: inherit;
  min-height: 40px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledControlButton = styled.button<{
  $tone?: 'primary' | 'neutral' | 'danger';
}>`
  background: ${({ $tone }) =>
    $tone === 'primary'
      ? tradeCrmUiTheme.colors.borderStrong
      : $tone === 'danger'
        ? tradeCrmUiTheme.colors.surfaceInteractive
        : tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'primary'
        ? tradeCrmUiTheme.colors.borderStrong
        : $tone === 'danger'
          ? tradeCrmUiTheme.colors.borderInteractive
          : tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${({ $tone }) =>
    $tone === 'primary'
      ? tradeCrmUiTheme.colors.surface
      : $tone === 'danger'
        ? tradeCrmUiTheme.colors.ink
        : tradeCrmUiTheme.colors.ink};
  cursor: pointer;
  font: inherit;
  padding: 8px 14px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const StyledFilterButton = styled.button<{ $active: boolean }>`
  background: ${({ $active }) =>
    $active
      ? tradeCrmUiTheme.colors.borderStrong
      : tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid
    ${({ $active }) =>
      $active
        ? tradeCrmUiTheme.colors.borderStrong
        : tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${({ $active }) =>
    $active ? tradeCrmUiTheme.colors.surface : tradeCrmUiTheme.colors.inkMuted};
  cursor: pointer;
  font: inherit;
  padding: 6px 12px;
`;

const StyledTagButton = styled.button`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.ink};
  cursor: pointer;
  font: inherit;
  padding: 6px 10px;
`;

const StyledActionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledToken = styled.div`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.xs};
  padding: 4px 10px;
`;

const StyledTokenWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledStepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledStepItem = styled.div`
  border-left: 2px solid ${tradeCrmUiTheme.colors.borderStrong};
  padding-left: ${themeCssVariables.spacing[3]};
`;

const StyledStepTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin-bottom: ${themeCssVariables.spacing[1]};
`;

const StyledStepText = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

const StyledFilterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledFilterNode = styled.div`
  align-items: center;
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  display: flex;
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledNodeLabel = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledNodeCount = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledConfigNote = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

export const TradeCrmCustomerConfigImportPanel = ({
  configDraft,
  hasUnsavedImportConfig,
  importFileName,
  importJobs,
  onImportFileNameChange,
}: TradeCrmCustomerConfigImportPanelProps) => (
  <StyledSplitGrid>
    <StyledPanel>
      <StyledPanelTitleRow>
        <StyledPanelTitle>Import Defaults</StyledPanelTitle>
        {hasUnsavedImportConfig ? <StyledToken>Unsaved</StyledToken> : null}
      </StyledPanelTitleRow>
      <StyledPanelDescription>
        Save the destination and update strategy here so import setup stays
        consistent across customer settings and every import job created from
        this workspace.
      </StyledPanelDescription>
      <StyledInlineComposer>
        <StyledTextInput
          value={importFileName}
          onChange={(event) => onImportFileNameChange(event.target.value)}
          placeholder="Customer import file name"
        />
        <StyledControlButton
          type="button"
          $tone="primary"
          disabled={importFileName.trim().length === 0 || importJobs.startLoading}
          onClick={() => {
            void importJobs
              .startCustomerImportJob({
                destination: getImportDestinationValue(
                  configDraft.draft.importConfig.destination,
                ),
                fileName: importFileName,
                selectedFields: configDraft.draft.importConfig.selectedFields,
                updateExistingContacts:
                  configDraft.draft.importConfig.updateExistingContacts,
              })
              .then(() => onImportFileNameChange(''))
              .catch(() => undefined);
          }}
        >
          {importJobs.startLoading ? 'Creating...' : 'Create Import Job'}
        </StyledControlButton>
      </StyledInlineComposer>
      <StyledInlineComposer>
        <StyledFilterButton
          type="button"
          $active={configDraft.draft.importConfig.destination === 'customer-list'}
          onClick={() => configDraft.setImportDestination('customer-list')}
        >
          Customer List
        </StyledFilterButton>
        <StyledFilterButton
          type="button"
          $active={configDraft.draft.importConfig.destination === 'public-pool'}
          onClick={() => configDraft.setImportDestination('public-pool')}
        >
          Public Pool
        </StyledFilterButton>
        <StyledFilterButton
          type="button"
          $active={configDraft.draft.importConfig.updateExistingContacts}
          onClick={() =>
            configDraft.setImportUpdateExistingContacts(
              !configDraft.draft.importConfig.updateExistingContacts,
            )
          }
        >
          {configDraft.draft.importConfig.updateExistingContacts
            ? 'Update Existing Contacts'
            : 'Do Not Update Existing Contacts'}
        </StyledFilterButton>
      </StyledInlineComposer>
      <StyledStepList>
        {[
          [
            '1. Upload file',
            'Excel, CSV, and template-driven imports enter the customer module here.',
          ],
          [
            '2. Match fields',
            'Map customer, contact, source, and public-pool fields before commit.',
          ],
          [
            '3. Review results',
            'Keep success counts, failed rows, and downloadable logs together.',
          ],
        ].map(([title, text]) => (
          <StyledStepItem key={title}>
            <StyledStepTitle>{title}</StyledStepTitle>
            <StyledStepText>{text}</StyledStepText>
          </StyledStepItem>
        ))}
      </StyledStepList>
    </StyledPanel>
    <StyledPanel>
      <StyledPanelTitleRow>
        <StyledPanelTitle>Import Job Records</StyledPanelTitle>
        {hasUnsavedImportConfig ? <StyledToken>Unsaved</StyledToken> : null}
      </StyledPanelTitleRow>
      <StyledPanelDescription>
        {importJobs.loading
          ? 'Loading import jobs...'
          : `${importJobs.totalCount} persisted import job(s) in this workspace.`}
      </StyledPanelDescription>
      <StyledFilterList>
        {importJobs.jobs.slice(0, 6).map((job) => (
          <StyledFilterNode key={job.id}>
            <StyledStack>
              <StyledNodeLabel>{job.fileName}</StyledNodeLabel>
              <StyledNodeCount>
                {job.destination} / {job.status} / success {job.successCount} /
                failed {job.failedCount}
              </StyledNodeCount>
            </StyledStack>
            <StyledActionButtons>
              <StyledControlButton
                type="button"
                disabled={importJobs.saveMappingLoading}
                onClick={() => {
                  void importJobs
                    .saveCustomerImportMapping({
                      jobId: job.id,
                      mappedFields:
                        configDraft.draft.importConfig.selectedFields,
                    })
                    .catch(() => undefined);
                }}
              >
                {importJobs.saveMappingLoading ? 'Saving...' : 'Save Mapping'}
              </StyledControlButton>
              <StyledControlButton
                type="button"
                $tone="primary"
                disabled={importJobs.commitLoading}
                onClick={() => {
                  void importJobs
                    .commitCustomerImportJob({
                      jobId: job.id,
                    })
                    .catch(() => undefined);
                }}
              >
                {importJobs.commitLoading ? 'Committing...' : 'Commit'}
              </StyledControlButton>
              <StyledControlButton
                type="button"
                disabled={importJobs.resultLoading}
                onClick={() => {
                  void importJobs
                    .getCustomerImportJobResult({
                      jobId: job.id,
                    })
                    .catch(() => undefined);
                }}
              >
                {importJobs.resultLoading ? 'Loading...' : 'View Result'}
              </StyledControlButton>
            </StyledActionButtons>
            <StyledNodeCount>
              {job.executedAt?.slice(0, 16).replace('T', ' ') ?? '--'}
            </StyledNodeCount>
          </StyledFilterNode>
        ))}
        {!importJobs.loading && importJobs.jobs.length === 0 ? (
          <StyledConfigNote>
            No import job exists yet. Create one above to start a persisted
            import flow, then save mapping, commit, and review the row-level
            result here.
          </StyledConfigNote>
        ) : null}
      </StyledFilterList>
      {importJobs.activeResult ? (
        <StyledPanel>
          <StyledPanelTitleRow>
            <StyledPanelTitle>
              Import Result:{' '}
              {importJobs.activeResult.job?.fileName ?? 'Unknown job'}
            </StyledPanelTitle>
            {hasUnsavedImportConfig ? <StyledToken>Unsaved</StyledToken> : null}
          </StyledPanelTitleRow>
          <StyledPanelDescription>
            {importJobs.activeResult.job
              ? `Success ${importJobs.activeResult.job.successCount}, failed ${importJobs.activeResult.job.failedCount}, status ${importJobs.activeResult.job.status}.`
              : 'The selected import job is no longer available.'}
          </StyledPanelDescription>
          <StyledActionButtons>
            <StyledControlButton
              type="button"
              disabled={importJobs.activeResult.rows.length === 0}
              onClick={() => {
                if (!importJobs.activeResult) {
                  return;
                }

                downloadImportResultCsv(importJobs.activeResult);
              }}
            >
              Download Result CSV
            </StyledControlButton>
          </StyledActionButtons>
          <StyledFilterList>
            {importJobs.activeResult.rows.map((row) => (
              <StyledFilterNode key={row.id}>
                <StyledStack>
                  <StyledNodeLabel>
                    #{row.rowNumber} {row.rowLabel}
                  </StyledNodeLabel>
                  <StyledNodeCount>
                    {row.companyName ?? 'Company pending'} /{' '}
                    {row.contactEmail ?? 'No contact email'} / {row.status}
                  </StyledNodeCount>
                </StyledStack>
                <StyledNodeCount>
                  {row.errorMessage ?? 'No row issue'}
                </StyledNodeCount>
              </StyledFilterNode>
            ))}
            {importJobs.activeResult.rows.length === 0 ? (
              <StyledConfigNote>
                No row-level import result has been recorded for this job yet.
              </StyledConfigNote>
            ) : null}
          </StyledFilterList>
        </StyledPanel>
      ) : null}
    </StyledPanel>
    <StyledPanel>
      <StyledPanelTitleRow>
        <StyledPanelTitle>Template Fields</StyledPanelTitle>
        {hasUnsavedImportConfig ? <StyledToken>Unsaved</StyledToken> : null}
      </StyledPanelTitleRow>
      <StyledTokenWrap>
        {configDraft.draft.importConfig.selectedFields.map((field) => (
          <StyledTagButton
            key={field}
            type="button"
            onClick={() => configDraft.toggleImportField(field)}
          >
            {field} x
          </StyledTagButton>
        ))}
      </StyledTokenWrap>
      <StyledPanelDescription>
        Click a field to remove it from the default import selection. Add it
        back from the recommended field list below.
      </StyledPanelDescription>
      <StyledTokenWrap>
        {RECOMMENDED_IMPORT_FIELDS.filter(
          (field) =>
            !configDraft.draft.importConfig.selectedFields.includes(field),
        ).map((field) => (
          <StyledFilterButton
            key={field}
            type="button"
            $active={false}
            onClick={() => configDraft.toggleImportField(field)}
          >
            {field}
          </StyledFilterButton>
        ))}
      </StyledTokenWrap>
    </StyledPanel>
  </StyledSplitGrid>
);
