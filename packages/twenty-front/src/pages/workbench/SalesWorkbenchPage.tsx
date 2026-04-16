import { useLingui } from '@lingui/react/macro';
import { styled } from '@linaria/react';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';

import { LeadFirstResponseRiskBlock } from '@/workbench/components/LeadFirstResponseRiskBlock';
import { MyPipelineNeedingNextActionBlock } from '@/workbench/components/MyPipelineNeedingNextActionBlock';
import { TasksDueTodayBlock } from '@/workbench/components/TasksDueTodayBlock';
import { TodayNewLeadsBlock } from '@/workbench/components/TodayNewLeadsBlock';
import { useLeadFirstResponseRisk } from '@/workbench/hooks/useLeadFirstResponseRisk';
import { useMyPipelineNeedingNextAction } from '@/workbench/hooks/useMyPipelineNeedingNextAction';
import { useTasksDueToday } from '@/workbench/hooks/useTasksDueToday';
import { useTodayNewLeads } from '@/workbench/hooks/useTodayNewLeads';
import { PageBody } from '@/ui/layout/page/components/PageBody';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { tradeCrmUiTheme } from '../../modules/trade-crm/shared/ui/tradeCrmUiTheme';

const StyledPageContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[5]};
`;

const StyledSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledSectionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledHeroGrid = styled.section`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(0, 1.6fr) minmax(300px, 1fr);

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const StyledHeroCard = styled.div`
  background:
    radial-gradient(circle at top left, rgba(28, 28, 28, 0.04), transparent 34%),
    ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  box-shadow: ${tradeCrmUiTheme.shadow.inset};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[5]};
`;

const StyledHeroEyebrow = styled.div`
  color: ${tradeCrmUiTheme.colors.inkFaint};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  letter-spacing: 0.08em;
`;

const StyledHeroTitle = styled.h2`
  color: ${tradeCrmUiTheme.colors.ink};
  font-family: ${tradeCrmUiTheme.typography.display};
  font-size: 34px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: -0.02em;
  line-height: 1.08;
  margin: 0;
`;

const StyledHeroDescription = styled.p`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.md};
  line-height: 1.6;
  margin: 0;
  max-width: 720px;
`;

const StyledHeroMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMetaPill = styled.div`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledHeroFocusGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
`;

const StyledFocusCard = styled.div`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledFocusLabel = styled.div`
  color: ${tradeCrmUiTheme.colors.inkFaint};
  font-size: ${themeCssVariables.font.size.xs};
  letter-spacing: 0.04em;
`;

const StyledFocusValue = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  text-wrap: balance;
`;

const StyledFocusHint = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
`;

const StyledSidebarStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledSummaryCard = styled.div`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  box-shadow: ${tradeCrmUiTheme.shadow.inset};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledSummaryHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledSummaryTitle = styled.h3`
  color: ${tradeCrmUiTheme.colors.ink};
  font-family: ${tradeCrmUiTheme.typography.display};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledSummaryDescription = styled.p`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  margin: 0;
`;

const StyledMetricGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
`;

const StyledMetricCard = styled.div`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledMetricLabel = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledMetricValue = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: 24px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledMetricHint = styled.div`
  color: ${tradeCrmUiTheme.colors.inkFaint};
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.5;
`;

const StyledTwoColumnLayout = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: minmax(0, 1.65fr) minmax(280px, 0.95fr);

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const StyledPrimaryColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[5]};
`;

const StyledRightRail = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledSectionTitle = styled.h2`
  color: ${tradeCrmUiTheme.colors.ink};
  font-family: ${tradeCrmUiTheme.typography.display};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

const StyledSectionDescription = styled.p`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
  margin: 0;
`;

const StyledGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
`;

const StyledChecklist = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledChecklistRow = styled.div`
  align-items: flex-start;
  border-top: 1px solid ${tradeCrmUiTheme.colors.border};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: 20px minmax(0, 1fr);
  padding-top: ${themeCssVariables.spacing[2]};

  &:first-of-type {
    border-top: none;
    padding-top: 0;
  }
`;

