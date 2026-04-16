import { styled } from '@linaria/react';
import { Link } from 'react-router-dom';

import { MainContainerLayoutWithSidePanel } from '@/object-record/components/MainContainerLayoutWithSidePanel';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
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

export type EntityWorkspaceSection = {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
};

type EntityWorkspaceLayoutProps = {
  title: string;
  heroTitle: string;
  heroDescription: string;
  tabs: PageHeaderTab[];
  sections: EntityWorkspaceSection[];
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
    background: linear-gradient(120deg, rgba(28, 28, 28, 0.03), transparent);
    content: '';
    inset: 0;
    pointer-events: none;
    position: absolute;
  }
`;

const StyledHeroCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-width: 0;
  position: relative;
  z-index: 1;
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

const StyledWorkspace = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: minmax(0, 1fr) 320px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const StyledSectionStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledSection = styled.div`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.card};
  box-shadow: none;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
  padding: ${themeCssVariables.spacing[4]};
  position: relative;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease;

  &::before {
    background: ${tradeCrmUiTheme.colors.ink};
    border-radius: ${tradeCrmUiTheme.radius.pill};
    content: '';
    height: 12px;
    left: ${themeCssVariables.spacing[4]};
    position: absolute;
    top: ${themeCssVariables.spacing[4]};
    width: 12px;
  }

  &:hover {
    background: ${tradeCrmUiTheme.colors.page};
    border-color: ${tradeCrmUiTheme.colors.borderStrong};
    transform: translateY(-2px);
  }
`;

const StyledSectionTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin-left: ${themeCssVariables.spacing[4]};
  min-width: 0;
`;

const StyledSectionDescription = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
  margin-left: ${themeCssVariables.spacing[4]};
`;

const StyledActionLink = styled(Link)`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin-top: auto;
  margin-left: ${themeCssVariables.spacing[4]};
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

export const EntityWorkspaceLayout = ({
  title,
  heroTitle,
  heroDescription,
  tabs,
  sections,
  insightTitle,
  insightDescription,
  insights,
  workspaceContext,
}: EntityWorkspaceLayoutProps) => {
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
            <StyledHeroCopy>
              <StyledHeroEyebrow>{tr(`${title} operating center`)}</StyledHeroEyebrow>
              <StyledHeroTitle>{tr(heroTitle)}</StyledHeroTitle>
              <StyledHeroDescription>{tr(heroDescription)}</StyledHeroDescription>
            </StyledHeroCopy>
          </StyledHero>
          <StyledWorkspace>
            <StyledSectionStack>
              {sections.map((section) => (
                <StyledSection key={section.title}>
                  <StyledSectionTitle>{tr(section.title)}</StyledSectionTitle>
                  <StyledSectionDescription>
                    {tr(section.description)}
                  </StyledSectionDescription>
                  {section.href ? (
                    <StyledActionLink to={section.href}>
                      {tr(section.actionLabel ?? 'Open')}
                    </StyledActionLink>
                  ) : null}
                </StyledSection>
              ))}
            </StyledSectionStack>
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
