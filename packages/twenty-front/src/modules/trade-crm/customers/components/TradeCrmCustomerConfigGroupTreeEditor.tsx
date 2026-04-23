import { styled } from '@linaria/react';

import { type useTradeCrmCustomerConfigDraft } from '@/trade-crm/customers/hooks/useTradeCrmCustomerConfigDraft';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type TradeCrmCustomerConfigGroupTreeEditorProps = {
  configDraft: ReturnType<typeof useTradeCrmCustomerConfigDraft>;
  groupParentId: string | null;
  hasUnsavedGroups: boolean;
  newGroupLabel: string;
  onGroupParentIdChange: (value: string | null) => void;
  onNewGroupLabelChange: (value: string) => void;
};

const StyledSplitGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 320px minmax(0, 1fr);

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

const StyledStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
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

const StyledConfigNote = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
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

const StyledSelect = styled.select`
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

const StyledToken = styled.div`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.xs};
  padding: 4px 10px;
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

const StyledIndentedNode = styled(StyledFilterNode)<{ $level: 1 | 2 }>`
  margin-left: ${({ $level }) =>
    $level === 2 ? themeCssVariables.spacing[4] : 0};
`;

const StyledNodeCount = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
`;

export const TradeCrmCustomerConfigGroupTreeEditor = ({
  configDraft,
  groupParentId,
  hasUnsavedGroups,
  newGroupLabel,
  onGroupParentIdChange,
  onNewGroupLabelChange,
}: TradeCrmCustomerConfigGroupTreeEditorProps) => {
  const rootGroups = configDraft.draft.groups.filter(
    (group) => group.level === 1,
  );
  const newGroupValidationMessage = configDraft.getNewGroupValidationMessage(
    newGroupLabel,
    groupParentId,
  );

  return (
    <StyledSplitGrid>
      <StyledPanel>
        <StyledPanelTitleRow>
          <StyledPanelTitle>Group Tree Editor</StyledPanelTitle>
          {hasUnsavedGroups ? <StyledToken>Unsaved</StyledToken> : null}
        </StyledPanelTitleRow>
        <StyledPanelDescription>
          Add new root or second-level customer groups, then reorder them before
          saving. The hierarchy is persisted back into workspace customer-group
          records.
        </StyledPanelDescription>
        <StyledConfigNote>
          Root groups move as a full branch. Second-level groups only reorder
          inside the same parent.
        </StyledConfigNote>
        <StyledInlineComposer>
          <StyledTextInput
            value={newGroupLabel}
            onChange={(event) => onNewGroupLabelChange(event.target.value)}
            placeholder="Add a group label"
          />
          <StyledSelect
            value={groupParentId ?? ''}
            onChange={(event) =>
              onGroupParentIdChange(
                event.target.value.length > 0 ? event.target.value : null,
              )
            }
          >
            <option value="">Root group</option>
            {rootGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label}
              </option>
            ))}
          </StyledSelect>
          <StyledControlButton
            type="button"
            disabled={newGroupValidationMessage !== null}
            onClick={() => {
              configDraft.addGroup(newGroupLabel, groupParentId);
              onNewGroupLabelChange('');
              onGroupParentIdChange(null);
            }}
          >
            Add Group
          </StyledControlButton>
        </StyledInlineComposer>
        <StyledConfigNote>
          {newGroupValidationMessage ??
            'Use root groups for top-level segments and attach level-two groups under one root.'}
        </StyledConfigNote>
      </StyledPanel>
      <StyledStack>
        <StyledPanel>
          <StyledPanelTitleRow>
            <StyledPanelTitle>Configured Groups</StyledPanelTitle>
            {hasUnsavedGroups ? <StyledToken>Unsaved</StyledToken> : null}
          </StyledPanelTitleRow>
          {configDraft.groupValidationMessages.length > 0 ? (
            <StyledConfigNote>
              {configDraft.groupValidationMessages.join(' ')}
            </StyledConfigNote>
          ) : null}
          <StyledFilterList>
            {configDraft.draft.groups.map((group) => (
              <StyledIndentedNode key={group.id} $level={group.level}>
                <StyledInlineComposer>
                  <StyledNodeCount>
                    {group.level === 1 ? 'L1' : 'L2'}
                  </StyledNodeCount>
                  <StyledTextInput
                    value={group.label}
                    onChange={(event) =>
                      configDraft.renameGroup(group.id, event.target.value)
                    }
                  />
                  {group.level === 2 ? (
                    <StyledSelect
                      value={group.parentId ?? ''}
                      onChange={(event) => {
                        if (event.target.value.length === 0) {
                          return;
                        }

                        configDraft.changeGroupParent(
                          group.id,
                          event.target.value,
                        );
                      }}
                    >
                      {rootGroups.map((rootGroup) => (
                        <option
                          key={`${group.id}-${rootGroup.id}`}
                          value={rootGroup.id}
                          disabled={
                            rootGroup.id !== group.parentId &&
                            configDraft.getChangeGroupParentValidationMessage(
                              group.id,
                              rootGroup.id,
                            ) !== null
                          }
                        >
                          {rootGroup.label}
                        </option>
                      ))}
                    </StyledSelect>
                  ) : null}
                  {configDraft.getGroupPendingChangeMessage(group.id) ? (
                    <StyledToken>
                      {configDraft.getGroupPendingChangeMessage(group.id)}
                    </StyledToken>
                  ) : null}
                </StyledInlineComposer>
                <StyledInlineComposer>
                  <StyledControlButton
                    type="button"
                    disabled={!configDraft.canMoveGroup(group.id, 'up')}
                    onClick={() => configDraft.moveGroup(group.id, 'up')}
                  >
                    Up
                  </StyledControlButton>
                  <StyledControlButton
                    type="button"
                    disabled={!configDraft.canMoveGroup(group.id, 'down')}
                    onClick={() => configDraft.moveGroup(group.id, 'down')}
                  >
                    Down
                  </StyledControlButton>
                  <StyledControlButton
                    type="button"
                    $tone="danger"
                    onClick={() => configDraft.removeGroup(group.id)}
                  >
                    Remove
                  </StyledControlButton>
                </StyledInlineComposer>
              </StyledIndentedNode>
            ))}
          </StyledFilterList>
        </StyledPanel>
      </StyledStack>
    </StyledSplitGrid>
  );
};
