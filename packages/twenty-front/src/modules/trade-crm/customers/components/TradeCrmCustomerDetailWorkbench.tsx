import { styled } from '@linaria/react';
import { useState } from 'react';

import { type TradeCrmCustomerTableBadgeTone } from '@/trade-crm/customers/components/TradeCrmCustomerTable';
import { TradeCrmCustomerTable } from '@/trade-crm/customers/components/TradeCrmCustomerTable';
import {
  getTradeCrmCustomerCountryLabel,
  getTradeCrmCustomerGroupLabelForRecord,
  getTradeCrmCustomerJobTitle,
  getTradeCrmCustomerLastTouchLabelForRecord,
  getTradeCrmCustomerOwnerLabel,
  getTradeCrmCustomerPhoneLabel,
  getTradeCrmCustomerSourceLabelForRecord,
  getTradeCrmCustomerStageLabelForRecord,
  getTradeCrmCustomerStarLabelForRecord,
  getTradeCrmCustomerTagsForRecord,
  getTradeCrmRecordName,
  type TradeCrmCustomerPresentationRecord,
} from '@/trade-crm/customers/utils/tradeCrmCustomerPresentation';
import { tradeCrmUiTheme } from '@/trade-crm/shared/ui/tradeCrmUiTheme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

type TradeCrmCustomerDetailSummary = {
  kind: 'organization' | 'individual';
  displayName: string;
  countryLabel: string | null;
  ownerLabel: string | null;
  websiteLabel: string | null;
  shortNameLabel: string;
  jobTitle: string | null;
  phoneLabel: string;
  emailLabel: string;
  addressLabel: string;
  socialLabels: string[];
  customerStageLabel: string;
  customerGroupLabel: string;
  customerSourceLabel: string;
  customerTags: string[];
  customerStarLabel: string;
  customerScoreLabel: string;
  publicPoolStateLabel: string;
  publicPoolGroupLabel: string;
  customerCodeLabel: string;
  lastContactLabel: string;
  lastTouchLabel: string;
  lastWonLabel: string;
  totalWonAmountLabel: string;
};

type TradeCrmTimelineThreadPreview = {
  id: string;
  subject: string;
  lastMessageReceivedAt: string;
  lastMessageBody: string;
  participantLabel: string;
  messageCountLabel: string;
};

type TradeCrmTimelineCalendarPreview = {
  id: string;
  title: string;
  startsAt: string;
  location: string;
  participantLabel: string;
};

type TradeCrmCustomerDetailWorkbenchProps = {
  customerDetail: TradeCrmCustomerDetailSummary | null;
  customerDetailLoading: boolean;
  opportunityRecords: TradeCrmCustomerPresentationRecord[] | undefined;
  taskRecords: TradeCrmCustomerPresentationRecord[] | undefined;
  peopleRecords: TradeCrmCustomerPresentationRecord[] | undefined;
  timelineThreadPreviews: TradeCrmTimelineThreadPreview[];
  timelineThreadTotalCount: number;
  timelineCalendarPreviews: TradeCrmTimelineCalendarPreview[];
  timelineCalendarTotalCount: number;
};

type DetailTabKey =
  | 'activity'
  | 'profile'
  | 'deals'
  | 'tips'
  | 'ai'
  | 'analysis'
  | 'documents'
  | 'history';

const DETAIL_TABS: { key: DetailTabKey; label: string }[] = [
  { key: 'activity', label: 'Activity' },
  { key: 'profile', label: 'Profile' },
  { key: 'deals', label: 'Deals & Trade' },
  { key: 'tips', label: 'Tips' },
  { key: 'ai', label: 'AI Research' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'documents', label: 'Documents' },
  { key: 'history', label: 'History' },
];

const getBadgeTone = (index: number): TradeCrmCustomerTableBadgeTone =>
  index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'amber' : 'green';

const getOpportunityAmountLabel = (
  record: TradeCrmCustomerPresentationRecord,
  fallbackIndex: number,
) => {
  const amount = record.amount as
    | {
        amountMicros?: unknown;
        currencyCode?: unknown;
      }
    | undefined;

  if (amount && typeof amount.amountMicros === 'number') {
    const currencyCode =
      typeof amount.currencyCode === 'string' && amount.currencyCode.length > 0
        ? amount.currencyCode
        : 'USD';

    return `${currencyCode} ${(amount.amountMicros / 1_000_000).toLocaleString(
      undefined,
      {
        maximumFractionDigits: 2,
      },
    )}`;
  }

  return `USD ${(fallbackIndex + 2) * 18}k`;
};

