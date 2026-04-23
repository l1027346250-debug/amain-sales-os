import { styled } from '@linaria/react';

import {
  type TradeCrmCustomerConfigTagScope,
  type useTradeCrmCustomerConfigDraft,
} from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type CustomerConfigTagInputState = Record<
  TradeCrmCustomerConfigTagScope,
  string
>;

type CustomerConfigEditorState = Record<string, string>;

type TradeCrmCustomerConfigTagsPanelProps = {
  clearTagEditorValue: (key: string) => void;
  configDraft: ReturnType<typeof useTradeCrmCustomerConfigDraft>;
  hasUnsavedTags: boolean;
  newTagLabels: CustomerConfigTagInputState;
  onNewTagLabelChange: (
    scope: TradeCrmCustomerConfigTagScope,
    value: string,
  ) => void;
  onTagEditorValueChange: (key: string, value: string) => void;
  tagEditorValues: CustomerConfigEditorState;
};

type TradeCrmCustomerConfigSourcesPanelProps = {
  clearSourceEditorValue: (key: string) => void;
  configDraft: ReturnType<typeof useTradeCrmCustomerConfigDraft>;
  hasUnsavedSources: boolean;
  newSourceLabel: string;
  onNewSourceLabelChange: (value: string) => void;
  onSourceEditorValueChange: (key: string, value: string) => void;
  sourceEditorValues: CustomerConfigEditorState;
};

const TAG_SCOPES: Array<{
  scope: TradeCrmCustomerConfigTagScope;
  title: string;
}> = [
  { scope: 'company', title: 'Company Tags' },
  { scope: 'mine', title: 'My Tags' },
  { scope: 'subordinate', title: 'Subordinate Tags' },
];

const StyledColumns = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

const StyledTagButton = styled.button`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.ink};
  cursor: pointer;
  font: inherit;
  padding: 6px 10px;
`;

