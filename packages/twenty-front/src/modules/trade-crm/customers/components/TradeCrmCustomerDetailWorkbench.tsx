import { styled } from '@linaria/react';
import { useEffect, useState } from 'react';

import { type TradeCrmCustomerTableBadgeTone } from '@/trade-crm/customers/components/TradeCrmCustomerTable';
import { TradeCrmCustomerTable } from '@/trade-crm/customers/components/TradeCrmCustomerTable';
import {
  type TradeCrmCustomerDocumentItem,
  type TradeCrmCustomerAiInsight,
  type TradeCrmCustomerOperationHistoryItem,
  type TradeCrmCustomerTimelineItem,
} from '@/trade-crm/customers/hooks/useTradeCrmCustomerWorkspaceData';
import {
  getTradeCrmCustomerCountryLabel,
  getTradeCrmCustomerEmailLabel,
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
  customerTimelineItems: TradeCrmCustomerTimelineItem[];
  customerTimelineTotalCount: number;
  customerOperationHistoryItems: TradeCrmCustomerOperationHistoryItem[];
  customerOperationHistoryTotalCount: number;
  customerDocumentItems: TradeCrmCustomerDocumentItem[];
  customerDocumentTotalCount: number;
  customerAiInsight: TradeCrmCustomerAiInsight | null;
  createCustomerFollowUp: (body: string) => Promise<void>;
  createCustomerFollowUpLoading: boolean;
  createCustomerContact: (input: {
    email?: string;
    nickname?: string;
    phone?: string;
  }) => Promise<void>;
  createCustomerContactLoading: boolean;
  updateCustomer: (input: {
    addressLine?: string;
    country?: string;
    name?: string;
    shortName?: string;
    websiteUrl?: string;
  }) => Promise<void>;
  updateCustomerLoading: boolean;
  updateCustomerContact: (input: {
    contactId: string;
    email?: string;
    nickname?: string;
    phone?: string;
    position?: string;
  }) => Promise<void>;
  updateCustomerContactLoading: boolean;
  refreshCustomerCommercialSummary: () => Promise<void>;
  refreshCustomerCommercialSummaryLoading: boolean;
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

const StyledComposerTextArea = styled.textarea`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  font: inherit;
  min-height: 82px;
  padding: ${themeCssVariables.spacing[3]};
  resize: vertical;
  width: 100%;
`;

const StyledComposerInput = styled.input`
  background: ${tradeCrmUiTheme.colors.surfaceMuted};
  border: 1px solid ${tradeCrmUiTheme.colors.border};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.ink};
  font: inherit;
  min-height: 38px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledComposerActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  margin-top: ${themeCssVariables.spacing[2]};
`;

const StyledComposerButton = styled.button`
  background: ${tradeCrmUiTheme.colors.borderStrong};
  border: 1px solid ${tradeCrmUiTheme.colors.borderStrong};
  border-radius: ${tradeCrmUiTheme.radius.control};
  color: ${tradeCrmUiTheme.colors.surface};
  cursor: pointer;
  font: inherit;
  padding: 8px 14px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.54;
  }
`;

const StyledTabPanel = styled.div`
  padding: 0 ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[4]};
`;

const getTimelineSourceLabel = (sourceObjectName: string | null) => {
  switch (sourceObjectName) {
    case 'opportunity':
      return 'Opportunity';
    case 'timelineActivity':
      return 'CRM Activity';
    default:
      return sourceObjectName;
  }
};

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
  customerTimelineItems,
  customerTimelineTotalCount,
  customerOperationHistoryItems,
  customerOperationHistoryTotalCount,
  customerDocumentItems,
  customerDocumentTotalCount,
  customerAiInsight,
  createCustomerFollowUp,
  createCustomerFollowUpLoading,
  createCustomerContact,
  createCustomerContactLoading,
  updateCustomer,
  updateCustomerLoading,
  updateCustomerContact,
  updateCustomerContactLoading,
  refreshCustomerCommercialSummary,
  refreshCustomerCommercialSummaryLoading,
}: TradeCrmCustomerDetailWorkbenchProps) => {
  const [activeTab, setActiveTab] = useState<DetailTabKey>('activity');
  const [followUpBody, setFollowUpBody] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactName, setEditContactName] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editContactPosition, setEditContactPosition] = useState('');
  const [profileAddressLine, setProfileAddressLine] = useState('');
  const [profileCountry, setProfileCountry] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profileShortName, setProfileShortName] = useState('');
  const [profileWebsiteUrl, setProfileWebsiteUrl] = useState('');

  useEffect(() => {
    setProfileAddressLine(customerDetail?.addressLabel ?? '');
    setProfileCountry(customerDetail?.countryLabel ?? '');
    setProfileName(customerDetail?.displayName ?? '');
    setProfileShortName(customerDetail?.shortNameLabel ?? '');
    setProfileWebsiteUrl(customerDetail?.websiteLabel ?? '');
  }, [customerDetail]);

  const primaryContactRecord = peopleRecords?.[0] ?? null;

  useEffect(() => {
    setEditContactEmail(getTradeCrmCustomerEmailLabel(primaryContactRecord ?? undefined));
    setEditContactName(
      primaryContactRecord
        ? getTradeCrmRecordName({
            kind: 'individual',
            record: primaryContactRecord,
          })
        : '',
    );
    setEditContactPhone(getTradeCrmCustomerPhoneLabel(primaryContactRecord ?? undefined));
    setEditContactPosition(
      primaryContactRecord ? getTradeCrmCustomerJobTitle(primaryContactRecord) : '',
    );
  }, [primaryContactRecord]);

  const timelineItems =
    customerTimelineItems.length > 0
      ? customerTimelineItems.map((item) => ({
          id: item.id,
          time: item.occurredAt.slice(0, 10),
          title: item.title,
          description: [
            item.description,
            item.actorName ? `Owner: ${item.actorName}` : null,
            getTimelineSourceLabel(item.sourceObjectName)
              ? `Source: ${getTimelineSourceLabel(item.sourceObjectName)}`
              : null,
          ]
            .filter((value): value is string => value !== null)
            .join(' / '),
        }))
      : timelineThreadPreviews.length > 0 || timelineCalendarPreviews.length > 0
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
            id: 'empty-timeline',
            time: '--',
            title: 'No customer activity yet',
            description:
              'Write a follow-up, convert a lead, import a customer, move public-pool ownership, or link an opportunity to populate this timeline.',
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
        <>
          <StyledComposer>
            <StyledCardTitle>Edit Customer Master Data</StyledCardTitle>
            <StyledProfileGrid>
              <StyledComposerInput
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                placeholder="Company name"
              />
              <StyledComposerInput
                value={profileShortName}
                onChange={(event) => setProfileShortName(event.target.value)}
                placeholder="Short name"
              />
              <StyledComposerInput
                value={profileCountry}
                onChange={(event) => setProfileCountry(event.target.value)}
                placeholder="Country / region"
              />
              <StyledComposerInput
                value={profileWebsiteUrl}
                onChange={(event) => setProfileWebsiteUrl(event.target.value)}
                placeholder="Website"
              />
              <StyledComposerInput
                value={profileAddressLine}
                onChange={(event) => setProfileAddressLine(event.target.value)}
                placeholder="Address"
              />
            </StyledProfileGrid>
            <StyledComposerActions>
              <span>Save updates into the company customer master record.</span>
              <StyledComposerButton
                type="button"
                disabled={profileName.trim().length === 0 || updateCustomerLoading}
                onClick={() => {
                  void updateCustomer({
                    addressLine: profileAddressLine.trim() || undefined,
                    country: profileCountry.trim() || undefined,
                    name: profileName.trim(),
                    shortName: profileShortName.trim() || undefined,
                    websiteUrl: profileWebsiteUrl.trim() || undefined,
                  });
                }}
              >
                {updateCustomerLoading ? 'Saving...' : 'Save Profile'}
              </StyledComposerButton>
            </StyledComposerActions>
          </StyledComposer>
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
        </>
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
          {customerDocumentItems.length > 0 ? (
            customerDocumentItems.map((documentItem) => (
              <StyledTimelineItem key={documentItem.id}>
                <StyledTimelineTime>
                  {documentItem.createdAt?.slice(0, 10) ?? 'Document'} /{' '}
                  {documentItem.fileCategory ?? 'file'}
                </StyledTimelineTime>
                <StyledTimelineTitle>{documentItem.name}</StyledTimelineTitle>
                <StyledMuted>{documentItem.fullPath ?? 'No file path available'}</StyledMuted>
              </StyledTimelineItem>
            ))
          ) : (
            <StyledMuted>No customer documents are attached yet.</StyledMuted>
          )}
        </StyledTimeline>
      );
    }

    if (activeTab === 'analysis') {
      return (
        <StyledProfileGrid>
          {[
            ['Timeline Threads', `${timelineThreadTotalCount}`],
            ['Calendar Events', `${timelineCalendarTotalCount}`],
            ['Customer Timeline', `${customerTimelineTotalCount}`],
            ['Operation Logs', `${customerOperationHistoryTotalCount}`],
            ['Documents', `${customerDocumentTotalCount}`],
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

    if (activeTab === 'history') {
      return (
        <StyledTimeline>
          {customerOperationHistoryItems.length > 0 ? (
            customerOperationHistoryItems.map((item) => (
              <StyledTimelineItem key={item.id}>
                <StyledTimelineTime>
                  {item.operatedAt?.slice(0, 16).replace('T', ' ') ?? '--'} /{' '}
                  {item.operatorName ?? 'system'}
                </StyledTimelineTime>
                <StyledTimelineTitle>
                  {item.operationType ?? 'CUSTOMER_OPERATION'}
                </StyledTimelineTitle>
                <StyledMuted>{item.operationSummary}</StyledMuted>
              </StyledTimelineItem>
            ))
          ) : (
            <StyledMuted>No operation history is available yet.</StyledMuted>
          )}
        </StyledTimeline>
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

    if (activeTab === 'ai') {
      return (
        <StyledTimeline>
          <StyledTimelineItem>
            <StyledTimelineTime>
              {customerAiInsight?.status ?? 'AI container ready'}
            </StyledTimelineTime>
            <StyledTimelineTitle>AI Research Container</StyledTimelineTitle>
            <StyledMuted>
              {customerAiInsight?.summary ??
                'AI research is reserved for phase two. The data contract is ready and will not require a detail-page rewrite.'}
            </StyledMuted>
          </StyledTimelineItem>
          {(customerAiInsight?.signals ?? []).map((signal) => (
            <StyledTimelineItem key={signal.label}>
              <StyledTimelineTime>Signal</StyledTimelineTime>
              <StyledTimelineTitle>{signal.label}</StyledTimelineTitle>
              <StyledMuted>{signal.value}</StyledMuted>
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

  const submitFollowUp = async () => {
    const trimmedBody = followUpBody.trim();

    if (trimmedBody.length === 0) {
      return;
    }

    await createCustomerFollowUp(trimmedBody);
    setFollowUpBody('');
    setActiveTab('activity');
  };

  const submitContact = async () => {
    const nickname = newContactName.trim();
    const email = newContactEmail.trim();
    const phone = newContactPhone.trim();

    if (!nickname && !email && !phone) {
      return;
    }

    await createCustomerContact({
      email: email || undefined,
      nickname: nickname || undefined,
      phone: phone || undefined,
    });
    setNewContactEmail('');
    setNewContactName('');
    setNewContactPhone('');
  };

  const submitContactUpdate = async () => {
    if (!primaryContactRecord) {
      return;
    }

    await updateCustomerContact({
      contactId: primaryContactRecord.id,
      email: editContactEmail.trim() || undefined,
      nickname: editContactName.trim() || undefined,
      phone: editContactPhone.trim() || undefined,
      position: editContactPosition.trim() || undefined,
    });
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
            {customerAiInsight?.summary ??
              'AI research is reserved for phase two. The customer data contract and container are already wired.'}
          </StyledMuted>
          <StyledProfileGrid>
            {(customerAiInsight?.signals ?? [
              {
                label: 'Contacts',
                value: `${contactRows.length}`,
              },
              {
                label: 'Open Deals',
                value: `${dealRows.length}`,
              },
            ]).map((signal) => (
              <StyledMetric key={signal.label}>
                <StyledMetricLabel>{signal.label}</StyledMetricLabel>
                <StyledMetricValue>{signal.value}</StyledMetricValue>
              </StyledMetric>
            ))}
          </StyledProfileGrid>
        </StyledCard>
      </StyledRail>
      <StyledColumn>
        <StyledCard>
          <StyledComposerActions>
            <StyledCardTitle>In-Progress Opportunities</StyledCardTitle>
            <StyledComposerButton
              type="button"
              disabled={refreshCustomerCommercialSummaryLoading}
              onClick={() => {
                void refreshCustomerCommercialSummary();
              }}
            >
              {refreshCustomerCommercialSummaryLoading
                ? 'Refreshing...'
                : 'Refresh Commercial Summary'}
            </StyledComposerButton>
          </StyledComposerActions>
          <StyledDealStrip>
            {(opportunityRecords ?? []).length > 0 ? (
              (opportunityRecords ?? []).slice(0, 3).map((record, index) => (
                <StyledDealCard key={record.id}>
                  <StyledDealStage>
                    {getTradeCrmCustomerStageLabelForRecord({
                      record,
                      fallbackIndex: index,
                    })}
                  </StyledDealStage>
                  <StyledDealName>
                    {typeof record.name === 'string'
                      ? record.name
                      : `Opportunity ${index + 1}`}
                  </StyledDealName>
                  <StyledMuted>{`${getOpportunityAmountLabel(record, index)} / ${
                    getTradeCrmCustomerOwnerLabel(record)
                  }`}</StyledMuted>
                </StyledDealCard>
              ))
            ) : (
              <StyledMuted>No in-progress opportunity is linked yet.</StyledMuted>
            )}
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
            <StyledComposerTextArea
              value={followUpBody}
              onChange={(event) => setFollowUpBody(event.target.value)}
              placeholder="Write a follow-up entry for this customer. It will be saved to the customer timeline and update the latest follow-up timestamp."
            />
            <StyledComposerActions>
              <span>
                {timelineThreadTotalCount} mail threads / {timelineCalendarTotalCount}{' '}
                schedule items / {customerTimelineTotalCount} timeline events
              </span>
              <StyledComposerButton
                type="button"
                disabled={
                  followUpBody.trim().length === 0 || createCustomerFollowUpLoading
                }
                onClick={submitFollowUp}
              >
                {createCustomerFollowUpLoading ? 'Saving...' : 'Write Follow-up'}
              </StyledComposerButton>
            </StyledComposerActions>
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
        <StyledComposer>
          <StyledCardTitle>Add Contact</StyledCardTitle>
          <StyledComposerActions>
            <StyledComposerInput
              value={newContactName}
              onChange={(event) => setNewContactName(event.target.value)}
              placeholder="Nickname"
            />
            <StyledComposerInput
              value={newContactEmail}
              onChange={(event) => setNewContactEmail(event.target.value)}
              placeholder="Email"
            />
            <StyledComposerInput
              value={newContactPhone}
              onChange={(event) => setNewContactPhone(event.target.value)}
              placeholder="Phone"
            />
            <StyledComposerButton
              type="button"
              disabled={
                createCustomerContactLoading ||
                (!newContactName.trim() &&
                  !newContactEmail.trim() &&
                  !newContactPhone.trim())
              }
              onClick={submitContact}
            >
              {createCustomerContactLoading ? 'Adding...' : 'Add Contact'}
            </StyledComposerButton>
          </StyledComposerActions>
        </StyledComposer>
        <StyledComposer>
          <StyledCardTitle>Edit Primary Contact</StyledCardTitle>
          <StyledComposerActions>
            <StyledComposerInput
              value={editContactName}
              onChange={(event) => setEditContactName(event.target.value)}
              placeholder="Nickname"
            />
            <StyledComposerInput
              value={editContactEmail}
              onChange={(event) => setEditContactEmail(event.target.value)}
              placeholder="Email"
            />
            <StyledComposerInput
              value={editContactPhone}
              onChange={(event) => setEditContactPhone(event.target.value)}
              placeholder="Phone"
            />
            <StyledComposerInput
              value={editContactPosition}
              onChange={(event) => setEditContactPosition(event.target.value)}
              placeholder="Position"
            />
            <StyledComposerButton
              type="button"
              disabled={!primaryContactRecord || updateCustomerContactLoading}
              onClick={submitContactUpdate}
            >
              {updateCustomerContactLoading ? 'Saving...' : 'Save Contact'}
            </StyledComposerButton>
          </StyledComposerActions>
        </StyledComposer>
      </StyledColumn>
    </StyledShell>
  );
};