const StyledShell = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 320px minmax(0, 1fr);

  @media (max-width: 1120px) {
    grid-template-columns: 1fr;
  }
`;

const StyledRail = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledCard = styled.section`
  background: ${tradeCrmUiTheme.colors.surface};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.panel};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledCardTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledHeroName = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: 28px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  line-height: 1.1;
  margin-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledMuted = styled.div`
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
`;

const StyledTagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[3]};
`;

const StyledTag = styled.div`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.pill};
  color: ${tradeCrmUiTheme.colors.inkMuted};
  font-size: ${themeCssVariables.font.size.xs};
  padding: 4px 8px;
`;

const StyledProfileGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: ${themeCssVariables.spacing[3]};
`;

const StyledMetric = styled.div`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledMetricLabel = styled.div`
  color: ${tradeCrmUiTheme.colors.inkFaint};
  font-size: ${themeCssVariables.font.size.xs};
  margin-bottom: ${themeCssVariables.spacing[1]};
  text-transform: uppercase;
`;

const StyledMetricValue = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledDealStrip = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  margin-top: ${themeCssVariables.spacing[3]};
`;

const StyledDealCard = styled.div`
  background: linear-gradient(
    180deg,
    rgba(20, 20, 20, 0.02),
    ${tradeCrmUiTheme.colors.surfaceMuted}
  );
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  min-height: 120px;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledDealStage = styled.div`
  color: #2759c6;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin-bottom: ${themeCssVariables.spacing[2]};
  text-transform: uppercase;
`;

const StyledDealName = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin-bottom: ${themeCssVariables.spacing[1]};
`;

const StyledTimeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[2]};
`;

const StyledTimelineItem = styled.div`
  border-left: 2px solid ${tradeCrmUiTheme.colors.borderStrong};
  padding-left: ${themeCssVariables.spacing[3]};
`;

const StyledTimelineTime = styled.div`
  color: ${tradeCrmUiTheme.colors.inkFaint};
  font-size: ${themeCssVariables.font.size.xs};
  margin-bottom: ${themeCssVariables.spacing[1]};
`;

const StyledTimelineTitle = styled.div`
  color: ${tradeCrmUiTheme.colors.ink};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledTabRow = styled.div`
  border-bottom: 1px solid ${tradeCrmUiTheme.colors.border};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  margin: 0 ${themeCssVariables.spacing[4]};
  padding-top: ${themeCssVariables.spacing[2]};
`;

const StyledTabButton = styled.button<{ $active: boolean }>`
  background: none;
  border: 0;
  border-bottom: 2px solid
    ${({ $active }) =>
      $active ? tradeCrmUiTheme.colors.borderStrong : 'transparent'};
  color: ${({ $active }) =>
    $active ? tradeCrmUiTheme.colors.ink : tradeCrmUiTheme.colors.inkSoft};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[2]} 0;
`;

const StyledComposer = styled.div`
  border: 1px dashed ${tradeCrmUiTheme.colors.borderStrong};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.inkSoft};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.6;
  margin: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledTabPanel = styled.div`
  padding: 0 ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[4]};