const StyledChecklistDot = styled.div`
  align-items: center;
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border-radius: ${themeCssVariables.border.radius.rounded};
  color: ${tradeCrmUiTheme.colors.ink};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.xs};
  height: 20px;
  justify-content: center;
  width: 20px;
`;

const StyledChecklistContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledChecklistTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledChecklistDescription = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;
`;

const StyledPanelHint = styled.div`
  color: ${tradeCrmUiTheme.colors.inkFaint};
  font-size: ${themeCssVariables.font.size.xs};
  line-height: 1.5;
`;

export const SalesWorkbenchPage = () => {
  const { t } = useLingui();
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const { totalRiskCount } = useLeadFirstResponseRisk();
  const { totalTasksDueTodayCount } = useTasksDueToday();
  const { totalTodayNewLeadsCount } = useTodayNewLeads();
  const { totalMyPipelineNeedingNextActionCount } =
    useMyPipelineNeedingNextAction();

  const sellerFullName = [
    currentWorkspaceMember?.name?.firstName,
    currentWorkspaceMember?.name?.lastName,
  ]
    .filter((namePart): namePart is string => Boolean(namePart?.trim()))
    .join(' ')
    .trim();

  const sellerName =
    sellerFullName ||
    currentWorkspaceMember?.userEmail?.split('@')[0] ||
    String(t`Sales teammate`);

  const now = new Date();
  const todayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(now);
  const localTimeLabel = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);
  const totalAttentionCount =
    totalRiskCount +
    totalTasksDueTodayCount +
    totalTodayNewLeadsCount +
    totalMyPipelineNeedingNextActionCount;

  const topPriorityLabel =
    totalRiskCount > 0
      ? t`Protect lead first response SLA`
      : totalTasksDueTodayCount > 0
        ? t`Clear today's due tasks`
        : totalTodayNewLeadsCount > 0
          ? t`Qualify today's new leads`
          : totalMyPipelineNeedingNextActionCount > 0
            ? t`Add next actions to open opportunities`
            : t`Queues are stable right now`;

  return (
    <PageContainer>
      <PageHeader title={t`Sales Workbench`} />
      <PageBody>
        <StyledPageContent>
          <StyledHeroGrid>
            <StyledHeroCard>
              <div>
                <StyledHeroEyebrow>{t`Daily operating view`}</StyledHeroEyebrow>
                <StyledHeroTitle>
                  {t`Hi ${sellerName}, here is what needs movement first.`}
                </StyledHeroTitle>
              </div>
              <StyledHeroDescription>
                {t`This workbench is organized like an action desk: urgent follow-up first, same-day lead qualification second, and pipeline hygiene after that.`}
              </StyledHeroDescription>
              <StyledHeroMetaRow>
                <StyledMetaPill>{todayLabel}</StyledMetaPill>
                <StyledMetaPill>{t`Local time ${localTimeLabel}`}</StyledMetaPill>
                <StyledMetaPill>{t`Open attention items ${totalAttentionCount}`}</StyledMetaPill>
              </StyledHeroMetaRow>
              <StyledHeroFocusGrid>
                <StyledFocusCard>
                  <StyledFocusLabel>{t`Top priority`}</StyledFocusLabel>
                  <StyledFocusValue>{topPriorityLabel}</StyledFocusValue>
                  <StyledFocusHint>
                    {t`Use the left-side action queues first so overdue follow-up does not spill into the next workday.`}
                  </StyledFocusHint>
                </StyledFocusCard>
                <StyledFocusCard>
                  <StyledFocusLabel>{t`Operating rhythm`}</StyledFocusLabel>
                  <StyledFocusValue>{t`Action first, detail second`}</StyledFocusValue>
                  <StyledFocusHint>
                    {t`Finish risky leads and due tasks before you review slower-moving pipeline work.`}
                  </StyledFocusHint>
                </StyledFocusCard>
              </StyledHeroFocusGrid>
            </StyledHeroCard>

            <StyledSidebarStack>
              <StyledSummaryCard>
                <StyledSummaryHeader>
                  <StyledSummaryTitle>{t`Queue Snapshot`}</StyledSummaryTitle>
                  <StyledSummaryDescription>
                    {t`A compact summary of the seller queues that need visible action today.`}
                  </StyledSummaryDescription>
                </StyledSummaryHeader>
                <StyledMetricGrid>
                  <StyledMetricCard>
                    <StyledMetricLabel>{t`First response risk`}</StyledMetricLabel>
                    <StyledMetricValue>{totalRiskCount}</StyledMetricValue>
                    <StyledMetricHint>
                      {t`Leads close to or beyond the first-response SLA.`}
                    </StyledMetricHint>
                  </StyledMetricCard>
                  <StyledMetricCard>
                    <StyledMetricLabel>{t`Tasks due today`}</StyledMetricLabel>
                    <StyledMetricValue>{totalTasksDueTodayCount}</StyledMetricValue>
                    <StyledMetricHint>
                      {t`Tasks that should be closed or moved forward today.`}
                    </StyledMetricHint>
                  </StyledMetricCard>
                  <StyledMetricCard>
                    <StyledMetricLabel>{t`Today new leads`}</StyledMetricLabel>
                    <StyledMetricValue>{totalTodayNewLeadsCount}</StyledMetricValue>
                    <StyledMetricHint>
                      {t`Fresh inbound leads that still need qualification.`}
                    </StyledMetricHint>
                  </StyledMetricCard>
                  <StyledMetricCard>
                    <StyledMetricLabel>{t`Pipeline hygiene`}</StyledMetricLabel>
                    <StyledMetricValue>
                      {totalMyPipelineNeedingNextActionCount}
                    </StyledMetricValue>
                    <StyledMetricHint>
                      {t`Open opportunities still missing a next action plan.`}
                    </StyledMetricHint>
                  </StyledMetricCard>
                </StyledMetricGrid>
              </StyledSummaryCard>
            </StyledSidebarStack>
          </StyledHeroGrid>

          <StyledTwoColumnLayout>
            <StyledPrimaryColumn>
              <StyledSection>
                <StyledSectionHeader>
                  <StyledSectionTitle>{t`Immediate Action`}</StyledSectionTitle>
                  <StyledSectionDescription>
                    {t`Prioritize the leads and tasks that need attention today before they age into larger follow-up risk.`}
                  </StyledSectionDescription>
                </StyledSectionHeader>
                <StyledGrid>
                  <LeadFirstResponseRiskBlock />
                  <TasksDueTodayBlock />
                  <TodayNewLeadsBlock />
                </StyledGrid>
              </StyledSection>

              <StyledSection>
                <StyledSectionHeader>
                  <StyledSectionTitle>{t`Pipeline Follow-Through`}</StyledSectionTitle>
                  <StyledSectionDescription>
                    {t`Keep open opportunities moving by surfacing the deals that are missing their next action plan.`}
                  </StyledSectionDescription>
                </StyledSectionHeader>
                <StyledGrid>
                  <MyPipelineNeedingNextActionBlock />
                </StyledGrid>
              </StyledSection>
            </StyledPrimaryColumn>

            <StyledRightRail>
              <StyledSummaryCard>
                <StyledSummaryHeader>
                  <StyledSummaryTitle>{t`Today's Focus`}</StyledSummaryTitle>
                  <StyledSummaryDescription>
                    {t`A simple operating checklist inspired by the sales daily SOP and Xiaoman's action-first workspace structure.`}
                  </StyledSummaryDescription>
                </StyledSummaryHeader>
                <StyledChecklist>
                  <StyledChecklistRow>
                    <StyledChecklistDot>1</StyledChecklistDot>
                    <StyledChecklistContent>
                      <StyledChecklistTitle>
                        {t`Reply to risky leads first`}
                      </StyledChecklistTitle>
                      <StyledChecklistDescription>
                        {t`${totalRiskCount} leads currently need first-response protection.`}
                      </StyledChecklistDescription>
                    </StyledChecklistContent>
                  </StyledChecklistRow>
                  <StyledChecklistRow>
                    <StyledChecklistDot>2</StyledChecklistDot>
                    <StyledChecklistContent>
                      <StyledChecklistTitle>
                        {t`Close today's due tasks`}
                      </StyledChecklistTitle>
                      <StyledChecklistDescription>
                        {t`${totalTasksDueTodayCount} tasks are due today and should stay visible until cleared.`}
                      </StyledChecklistDescription>
                    </StyledChecklistContent>
                  </StyledChecklistRow>
                  <StyledChecklistRow>
                    <StyledChecklistDot>3</StyledChecklistDot>
                    <StyledChecklistContent>
                      <StyledChecklistTitle>
                        {t`Qualify fresh inbound leads`}
                      </StyledChecklistTitle>
                      <StyledChecklistDescription>
                        {t`${totalTodayNewLeadsCount} new leads were created today and should enter the working queue quickly.`}
                      </StyledChecklistDescription>
                    </StyledChecklistContent>
                  </StyledChecklistRow>
                  <StyledChecklistRow>
                    <StyledChecklistDot>4</StyledChecklistDot>
                    <StyledChecklistContent>
                      <StyledChecklistTitle>
                        {t`Set next actions on open deals`}
                      </StyledChecklistTitle>
                      <StyledChecklistDescription>
                        {t`${totalMyPipelineNeedingNextActionCount} opportunities still need a next action or next action date.`}
                      </StyledChecklistDescription>
                    </StyledChecklistContent>
                  </StyledChecklistRow>
                </StyledChecklist>
                <StyledPanelHint>
                  {t`This right rail is intentionally light: it should reinforce execution order, not replace the actionable queues on the left.`}
                </StyledPanelHint>
              </StyledSummaryCard>

              <StyledSummaryCard>
                <StyledSummaryHeader>
                  <StyledSummaryTitle>{t`Why this layout changed`}</StyledSummaryTitle>
                  <StyledSummaryDescription>
                    {t`The previous version exposed useful blocks, but it still felt like a set of cards. This draft shifts the page closer to a true sales workspace.`}
                  </StyledSummaryDescription>
                </StyledSummaryHeader>
                <StyledChecklist>
                  <StyledChecklistRow>
                    <StyledChecklistDot>A</StyledChecklistDot>
                    <StyledChecklistContent>
                      <StyledChecklistTitle>
                        {t`Left side stays action-heavy`}
                      </StyledChecklistTitle>
                      <StyledChecklistDescription>
                        {t`Queues remain the primary interaction surface so a seller can open records and act immediately.`}
                      </StyledChecklistDescription>
                    </StyledChecklistContent>
                  </StyledChecklistRow>
                  <StyledChecklistRow>
                    <StyledChecklistDot>B</StyledChecklistDot>
                    <StyledChecklistContent>
                      <StyledChecklistTitle>
                        {t`Right side explains the day`}
                      </StyledChecklistTitle>
                      <StyledChecklistDescription>
                        {t`Snapshot metrics and checklist guidance now make the homepage easier to understand at a glance.`}
                      </StyledChecklistDescription>
                    </StyledChecklistContent>
                  </StyledChecklistRow>
                  <StyledChecklistRow>
                    <StyledChecklistDot>C</StyledChecklistDot>
                    <StyledChecklistContent>
                      <StyledChecklistTitle>
                        {t`Next rounds can add manager and customer workspaces`}
                      </StyledChecklistTitle>
                      <StyledChecklistDescription>
                        {t`This keeps the current phase inside CRM core scope while moving the visual experience closer to Xiaoman's operating logic.`}
                      </StyledChecklistDescription>
                    </StyledChecklistContent>
                  </StyledChecklistRow>
                </StyledChecklist>
              </StyledSummaryCard>
            </StyledRightRail>
          </StyledTwoColumnLayout>
        </StyledPageContent>
      </PageBody>
    </PageContainer>
  );
};

