import { styled } from '@linaria/react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { CommandMenuItemMoreActionsButton } from '@/command-menu-item/server-items/display/components/CommandMenuItemMoreActionsButton';
import { RecordShowCommandMenu } from '@/command-menu-item/components/RecordShowCommandMenu';
import { CommandMenuComponentInstanceContext } from '@/command-menu/states/contexts/CommandMenuComponentInstanceContext';
import { TimelineActivityContext } from '@/activities/timeline-activities/contexts/TimelineActivityContext';
import { MAIN_CONTEXT_STORE_INSTANCE_ID } from '@/context-store/constants/MainContextStoreInstanceId';
import { ContextStoreComponentInstanceContext } from '@/context-store/states/contexts/ContextStoreComponentInstanceContext';
import { isLayoutCustomizationModeEnabledState } from '@/layout-customization/states/isLayoutCustomizationModeEnabledState';
import { MainContainerLayoutWithSidePanel } from '@/object-record/components/MainContainerLayoutWithSidePanel';
import { RecordComponentInstanceContextsWrapper } from '@/object-record/components/RecordComponentInstanceContextsWrapper';
import { PageLayoutRecordPageRenderer } from '@/object-record/record-show/components/PageLayoutRecordPageRenderer';
import { RecordShowPageSSESubscribeEffect } from '@/object-record/record-show/components/RecordShowPageSSESubscribeEffect';
import { useRecordShowPage } from '@/object-record/record-show/hooks/useRecordShowPage';
import { computeRecordShowComponentInstanceId } from '@/object-record/record-show/utils/computeRecordShowComponentInstanceId';
import { PageHeaderToggleSidePanelButton } from '@/ui/layout/page-header/components/PageHeaderToggleSidePanelButton';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { RecordShowPageHeader } from '~/pages/object-record/RecordShowPageHeader';
import { RecordShowPageTitle } from '~/pages/object-record/RecordShowPageTitle';
import { FeatureFlagKey } from '~/generated-metadata/graphql';

const StyledMailContextBanner = styled.section`
  align-items: flex-start;
  background: #f7fbff;
  border: 1px solid rgba(10, 106, 255, 0.12);
  border-radius: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
  margin-bottom: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledMailContextCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  max-width: 780px;
`;

const StyledMailContextEyebrow = styled.div`
  color: #0a6aff;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const StyledMailContextTitle = styled.div`
  color: #1e2126;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledMailContextDescription = styled.div`
  color: #66768f;
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
`;

const StyledMailContextMeta = styled.div`
  color: #334055;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMailContextChip = styled.div`
  background: rgba(10, 106, 255, 0.08);
  border-radius: 999px;
  font-size: ${themeCssVariables.font.size.sm};
  padding: 8px 12px;
`;

const StyledMailContextActions = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMailContextLink = styled(Link)`
  background: #ffffff;
  border: 1px solid rgba(31, 64, 112, 0.1);
  border-radius: 999px;
  color: #1f4070;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding: 10px 14px;
  text-decoration: none;
`;

export const RecordShowPage = () => {
  const isLayoutCustomizationModeEnabled = useAtomStateValue(
    isLayoutCustomizationModeEnabledState,
  );
  const isCommandMenuItemEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_COMMAND_MENU_ITEM_ENABLED,
  );

  const parameters = useParams<{
    objectNameSingular: string;
    objectRecordId: string;
  }>();
  const [searchParams] = useSearchParams();

  const { objectNameSingular, objectRecordId } = useRecordShowPage(
    parameters.objectNameSingular ?? '',
    parameters.objectRecordId ?? '',
  );

  const sourceWorkspace = searchParams.get('sourceWorkspace')?.trim() ?? null;
  const sourceHref = searchParams.get('sourceHref')?.trim() ?? null;
  const sourceLabel = searchParams.get('sourceLabel')?.trim() ?? null;
  const sourceTrail = searchParams.get('sourceTrail')?.trim() ?? null;
  const sourceThreadId =
    sourceTrail?.startsWith('thread:') === true
      ? sourceTrail.slice('thread:'.length)
      : null;
  const isMailTaskContext =
    objectNameSingular === CoreObjectNameSingular.Task &&
    (sourceWorkspace === 'mail' ||
      sourceHref?.includes('/trade-crm/mail') === true ||
      sourceLabel?.toLowerCase().startsWith('mail /') === true);

  const recordShowComponentInstanceId =
    computeRecordShowComponentInstanceId(objectRecordId);

  return (
    <RecordComponentInstanceContextsWrapper
      componentInstanceId={recordShowComponentInstanceId}
    >
      <ContextStoreComponentInstanceContext.Provider
        value={{ instanceId: MAIN_CONTEXT_STORE_INSTANCE_ID }}
      >
        <CommandMenuComponentInstanceContext.Provider
          value={{ instanceId: recordShowComponentInstanceId }}
        >
          <PageContainer>
            <RecordShowPageTitle
              objectNameSingular={objectNameSingular}
              objectRecordId={objectRecordId}
            />
            <RecordShowPageHeader
              objectNameSingular={objectNameSingular}
              objectRecordId={objectRecordId}
            >
              <RecordShowCommandMenu />
              {isCommandMenuItemEnabled ? (
                !isLayoutCustomizationModeEnabled && (
                  <CommandMenuItemMoreActionsButton />
                )
              ) : (
                <PageHeaderToggleSidePanelButton />
              )}
            </RecordShowPageHeader>
            {isMailTaskContext ? (
              <StyledMailContextBanner>
                <StyledMailContextCopy>
                  <StyledMailContextEyebrow>
                    Mail follow-up context
                  </StyledMailContextEyebrow>
                  <StyledMailContextTitle>
                    This task was opened from the Mail pending-replies queue.
                  </StyledMailContextTitle>
                  <StyledMailContextDescription>
                    Keep the email thread, customer context, and follow-up task
                    in the same operating loop so the seller does not lose the
                    original reply obligation.
                  </StyledMailContextDescription>
                  <StyledMailContextMeta>
                    {sourceLabel ? (
                      <StyledMailContextChip>
                        Source: {sourceLabel}
                      </StyledMailContextChip>
                    ) : null}
                    {sourceThreadId ? (
                      <StyledMailContextChip>
                        Thread: {sourceThreadId}
                      </StyledMailContextChip>
                    ) : null}
                  </StyledMailContextMeta>
                </StyledMailContextCopy>
                <StyledMailContextActions>
                  {sourceHref ? (
                    <StyledMailContextLink to={sourceHref}>
                      Return to pending replies
                    </StyledMailContextLink>
                  ) : null}
                </StyledMailContextActions>
              </StyledMailContextBanner>
            ) : null}
            <MainContainerLayoutWithSidePanel>
              <TimelineActivityContext.Provider
                value={{
                  recordId: objectRecordId,
                }}
              >
                <PageLayoutRecordPageRenderer
                  targetRecordIdentifier={{
                    id: objectRecordId,
                    targetObjectNameSingular: objectNameSingular,
                  }}
                  isInSidePanel={false}
                />
                <RecordShowPageSSESubscribeEffect
                  objectNameSingular={objectNameSingular}
                  recordId={objectRecordId}
                />
              </TimelineActivityContext.Provider>
            </MainContainerLayoutWithSidePanel>
          </PageContainer>
        </CommandMenuComponentInstanceContext.Provider>
      </ContextStoreComponentInstanceContext.Provider>
    </RecordComponentInstanceContextsWrapper>
  );
};