`;

export const TradeCrmCustomerDetailWorkbench = ({
  customerDetail,
  customerDetailLoading,
  opportunityRecords,
  taskRecords,
  peopleRecords,
  timelineThreadPreviews,
  timelineThreadTotalCount,
  timelineCalendarPreviews,
  timelineCalendarTotalCount,
}: TradeCrmCustomerDetailWorkbenchProps) => {
  const [activeTab, setActiveTab] = useState<DetailTabKey>('activity');

  const timelineItems =
    timelineThreadPreviews.length > 0 || timelineCalendarPreviews.length > 0
      ? [
          ...timelineThreadPreviews.map((thread) => ({
            id: thread.id,
            time: thread.lastMessageReceivedAt,
            title: thread.subject,
            description: `${thread.participantLabel} / ${thread.messageCountLabel}`,
          })),
          ...timelineCalendarPreviews.map((event) => ({
            id: event.id,
            time: event.startsAt,
            title: event.title,
            description: `${event.participantLabel} / ${event.location}`,
          })),
        ]
      : [
          {
            id: 'fallback-today',
            time: 'Today',
            title: 'Follow-up plan queued for account owner handoff',
            description:
              'Use this timeline shell for follow-up notes, deal events, mail linkage, and scheduling.',
          },
          {
            id: 'fallback-yesterday',
            time: 'Yesterday',
            title: 'Opportunity summary updated',
            description:
              'Commercial events should remain visible beside customer profile and contacts.',
          },
          {
            id: 'fallback-earlier',
            time: 'Earlier',
            title: 'Customer profile reviewed',
            description:
              'This detail route is the permanent target for future customer aggregate data.',
          },
        ];

  const contactRows = (peopleRecords ?? []).slice(0, 3).map((record, index) => ({
    id: record.id,
    cells: [
      {
        primary: getTradeCrmRecordName({
          kind: 'individual',
          record,
        }),
        secondary: getTradeCrmCustomerJobTitle(record),
      },
      {
        primary: typeof record.email === 'string' ? record.email : 'No email',
        secondary: getTradeCrmCustomerPhoneLabel(record),
      },
      {
        primary: getTradeCrmCustomerLastTouchLabelForRecord({
          record,
          fallbackIndex: index,
        }),
        secondary: getTradeCrmCustomerSourceLabelForRecord({
          record,
          fallbackIndex: index,
        }),
      },
      {
        primary: getTradeCrmCustomerCountryLabel(record),
        secondary: getTradeCrmCustomerOwnerLabel(record),
      },
      {
        primary: getTradeCrmCustomerStageLabelForRecord({
          record,
          fallbackIndex: index,
        }),
        secondary: getTradeCrmCustomerGroupLabelForRecord({
          record,
          fallbackIndex: index,
        }),
        badgeLabel: getTradeCrmCustomerStarLabelForRecord({
          record,
          fallbackIndex: index,
        }),
        badgeTone: 'amber',
      },
    ],
  }));

  const dealRows = (opportunityRecords ?? []).slice(0, 4).map((record, index) => ({
    id: record.id,
    cells: [
      {
        primary:
          typeof record.name === 'string' && record.name.length > 0
            ? record.name
            : `Opportunity ${index + 1}`,
        secondary: `Deal lane ${index + 1}`,
      },
      {
        primary: getTradeCrmCustomerStageLabelForRecord({
          record,
          fallbackIndex: index,
        }),
        secondary: 'Commercial stage',
        badgeLabel: getTradeCrmCustomerSourceLabelForRecord({
          record,
          fallbackIndex: index,
        }),
        badgeTone: getBadgeTone(index),
      },
      {
        primary: getOpportunityAmountLabel(record, index),
        secondary: 'Projected amount',
      },
      {
        primary: getTradeCrmCustomerOwnerLabel(record),
        secondary: 'Deal owner',
      },
      {
        primary: getTradeCrmCustomerLastTouchLabelForRecord({
          record,
          fallbackIndex: index,
        }),
        secondary: 'Latest action',
      },
    ],
  }));

  const renderActiveTab = () => {
    if (activeTab === 'profile') {
      return (
        <StyledProfileGrid>
          {[
            ['Stage', customerDetail?.customerStageLabel ?? '--'],
            ['Group', customerDetail?.customerGroupLabel ?? '--'],
            ['Source', customerDetail?.customerSourceLabel ?? '--'],
            ['Short Name', customerDetail?.shortNameLabel ?? '--'],
            ['Website', customerDetail?.websiteLabel ?? '--'],
            ['Country', customerDetail?.countryLabel ?? '--'],
            ['Owner', customerDetail?.ownerLabel ?? '--'],
            ['Score', customerDetail?.customerScoreLabel ?? '--'],
            ['Email', customerDetail?.emailLabel ?? '--'],
            ['Phone', customerDetail?.phoneLabel ?? '--'],
            ['Address', customerDetail?.addressLabel ?? '--'],
            ['Last Contact', customerDetail?.lastContactLabel ?? '--'],
            ['Last Won', customerDetail?.lastWonLabel ?? '--'],
            ['Won Revenue', customerDetail?.totalWonAmountLabel ?? '--'],
          ].map(([label, value]) => (
            <StyledMetric key={label}>
              <StyledMetricLabel>{label}</StyledMetricLabel>
              <StyledMetricValue>{value}</StyledMetricValue>
            </StyledMetric>
          ))}
        </StyledProfileGrid>
      );
    }

    if (activeTab === 'deals') {
      return (
        <TradeCrmCustomerTable
          title="Deals and trade progression"
          description="Quote, order, and commercial activity should appear in the customer detail instead of forcing sellers back to isolated records."
          columns={['Opportunity', 'Stage', 'Amount', 'Owner', 'Latest Touch']}
          rows={dealRows}
          emptyState="No linked opportunities are visible yet."
        />
      );
    }

    if (activeTab === 'documents') {
      return (
        <StyledTimeline>
          {['Customer briefing', 'Sample agreement', 'Factory notes'].map((name) => (
            <StyledTimelineItem key={name}>
              <StyledTimelineTime>Document</StyledTimelineTime>
              <StyledTimelineTitle>{name}</StyledTimelineTitle>
              <StyledMuted>
                The document tab is reserved for attachments, mail exports, and customer
                supporting files.
              </StyledMuted>
            </StyledTimelineItem>
          ))}
        </StyledTimeline>
      );
    }

    if (activeTab === 'analysis') {
      return (
        <StyledProfileGrid>
          {[
            ['Timeline Threads', `${timelineThreadTotalCount}`],
            ['Calendar Events', `${timelineCalendarTotalCount}`],
            ['Contact Coverage', `${contactRows.length}`],
            ['Open Deals', `${dealRows.length}`],
            ['Last Touch', customerDetail?.lastTouchLabel ?? '--'],
            ['Public Pool', customerDetail?.publicPoolGroupLabel ?? '--'],
          ].map(([label, value]) => (
            <StyledMetric key={label}>
              <StyledMetricLabel>{label}</StyledMetricLabel>
              <StyledMetricValue>{value}</StyledMetricValue>
            </StyledMetric>
          ))}
        </StyledProfileGrid>
      );
    }

    if (activeTab === 'tips') {
      return (
        <StyledTimeline>
          {[
            {
              title: 'Next ownership move',
              description: `Keep ${customerDetail?.ownerLabel ?? 'the owner'} aligned with ${customerDetail?.customerStageLabel ?? 'the customer stage'}.`,
            },
            {
              title: 'Contactability check',
              description: `${customerDetail?.emailLabel ?? '--'} / ${customerDetail?.phoneLabel ?? '--'}`,
            },
            {
              title: 'Reactivation signal',
              description: `Latest touch ${customerDetail?.lastTouchLabel ?? '--'} / pool ${customerDetail?.publicPoolStateLabel ?? '--'}`,
            },
          ].map((item) => (
            <StyledTimelineItem key={item.title}>
              <StyledTimelineTime>Tip</StyledTimelineTime>
              <StyledTimelineTitle>{item.title}</StyledTimelineTitle>
              <StyledMuted>{item.description}</StyledMuted>
            </StyledTimelineItem>
          ))}
        </StyledTimeline>
      );
    }

    return (
      <StyledTimeline>
        {timelineItems.map((item) => (
          <StyledTimelineItem key={item.id}>
            <StyledTimelineTime>{item.time}</StyledTimelineTime>
            <StyledTimelineTitle>{item.title}</StyledTimelineTitle>
            <StyledMuted>{item.description}</StyledMuted>
          </StyledTimelineItem>
        ))}
      </StyledTimeline>
    );
  };

  return (
    <StyledShell>
      <StyledRail>
        <StyledCard>
          <StyledCardTitle>Customer Profile</StyledCardTitle>
          <StyledHeroName>
            {customerDetailLoading ? 'Loading...' : customerDetail?.displayName ?? 'Unknown'}
          </StyledHeroName>
          <StyledMuted>
            {customerDetail?.websiteLabel ??
              customerDetail?.jobTitle ??
              'Company customer anchor'}
          </StyledMuted>
          <StyledTagRow>
            {(
              customerDetail?.customerTags ??
              getTradeCrmCustomerTagsForRecord({ record: undefined })
            ).map((tag) => (
              <StyledTag key={tag}>{tag}</StyledTag>
            ))}
            {(customerDetail?.socialLabels ?? []).map((tag) => (
              <StyledTag key={tag}>{tag}</StyledTag>
            ))}
          </StyledTagRow>
          <StyledProfileGrid>
            {[
              ['Owner', customerDetail?.ownerLabel ?? '--'],
              ['Country', customerDetail?.countryLabel ?? '--'],
              ['Stage', customerDetail?.customerStageLabel ?? '--'],
              ['Group', customerDetail?.customerGroupLabel ?? '--'],
              ['Source', customerDetail?.customerSourceLabel ?? '--'],
              ['Score', customerDetail?.customerScoreLabel ?? '--'],
              ['Star', customerDetail?.customerStarLabel ?? '--'],
              ['Public Pool', customerDetail?.publicPoolStateLabel ?? '--'],
              ['Pool Group', customerDetail?.publicPoolGroupLabel ?? '--'],
              ['Customer Code', customerDetail?.customerCodeLabel ?? '--'],
            ].map(([label, value]) => (
              <StyledMetric key={label}>
                <StyledMetricLabel>{label}</StyledMetricLabel>
                <StyledMetricValue>{value}</StyledMetricValue>
              </StyledMetric>
            ))}
          </StyledProfileGrid>
        </StyledCard>
        <StyledCard>
          <StyledCardTitle>AI Customer Analysis</StyledCardTitle>
          <StyledMuted>
            This panel reserves the OKKI-style AI area. In phase one it stays as a
            structured container for research, risk notes, and follow-up suggestions.
          </StyledMuted>
        </StyledCard>
      </StyledRail>
      <StyledColumn>
        <StyledCard>
          <StyledCardTitle>In-Progress Opportunities</StyledCardTitle>
          <StyledDealStrip>
            {(opportunityRecords ?? []).slice(0, 3).map((record, index) => (
              <StyledDealCard key={record.id}>
                <StyledDealStage>
                  {getTradeCrmCustomerStageLabelForRecord({
                    record,
                    fallbackIndex: index,
                  })}
                </StyledDealStage>
                <StyledDealName>
                  {typeof record.name === 'string' ? record.name : `Opportunity ${index + 1}`}
                </StyledDealName>
                <StyledMuted>{`${getOpportunityAmountLabel(record, index)} / ${
                  getTradeCrmCustomerOwnerLabel(record)
                }`}</StyledMuted>
              </StyledDealCard>
            ))}
          </StyledDealStrip>
        </StyledCard>
        <StyledCard>
          <StyledCardTitle>Plan Schedule</StyledCardTitle>
          <StyledTimeline>
            {timelineCalendarPreviews.length > 0
              ? timelineCalendarPreviews.map((event) => (
                  <StyledTimelineItem key={event.id}>
                    <StyledTimelineTime>{event.startsAt}</StyledTimelineTime>
                    <StyledTimelineTitle>{event.title}</StyledTimelineTitle>
                    <StyledMuted>{`${event.participantLabel} / ${event.location}`}</StyledMuted>
                  </StyledTimelineItem>
                ))
              : (taskRecords ?? []).slice(0, 3).map((record, index) => (
                  <StyledTimelineItem key={record.id}>
                    <StyledTimelineTime>
                      {getTradeCrmCustomerLastTouchLabelForRecord({
                        record,
                        fallbackIndex: index,
                      })}
                    </StyledTimelineTime>
                    <StyledTimelineTitle>
                      {typeof record.title === 'string'
                        ? record.title
                        : `Follow-up checkpoint ${index + 1}`}
                    </StyledTimelineTitle>
                    <StyledMuted>
                      Keep calendar and tasks visible inside the customer detail.
                    </StyledMuted>
                  </StyledTimelineItem>
                ))}
          </StyledTimeline>
        </StyledCard>
        <StyledCard>
          <StyledTabRow>
            {DETAIL_TABS.map((tab) => (
              <StyledTabButton
                key={tab.key}
                type="button"
                $active={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </StyledTabButton>
            ))}
          </StyledTabRow>
          <StyledComposer>
            Write follow-up entry, sync mail context, or attach next-step notes here.
            Current preview: {timelineThreadTotalCount} mail threads and{' '}
            {timelineCalendarTotalCount} schedule items already resolve for this customer
            route.
          </StyledComposer>
          <StyledTabPanel>{renderActiveTab()}</StyledTabPanel>
        </StyledCard>
        <TradeCrmCustomerTable
          title="Contact Coverage"
          description="Keep reachable contacts visible beside the account profile so customer follow-up never loses the people layer."
          columns={['Contact', 'Reachability', 'Latest Touch', 'Country', 'Stage']}
          rows={contactRows}
          emptyState="No contact coverage is visible yet."
        />
      </StyledColumn>
    </StyledShell>
  );
};
