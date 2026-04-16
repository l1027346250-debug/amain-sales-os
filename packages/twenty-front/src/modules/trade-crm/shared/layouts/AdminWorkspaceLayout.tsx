import { styled } from '@linaria/react';
import { Link } from 'react-router-dom';

import { MainContainerLayoutWithSidePanel } from '@/object-record/components/MainContainerLayoutWithSidePanel';
import { TradeCrmAiDock } from '@/trade-crm/shared/components/TradeCrmAiDock';
import { TradeCrmLocaleSwitch } from '@/trade-crm/shared/components/TradeCrmLocaleSwitch';
import { useTradeCrmLocale } from '@/trade-crm/shared/hooks/useTradeCrmLocale';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import {
  type PageHeaderTab,
  PageHeaderTabs,
} from '@/trade-crm/shared/components/PageHeaderTabs';
import { type TradeWorkspaceContext } from '@/trade-crm/shared/TradeWorkspaceContext';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export type AdminWorkspaceCard = {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryActionLabel?: string;
};

type AdminWorkspaceLayoutProps = {
  title: string;
  heroTitle: string;
  heroDescription: string;
  tabs: PageHeaderTab[];
  cards: AdminWorkspaceCard[];
  workspaceContext?: TradeWorkspaceContext;
};

const StyledContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[5]};
  padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[4]}
    ${themeCssVariables.spacing[5]};
`;

const StyledHero = styled.section`
  background: linear-gradient(
    145deg,
    ${themeCssVariables.background.primary},
    ${themeCssVariables.background.secondary}
  );
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.xl};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[5]};
  position: relative;

  &::before {
    background: linear-gradient(
      120deg,
      ${themeCssVariables.accent.primary}14,
      transparent
    );
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
  position: relative;
  z-index: 1;
`;

const StyledHeroEyebrow = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const StyledHeroTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: 28px;
  margin: 0;
  text-wrap: balance;
`;

const StyledHeroDescription = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  line-height: 1.6;
  margin: 0;
  max-width: 820px;
`;

const StyledGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
`;

const StyledCard = styled.div`
  background: linear-gradient(
    180deg,
    ${themeCssVariables.background.primary},
    ${themeCssVariables.background.secondary}
  );
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.xl};
  box-shadow: ${themeCssVariables.boxShadow.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-height: 190px;
  min-width: 0;
  overflow: hidden;
  padding: ${themeCssVariables.spacing[4]};
  position: relative;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;

  &::before {
    background: linear-gradient(
      90deg,
      ${themeCssVariables.accent.primary},
      transparent
    );
    content: '';
    height: 4px;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
  }

  &:hover {
    border-color: ${themeCssVariables.accent.primary};
    box-shadow: ${themeCssVariables.boxShadow.strong};
    transform: translateY(-2px);
  }
`;

const StyledCardTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledCardDescription = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

const StyledActionLink = styled(Link)`
  color: ${themeCssVariables.accent.primary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  text-decoration: none;
  transition: color 160ms ease;

  &:hover {
    color: ${themeCssVariables.font.color.primary};
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.primary};
    outline-offset: 2px;
  }
`;

const StyledActionRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  margin-top: auto;
`;

export const AdminWorkspaceLayout = ({
  title,
  heroTitle,
  heroDescription,
  tabs,
  cards,
  workspaceContext,
}: AdminWorkspaceLayoutProps) => {
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
              <StyledHeroEyebrow>{tr(`${title} control layer`)}</StyledHeroEyebrow>
              <StyledHeroTitle>{tr(heroTitle)}</StyledHeroTitle>
              <StyledHeroDescription>{tr(heroDescription)}</StyledHeroDescription>
            </StyledHeroCopy>
          </StyledHero>
          <StyledGrid>
            {cards.map((card) => (
              <StyledCard key={card.title}>
                <StyledCardTitle>{tr(card.title)}</StyledCardTitle>
                <StyledCardDescription>{tr(card.description)}</StyledCardDescription>
                {card.href || card.secondaryHref ? (
                  <StyledActionRow>
                    {card.href ? (
                      <StyledActionLink to={card.href}>
                        {tr(card.actionLabel ?? 'Open')}
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
          </StyledGrid>
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
