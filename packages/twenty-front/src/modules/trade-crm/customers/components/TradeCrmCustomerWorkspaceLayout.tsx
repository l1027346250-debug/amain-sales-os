import { styled } from '@linaria/react';
import { type ReactNode } from 'react';

import { MainContainerLayoutWithSidePanel } from '@/object-record/components/MainContainerLayoutWithSidePanel';
import {
  type FilterSidebarItem,
  FilterSidebar,
} from '@/trade-crm/shared/components/FilterSidebar';
import {
  type PageHeaderTab,
  PageHeaderTabs,
} from '@/trade-crm/shared/components/PageHeaderTabs';
import { TradeCrmAiDock } from '@/trade-crm/shared/components/TradeCrmAiDock';
import { TradeCrmLocaleSwitch } from '@/trade-crm/shared/components/TradeCrmLocaleSwitch';
import { useTradeCrmLocale } from '@/trade-crm/shared/hooks/useTradeCrmLocale';
import { type TradeWorkspaceContext } from '@/trade-crm/shared/TradeWorkspaceContext';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type CustomerWorkspaceInsight = {
  label: string;
  value: string;
  description: string;
};

type TradeCrmCustomerWorkspaceLayoutProps = {
  title: string;
  heroTitle: string;
  heroDescription: string;
  heroPills: string[];
  tabs: PageHeaderTab[];
  sidebarTitle: string;
  sidebarItems: FilterSidebarItem[];
  insights: CustomerWorkspaceInsight[];
  workspaceContext: TradeWorkspaceContext;
  secondaryTabs?: PageHeaderTab[];
  children: ReactNode;
};

const StyledContent = styled.div`
  background: ${tradeCrmUiTheme.colors.page};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-height: 100%;
  padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[4]}
    ${themeCssVariables.spacing[5]};
`;

const StyledHero = styled.section`
  background:
    radial-gradient(circle at top right, rgba(28, 28, 28, 0.03), transparent 22%),
    linear-gradient(180deg, ${tradeCrmUiTheme.colors.surface}, ${tradeCrmUiTheme.colors.page});
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[5]};
`;

const StyledHeroTitle = styled.h2`
  color: ${tradeCrmUiTheme.colors.ink};
  font-family: ${tradeCrmUiTheme.typography.display};
  font-size: 32px;
  line-height: 1.08;
  margin: 0;
`;

const StyledHeroDescription = styled.p`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  line-height: 1.7;
  margin: 0;
  max-width: 880px;
`;

const StyledPillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledPill = styled.div`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledWorkspace = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: 280px minmax(0, 1fr) 320px;

  @media (max-width: 1240px) {
    grid-template-columns: 1fr;
  }
`;

const StyledMainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledRightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledPanel = styled.section`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledPanelTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledInsightItem = styled.div`
  border-top: 1px solid ${tradeCrmUiTheme.colors.border};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding-top: ${themeCssVariables.spacing[3]};
`;

const StyledInsightLabel = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.xs};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const StyledInsightValue = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledInsightDescription = styled.div`
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

export const TradeCrmCustomerWorkspaceLayout = ({
  title,
  heroTitle,
  heroDescription,
  heroPills,
  tabs,
  sidebarTitle,
  sidebarItems,
  insights,
  workspaceContext,
  secondaryTabs,
  children,
}: TradeCrmCustomerWorkspaceLayoutProps) => {
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
            <StyledHeroTitle>{tr(heroTitle)}</StyledHeroTitle>
            <StyledHeroDescription>{tr(heroDescription)}</StyledHeroDescription>
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
              }))}
            />
            <StyledMainColumn>
              {secondaryTabs ? (
                <PageHeaderTabs
                  tabs={secondaryTabs.map((tab) => ({
                    ...tab,
                    label: tr(tab.label),
                  }))}
                />
              ) : null}
              {children}
            </StyledMainColumn>
            <StyledRightColumn>
              <StyledPanel>
                <StyledPanelTitle>{tr('Execution Signals')}</StyledPanelTitle>
                {insights.map((insight) => (
                  <StyledInsightItem key={insight.label}>
                    <StyledInsightLabel>{tr(insight.label)}</StyledInsightLabel>
                    <StyledInsightValue>{tr(insight.value)}</StyledInsightValue>
                    <StyledInsightDescription>
                      {tr(insight.description)}
                    </StyledInsightDescription>
                  </StyledInsightItem>
                ))}
              </StyledPanel>
              <TradeCrmAiDock context={workspaceContext} />
            </StyledRightColumn>
          </StyledWorkspace>
        </StyledContent>
      </MainContainerLayoutWithSidePanel>
    </PageContainer>
  );
};
