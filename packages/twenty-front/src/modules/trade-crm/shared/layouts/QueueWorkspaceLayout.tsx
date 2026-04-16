import { styled } from '@linaria/react';
import { Link } from 'react-router-dom';

import { MainContainerLayoutWithSidePanel } from '@/object-record/components/MainContainerLayoutWithSidePanel';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import {
  type FilterSidebarItem,
  FilterSidebar,
} from '@/trade-crm/shared/components/FilterSidebar';
import {
  type PageHeaderTab,
  PageHeaderTabs,
} from '@/trade-crm/shared/components/PageHeaderTabs';
import {
  type RecordInsightItem,
  RecordInsightPanel,
} from '@/trade-crm/shared/components/RecordInsightPanel';
import { TradeCrmAiDock } from '@/trade-crm/shared/components/TradeCrmAiDock';
import { TradeCrmLocaleSwitch } from '@/trade-crm/shared/components/TradeCrmLocaleSwitch';
import { useTradeCrmLocale } from '@/trade-crm/shared/hooks/useTradeCrmLocale';
import { type TradeWorkspaceContext } from '@/trade-crm/shared/TradeWorkspaceContext';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export type QueueWorkspaceCard = {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryActionLabel?: string;
};

type QueueWorkspaceLayoutProps = {
  title: string;
  heroTitle: string;
  heroDescription: string;
  heroPills: string[];
  heroSummaryTitle?: string;
  heroSummaryText?: string;
  tabs: PageHeaderTab[];
  sidebarTitle: string;
  sidebarItems: FilterSidebarItem[];
  cards: QueueWorkspaceCard[];
  insightTitle: string;
  insightDescription: string;
  insights: RecordInsightItem[];
  workspaceContext?: TradeWorkspaceContext;
};

const StyledContent = styled.div`
  background: ${tradeCrmUiTheme.colors.page};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[5]};
  min-height: 100%;
  padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[4]}
    ${themeCssVariables.spacing[5]};
`;

const StyledHero = styled.section`
  background:
    radial-gradient(circle at top right, rgba(28, 28, 28, 0.03), transparent 24%),
    linear-gradient(180deg, ${tradeCrmUiTheme.colors.surface}, ${tradeCrmUiTheme.colors.page});
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  overflow: hidden;
  padding: ${themeCssVariables.spacing[5]};
  position: relative;

  &::before {
    background: linear-gradient(135deg, rgba(28, 28, 28, 0.04), transparent);
    content: '';
    inset: 0;
    pointer-events: none;
    position: absolute;
  }
`;

const StyledHeroTopRow = styled.div`
  align-items: flex-start;
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: minmax(0, 1.4fr) minmax(240px, 0.8fr);
  position: relative;
  z-index: 1;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const StyledHeroCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-width: 0;
`;

const StyledHeroEyebrow = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const StyledHeroTitle = styled.h2`
  color: ${tradeCrmUiTheme.colors.ink};
  font-family: ${tradeCrmUiTheme.typography.display};
  font-size: 34px;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.08;
  margin: 0;
  text-wrap: balance;
`;

const StyledHeroDescription = styled.p`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  line-height: 1.7;
  margin: 0;
  max-width: 820px;
`;

const StyledHeroSummary = styled.div`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.card};
  box-shadow: ${tradeCrmUiTheme.shadow.soft};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledHeroSummaryTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const StyledHeroSummaryText = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

const StyledPillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  position: relative;
  z-index: 1;
`;

const StyledPill = styled.div`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledWorkspace = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: 260px minmax(0, 1fr) 320px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const StyledMainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledCardGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
`;

const StyledCard = styled.div`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.card};
  box-shadow: none;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
  overflow: hidden;
  padding: ${themeCssVariables.spacing[4]};
  position: relative;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease;

  &::before {
    background: ${tradeCrmUiTheme.colors.ink};
    content: '';
    height: 3px;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
  }

  &:hover {
    background: ${tradeCrmUiTheme.colors.page};
    border-color: ${tradeCrmUiTheme.colors.borderStrong};
    transform: translateY(-2px);
  }
`;

const StyledCardTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledCardDescription = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.7;
`;

const StyledActionLink = styled(Link)`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  text-decoration: none;
  transition: color 160ms ease;

  &:hover {
    color: ${tradeCrmUiTheme.colors.inkMuted};
  }

  &:focus-visible {
    outline: 2px solid ${tradeCrmUiTheme.colors.focusRing};
    outline-offset: 2px;
  }
`;

const StyledActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  margin-top: auto;
`;

export const QueueWorkspaceLayout = ({
  title,
  heroTitle,
  heroDescription,
  heroPills,
  heroSummaryTitle,
  heroSummaryText,
  tabs,
  sidebarTitle,
  sidebarItems,
  cards,
  insightTitle,
  insightDescription,
  insights,
  workspaceContext,
}: QueueWorkspaceLayoutProps) => {
  const { tr } = useTradeCrmLocale();

  return (
    <PageContainer>
      <PageHeader title={tr(title)}>
        <TradeCrmLocaleSwitch />
      </PageHeader>
      <MainContainerLayoutWithSidePanel>
        <StyledContent>
          <StyledHero>
            <PageHeaderTabs
              tabs={tabs.map((tab) => ({
                ...tab,
                label: tr(tab.label),
              }))}
            />
            <StyledHeroTopRow>
              <StyledHeroCopy>
                <StyledHeroEyebrow>{tr(`${title} workspace`)}</StyledHeroEyebrow>
                <StyledHeroTitle>{tr(heroTitle)}</StyledHeroTitle>
                <StyledHeroDescription>{tr(heroDescription)}</StyledHeroDescription>
              </StyledHeroCopy>
              <StyledHeroSummary>
                <StyledHeroSummaryTitle>
                  {tr(heroSummaryTitle ?? 'Operating intent')}
                </StyledHeroSummaryTitle>
                <StyledHeroSummaryText>
                  {tr(
                    heroSummaryText ??
                      'Keep the main column action-heavy, use the left rail to stay in the right queue, and let the right rail explain risk and next action.',
                  )}
                </StyledHeroSummaryText>
              </StyledHeroSummary>
            </StyledHeroTopRow>
            <StyledPillRow>
              {heroPills.map((pill) => (
                <StyledPill key={pill}>{tr(pill)}</StyledPill>
              ))}
            </StyledPillRow>
          </StyledHero>
          <StyledWorkspace>
            <FilterSidebar
              title={tr(sidebarTitle)}
              items={sidebarItems.map((item) => ({
                ...item,
                label: tr(item.label),
                hint: tr(item.hint),
                countLabel: item.countLabel ? tr(item.countLabel) : item.countLabel,
              }))}
            />
            <StyledMainColumn>
              <StyledCardGrid>
                {cards.map((card) => (
                  <StyledCard key={card.title}>
                    <StyledCardTitle>{tr(card.title)}</StyledCardTitle>
                    <StyledCardDescription>{tr(card.description)}</StyledCardDescription>
                    {card.href || card.secondaryHref ? (
                      <StyledActionRow>
                        {card.href ? (
                          <StyledActionLink to={card.href}>
                            {tr(card.actionLabel ?? 'Open queue')}
                          </StyledActionLink>
                        ) : null}
                        {card.secondaryHref ? (
                          <StyledActionLink to={card.secondaryHref}>
                            {tr(card.secondaryActionLabel ?? 'Open detail')}
                          </StyledActionLink>
                        ) : null}
                      </StyledActionRow>
                    ) : null}
                  </StyledCard>
                ))}
              </StyledCardGrid>
            </StyledMainColumn>
            <RecordInsightPanel
              title={tr(insightTitle)}
              description={tr(insightDescription)}
              items={insights.map((item) => ({
                ...item,
                label: tr(item.label),
                value: tr(item.value),
                description: tr(item.description),
              }))}
            />
          </StyledWorkspace>
        </StyledContent>
        <TradeCrmAiDock
          context={
            workspaceContext ?? {
              workspace: tr(title),
            }
          }
        />
      </MainContainerLayoutWithSidePanel>
    </PageContainer>
  );
};