const StyledToken = styled.div`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.xs};
  padding: 4px 10px;
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

export const TradeCrmCustomerConfigTagsPanel = ({
  clearTagEditorValue,
  configDraft,
  hasUnsavedTags,
  newTagLabels,
  onNewTagLabelChange,
  onTagEditorValueChange,
  tagEditorValues,
}: TradeCrmCustomerConfigTagsPanelProps) => (
  <StyledColumns>
    {TAG_SCOPES.map(({ scope, title }) => (
      <StyledPanel key={scope}>
        <StyledPanelTitleRow>
          <StyledPanelTitle>{title}</StyledPanelTitle>
          {hasUnsavedTags ? <StyledToken>Unsaved</StyledToken> : null}
        </StyledPanelTitleRow>
        <StyledFilterList>
          {configDraft.draft.tags[scope].map((tag) => (
            <StyledTagButton
              key={tag}
              type="button"
              onClick={() => configDraft.removeTag(scope, tag)}
            >
              {tag} x
            </StyledTagButton>
          ))}
        </StyledFilterList>
        <StyledFilterList>
          {configDraft.draft.tags[scope].map((tag) => {
            const editorKey = `${scope}:${tag}`;
            const editedTagLabel = tagEditorValues[editorKey] ?? tag;
            const renameValidationMessage =
              configDraft.getRenameTagValidationMessage(
                scope,
                tag,
                editedTagLabel,
              );
            const isRenameReady =
              editedTagLabel.trim().length > 0 &&
              editedTagLabel.trim() !== tag.trim() &&
              renameValidationMessage === null;

            return (
              <StyledFilterNode key={`${editorKey}-controls`}>
                <StyledStack>
                  <StyledTextInput
                    value={editedTagLabel}
                    onChange={(event) =>
                      onTagEditorValueChange(editorKey, event.target.value)
                    }
                  />
                  <StyledNodeCount>
                    {renameValidationMessage ??
                      (isRenameReady
                        ? 'Rename ready. Click Rename to queue this change for save.'
                        : 'No rename change queued for this tag yet.')}
                  </StyledNodeCount>
                </StyledStack>
                <StyledInlineComposer>
                  <StyledControlButton
                    type="button"
                    disabled={!configDraft.canMoveTag(scope, tag, 'up')}
                    onClick={() => configDraft.moveTag(scope, tag, 'up')}
                  >
                    Up
                  </StyledControlButton>
                  <StyledControlButton
                    type="button"
                    disabled={!configDraft.canMoveTag(scope, tag, 'down')}
                    onClick={() => configDraft.moveTag(scope, tag, 'down')}
                  >
                    Down
                  </StyledControlButton>
                  <StyledControlButton
                    type="button"
                    disabled={!isRenameReady}
                    onClick={() => {
                      configDraft.renameTag(scope, tag, editedTagLabel);
                      clearTagEditorValue(editorKey);
                    }}
                  >
                    Rename
                  </StyledControlButton>
                  <StyledControlButton
                    type="button"
                    disabled={editedTagLabel === tag}
                    onClick={() => clearTagEditorValue(editorKey)}
                  >
                    Cancel
                  </StyledControlButton>
                  <StyledControlButton
                    type="button"
                    $tone="danger"
                    onClick={() => configDraft.removeTag(scope, tag)}
                  >
                    Remove
                  </StyledControlButton>
                </StyledInlineComposer>
              </StyledFilterNode>
            );
          })}
        </StyledFilterList>
        <StyledInlineComposer>
          <StyledTextInput
            value={newTagLabels[scope]}
            onChange={(event) => onNewTagLabelChange(scope, event.target.value)}
            placeholder={`Add ${title}`}
          />
          <StyledControlButton
            type="button"
            disabled={
              configDraft.getNewTagValidationMessage(
                scope,
                newTagLabels[scope],
              ) !== null
            }
            onClick={() => {
              configDraft.addTag(scope, newTagLabels[scope]);
              onNewTagLabelChange(scope, '');
            }}
          >
            Add
          </StyledControlButton>
        </StyledInlineComposer>
        <StyledConfigNote>
          {configDraft.getNewTagValidationMessage(scope, newTagLabels[scope]) ??
            configDraft.tagValidationMessages[scope][0] ??
            'Keep tag labels unique inside each scope so list filters and detail tags stay stable.'}
        </StyledConfigNote>
      </StyledPanel>
    ))}
  </StyledColumns>
);

export const TradeCrmCustomerConfigSourcesPanel = ({
  clearSourceEditorValue,
  configDraft,
  hasUnsavedSources,
  newSourceLabel,
  onNewSourceLabelChange,
  onSourceEditorValueChange,
  sourceEditorValues,
}: TradeCrmCustomerConfigSourcesPanelProps) => (
  <StyledPanel>
    <StyledPanelTitleRow>
      <StyledPanelTitle>Source Dictionary</StyledPanelTitle>
      {hasUnsavedSources ? <StyledToken>Unsaved</StyledToken> : null}
    </StyledPanelTitleRow>
    <StyledPanelDescription>
      Keep the same source dictionary shared by leads, customers, dedup, and
      import mapping.
    </StyledPanelDescription>
    <StyledInlineComposer>
      <StyledTextInput
        value={newSourceLabel}
        onChange={(event) => onNewSourceLabelChange(event.target.value)}
        placeholder="Add a source label"
      />
      <StyledControlButton
        type="button"
        disabled={
          configDraft.getNewSourceValidationMessage(newSourceLabel) !== null
        }
        onClick={() => {
          configDraft.addSource(newSourceLabel);
          onNewSourceLabelChange('');
        }}
      >
        Add Source
      </StyledControlButton>
    </StyledInlineComposer>
    <StyledConfigNote>
      {configDraft.getNewSourceValidationMessage(newSourceLabel) ??
        configDraft.sourceValidationMessages[0] ??
        'Source labels are shared across leads, customers, dedup, and import mapping.'}
    </StyledConfigNote>
    <StyledFilterList>
      {configDraft.draft.sources.map((source) => {
        const editedSourceLabel = sourceEditorValues[source] ?? source;
        const renameValidationMessage =
          configDraft.getRenameSourceValidationMessage(
            source,
            editedSourceLabel,
          );
        const isRenameReady =
          editedSourceLabel.trim().length > 0 &&
          editedSourceLabel.trim() !== source.trim() &&
          renameValidationMessage === null;

        return (
          <StyledFilterNode key={source}>
            <StyledStack>
              <StyledTextInput
                value={editedSourceLabel}
                onChange={(event) =>
                  onSourceEditorValueChange(source, event.target.value)
                }
              />
              <StyledNodeCount>
                {renameValidationMessage ??
                  (isRenameReady
                    ? 'Rename ready. Click Rename to queue this change for save.'
                    : 'No rename change queued for this source yet.')}
              </StyledNodeCount>
            </StyledStack>
            <StyledInlineComposer>
              <StyledControlButton
                type="button"
                disabled={!configDraft.canMoveSource(source, 'up')}
                onClick={() => configDraft.moveSource(source, 'up')}
              >
                Up
              </StyledControlButton>
              <StyledControlButton
                type="button"
                disabled={!configDraft.canMoveSource(source, 'down')}
                onClick={() => configDraft.moveSource(source, 'down')}
              >
                Down
              </StyledControlButton>
              <StyledControlButton
                type="button"
                disabled={!isRenameReady}
                onClick={() => {
                  configDraft.renameSource(source, editedSourceLabel);
                  clearSourceEditorValue(source);
                }}
              >
                Rename
              </StyledControlButton>
              <StyledControlButton
                type="button"
                disabled={editedSourceLabel === source}
                onClick={() => clearSourceEditorValue(source)}
              >
                Cancel
              </StyledControlButton>
              <StyledControlButton
                type="button"
                $tone="danger"
                onClick={() => configDraft.removeSource(source)}
              >
                Remove
              </StyledControlButton>
            </StyledInlineComposer>
          </StyledFilterNode>
        );
      })}
    </StyledFilterList>
  </StyledPanel>
);
