import { useSearchParams } from 'react-router-dom';

import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  getTradeCrmScopedViewPath,
  tradeCrmRouteMap,
} from '@/trade-crm/navigation/tradeCrmRouteMap';
import { QueueWorkspaceLayout } from '@/trade-crm/shared/layouts/QueueWorkspaceLayout';
import {
  getTradeCrmCurrentView,
  getTradeCrmPageTabs,
} from '@/trade-crm/shared/navigation/tradeCrmPageView';
import {
  createTradeCrmRecordSource,
  getTradeCrmRecordPathFromSource,
} from '@/trade-crm/shared/navigation/tradeCrmRecordSource';
import { useLeadFirstResponseRisk } from '@/workbench/hooks/useLeadFirstResponseRisk';
import { useTodayNewLeads } from '@/workbench/hooks/useTodayNewLeads';
import { useTradeCrmObjectViewLink } from '@/workbench/hooks/useTradeCrmObjectViewLink';

type ProspectingWorkspaceViewKey =
  | 'lead-pool'
  | 'today-new-leads'
  | 'first-response-risk'
  | 'channel-intake'
  | 'assignment-review';

type ProspectingWorkspaceView = {
  key: ProspectingWorkspaceViewKey;
  label: string;
  title: string;
  heroTitle: string;
  heroDescription: string;
};

const getRecordTextValue = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
};

const getRecordSelectLabel = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    const option = value as {
      label?: string | null;
      value?: string | null;
      name?: string | null;
    };

    return option.label ?? option.name ?? option.value ?? null;
  }

  return null;
};

const getRecordRelationName = (value: unknown): string | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const relation = value as {
    name?:
      | string
      | {
          firstName?: string | null;
          lastName?: string | null;
        }
      | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    primaryEmail?: string | null;
  };

  if (typeof relation.name === 'string' && relation.name.trim().length > 0) {
    return relation.name;
  }

  if (relation.name && typeof relation.name === 'object') {
    const fullName = [relation.name.firstName, relation.name.lastName]
      .filter((part): part is string => Boolean(part?.trim()))
      .join(' ')
      .trim();

    if (fullName.length > 0) {
      return fullName;
    }
  }

  const objectFullName = [relation.firstName, relation.lastName]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(' ')
    .trim();

  return (
    (objectFullName.length > 0 ? objectFullName : null) ??
    relation.primaryEmail ??
    relation.email ??
    null
  );
};

const getRecordRelationId = (value: unknown): string | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const relation = value as {
    id?: string | null;
  };

  return relation.id ?? null;
};

const prospectingWorkspaceViews: ProspectingWorkspaceView[] = [
  {
    key: 'lead-pool',
    label: 'Lead Pool',
    title: 'Lead Pool',
    heroTitle:
      'Stabilize inbound intake, ownership, and qualification before pushing records into customer or opportunity execution.',
    heroDescription:
      'The prospecting workspace should answer three questions first: what entered the system, who owns the next move, and whether the lead is ready for follow-up, conversion, or review.',
  },
  {
    key: 'today-new-leads',
    label: 'Today New Leads',
    title: 'Today New Leads',
    heroTitle:
      'Pull today\'s inbound leads into one fast review surface so fresh demand does not disappear into a passive list.',
    heroDescription:
      'The first pass on new leads is not about filling every field. It is about quick qualification, owner confirmation, and deciding whether the lead should move, wait, or be rejected.',
  },
  {
    key: 'first-response-risk',
    label: 'First Response Risk',
    title: 'First Response Risk',
    heroTitle:
      'Expose first-response SLA pressure as its own queue instead of letting urgent leads sink inside the general pool.',
    heroDescription:
      'Phase one depends on visible first-response discipline. This queue should show which leads are already late, close to late, or repeatedly left without a clear response owner.',
  },
  {
    key: 'channel-intake',
    label: 'Channel Intake',
    title: 'Channel Intake',
    heroTitle:
      'Keep Alibaba, import, form, and webhook intake inside one acquisition surface instead of fragmenting lead handling.',
    heroDescription:
      'Different channels may enter through different pipes, but the operating model should still converge on one lead execution chain with visible source, routing, and manual confirmation.',
  },
  {
    key: 'assignment-review',
    label: 'Assignment Review',
    title: 'Assignment Review',
    heroTitle:
      'Product-category routing is the default path. Manual reassignment is the exception path and should stay visible.',
    heroDescription:
      'Assignment review exists to expose missing category data, missing owners, and supervisor-only exceptions. The routing model should not disappear into hidden setup pages.',
  },
];

export const TradeCrmProspectingPage = () => {
  const [searchParams] = useSearchParams();
  const { objectMetadataItems } = useObjectMetadataItems();
  const { totalTodayNewLeadsCount, loading, hasError } = useTodayNewLeads();
  const {
    integrationHubApiBaseUrl,
    totalRiskCount,
    loading: riskLoading,
    errorMessage,
  } = useLeadFirstResponseRisk();

  const hasLeadObject = objectMetadataItems.some(
    (item) => item.nameSingular === 'lead',
  );
  const {
    records: leadRecords,
    totalCount: leadTotalCount,
    loading: leadRecordsLoading,
    error: leadRecordsError,
  } = useFindManyRecords({
    objectNameSingular: 'lead',
    limit: 1,
    skip: !hasLeadObject,
  });

  const requestedView = searchParams.get('view');
  const { currentViewKey, currentView } = getTradeCrmCurrentView({
    requestedView,
    views: prospectingWorkspaceViews,
    fallbackViewKey: 'lead-pool' satisfies ProspectingWorkspaceViewKey,
  });

  const leadPoolLink = useTradeCrmObjectViewLink({
    objectNameSingular: 'lead',
    preferredViewName: 'Leads (Trade CRM)',
  });
  const todayNewLeadsLink = useTradeCrmObjectViewLink({
    objectNameSingular: 'lead',
    preferredViewName: 'Today New Leads',
  });
  const firstResponseWorkspaceLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.prospecting,
    'first-response-risk',
  );
  const assignmentReviewWorkspaceLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.prospecting,
    'assignment-review',
  );
  const channelIntakeWorkspaceLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.prospecting,
    'channel-intake',
  );
  const leadPoolSource = createTradeCrmRecordSource({
    href: leadPoolLink,
    workspaceKey: 'prospecting',
    workspaceLabel: 'Prospecting',
    viewKey: 'lead-pool',
    viewLabel: 'Lead Pool',
  });

  const firstLeadRecordLink = leadRecords?.[0]?.id
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: 'lead',
        objectRecordId: leadRecords[0].id,
        source: leadPoolSource,
      })
    : undefined;
  const firstLeadRecord = leadRecords?.[0] as Record<string, unknown> | undefined;
  const firstLeadStatus = getRecordSelectLabel(firstLeadRecord?.leadStatus);
  const firstLeadSource = getRecordSelectLabel(firstLeadRecord?.source);
  const firstLeadCategory = getRecordSelectLabel(firstLeadRecord?.productCategory);
  const firstLeadCountry = getRecordTextValue(firstLeadRecord?.country);
  const firstLeadOwnerName = getRecordRelationName(firstLeadRecord?.accountOwner);
  const firstLeadOwnerId = getRecordRelationId(firstLeadRecord?.accountOwner);
  const firstLeadContactAnchor =
    getRecordTextValue(firstLeadRecord?.contactName) ??
    getRecordTextValue(firstLeadRecord?.email) ??
    getRecordTextValue(firstLeadRecord?.companyName);

  const leadRecordDescription = !hasLeadObject
    ? 'Lead object metadata is not initialized yet. Complete the phase-one object setup before direct record handoff starts here.'
    : leadRecordsLoading
      ? 'Loading one live lead record so the workspace can hand off into the actual detail shell.'
      : leadRecordsError
        ? 'Lead record handoff is temporarily unavailable. Open the lead list to retry.'
        : firstLeadRecordLink
          ? `Direct handoff is ready. ${leadTotalCount ?? 0} lead records currently exist in CRM core.`
          : 'No live lead record exists yet. Stay on the lead queue until the first record is available.';

  const todayLeadDescription = !hasLeadObject
    ? 'Lead object metadata is not initialized yet. Run the phase-one object and view setup first.'
    : loading
      ? 'Loading today new lead count from CRM core.'
      : hasError
        ? 'Today new lead queue is temporarily unavailable. Use the lead list to retry.'
        : `${totalTodayNewLeadsCount} new leads were created today and should enter qualification quickly.`;

  const firstResponseDescription = !integrationHubApiBaseUrl
    ? 'integration-hub is not configured yet, so the first-response risk queue cannot be calculated.'
    : riskLoading
      ? 'Loading first-response SLA risk from integration-hub.'
      : errorMessage
        ? 'First-response risk is temporarily unavailable. Open the lead pool and retry later.'
        : `${totalRiskCount} leads currently need first-response protection or review.`;

  const activeWorkstreamLabel =
    totalRiskCount > 0
      ? 'First response protection'
      : totalTodayNewLeadsCount > 0
        ? 'Fresh lead qualification'
        : 'Lead pool review';
  const liveLeadContextLabel = firstLeadRecordLink
    ? 'Live lead detail bridge'
    : 'Queue-only lead review';

  const tabs = getTradeCrmPageTabs({
    route: tradeCrmRouteMap.prospecting,
    views: prospectingWorkspaceViews,
    currentViewKey,
  });

  const sidebarItems = [
    {
      label: 'Lead Pool',
      hint: 'Review ownership, status movement, and qualification readiness in one visible base queue.',
      isActive: currentViewKey === 'lead-pool',
      to: getTradeCrmScopedViewPath(tradeCrmRouteMap.prospecting, 'lead-pool'),
      countLabel: hasLeadObject ? 'Ready' : 'N/A',
    },
    {
      label: 'Today New Leads',
      hint: 'Review fresh inbound leads before they drift into delayed follow-up.',
      isActive: currentViewKey === 'today-new-leads',
      to: getTradeCrmScopedViewPath(
        tradeCrmRouteMap.prospecting,
        'today-new-leads',
      ),
      countLabel: `${totalTodayNewLeadsCount}`,
    },
    {
      label: 'First Response Risk',
      hint: 'Protect the 12-hour response rule and keep urgent leads from silently aging.',
      isActive: currentViewKey === 'first-response-risk',
      to: firstResponseWorkspaceLink,
      countLabel: `${totalRiskCount}`,
    },
    {
      label: 'Channel Intake',
      hint: 'Keep source intake, channel traceability, and human confirmation in one path.',
      isActive: currentViewKey === 'channel-intake',
      to: channelIntakeWorkspaceLink,
      countLabel: 'Multi',
    },
    {
      label: 'Assignment Review',
      hint: 'Use product-category routing by default and review exceptions explicitly.',
      isActive: currentViewKey === 'assignment-review',
      to: assignmentReviewWorkspaceLink,
      countLabel: 'Review',
    },
  ];

  const leadRecordShellCard = {
    title: 'Open Lead Record',
    description: leadRecordDescription,
    href: firstLeadRecordLink ?? (hasLeadObject ? leadPoolLink : undefined),
    actionLabel: firstLeadRecordLink ? 'Open lead record' : 'Open lead queue',
  };

  const cards =
    currentViewKey === 'today-new-leads'
      ? [
          leadRecordShellCard,
          {
            title: 'Today New Leads',
            description: todayLeadDescription,
            href: hasLeadObject ? todayNewLeadsLink : undefined,
            actionLabel: 'Open today new leads',
            secondaryHref: firstLeadRecordLink,
            secondaryActionLabel: 'Open first lead record',
          },
          {
            title: 'Qualification First',
            description:
              'Fresh inbound leads should be qualified and assigned before the team spends time polishing lower-priority details.',
            href: hasLeadObject ? leadPoolLink : undefined,
            actionLabel: 'Open lead pool',
          },
          {
            title: 'First-response Linkage',
            description:
              'If fresh leads are not handled quickly, they should appear in the first-response risk queue rather than quietly aging inside a generic list.',
            href: firstResponseWorkspaceLink,
            actionLabel: 'Open first-response risk',
          },
          {
            title: 'Owner Discipline',
            description:
              'New leads should not remain ownerless for long. Assignment gaps need to stay visible in the same prospecting surface.',
            href: assignmentReviewWorkspaceLink,
            actionLabel: 'Open assignment review',
          },
        ]
      : currentViewKey === 'first-response-risk'
        ? [
            leadRecordShellCard,
          {
            title: 'First Response Risk',
            description: firstResponseDescription,
            href: hasLeadObject ? leadPoolLink : undefined,
            actionLabel: 'Open response-risk base',
            secondaryHref: firstLeadRecordLink,
            secondaryActionLabel: 'Open first lead record',
          },
            {
              title: 'SLA Guardrail',
              description:
                'This queue exists to make delayed response visible early. It should drive reminders and escalation, not wait for list views to be checked manually.',
            },
            {
              title: 'integration-hub Dependency',
              description: integrationHubApiBaseUrl
                ? 'integration-hub is already feeding first-response risk signals into this workspace. The CRM side should keep those signals operational and visible.'
                : 'integration-hub is not configured yet, so the system cannot calculate a complete first-response risk queue.',
            },
            {
              title: 'Manager Review',
              description:
                'Supervisors should review overdue or repeatedly ignored first-response cases from the same operating chain instead of relying on separate reporting later.',
              href: tradeCrmRouteMap.analytics,
              actionLabel: 'Open team data',
            },
          ]
        : currentViewKey === 'channel-intake'
          ? [
              leadRecordShellCard,
              {
                title: 'Channel Intake',
                description:
                  'Alibaba, forms, manual import, and webhook intake should all converge into the same lead execution path instead of creating isolated acquisition states.',
                href: hasLeadObject ? leadPoolLink : undefined,
                actionLabel: 'Open lead base',
              },
              {
                title: 'Source Traceability',
                description:
                  'Every lead should retain its intake source so later review can trace routing quality, source effect, and team handling quality.',
              },
              {
                title: 'AI-sourced Prospects',
                description:
                  'AI-discovered prospects can help intake, but they still require human confirmation before they become real CRM leads.',
                href: tradeCrmRouteMap.mail,
                actionLabel: 'Open mail workspace',
              },
              {
                title: 'Settings Linkage',
                description:
                  'Source rules, deduplication, and routing logic belong in Trade CRM settings. This page should expose them, not hardcode them into copy.',
                href: tradeCrmRouteMap.settings,
                actionLabel: 'Open Trade CRM settings',
              },
            ]
          : currentViewKey === 'assignment-review'
            ? [
                leadRecordShellCard,
                {
                  title: 'Category-first Routing',
                  description:
                    'Lead assignment should start with product-category routing. Manual reassignment is the exception path used only for edge cases or supervisor decisions.',
                  href: hasLeadObject ? leadPoolLink : undefined,
                  actionLabel: 'Open lead pool',
                  secondaryHref: firstLeadRecordLink,
                  secondaryActionLabel: 'Open first lead record',
                },
                {
                  title: 'Exception Handling',
                  description:
                    'Use this surface to expose missing category data, missing owners, and records that require manual reassignment.',
                },
                {
                  title: 'Settings Review',
                  description:
                    'Assignment rules, source rules, and deduplication should remain configurable from the Trade CRM settings layer.',
                  href: tradeCrmRouteMap.settings,
                  actionLabel: 'Open Trade CRM settings',
                },
                {
                  title: 'Manager Guardrail',
                  description:
                    'Supervisors need to distinguish between leads that require reassignment and leads that simply need better source or category data.',
                  href: tradeCrmRouteMap.analytics,
                  actionLabel: 'Open team data',
                },
              ]
            : [
                leadRecordShellCard,
                {
                  title: 'Lead Pool',
                  description: hasLeadObject
                    ? 'Open the main lead queue for qualification, owner review, status movement, and lead-level execution.'
                    : 'Lead object metadata is not available yet. Complete the object initialization first.',
                  href: hasLeadObject ? leadPoolLink : undefined,
                  actionLabel: 'Open lead pool',
                  secondaryHref: firstLeadRecordLink,
                  secondaryActionLabel: 'Open first lead record',
                },
                {
                  title: 'Today New Leads',
                  description: todayLeadDescription,
                  href: hasLeadObject ? todayNewLeadsLink : undefined,
                  actionLabel: 'Open today new leads',
                  secondaryHref: firstLeadRecordLink,
                  secondaryActionLabel: 'Open first lead record',
                },
                {
                  title: 'First Response Risk',
                  description: firstResponseDescription,
                  href: hasLeadObject ? leadPoolLink : undefined,
                  actionLabel: 'Open response-risk base',
                  secondaryHref: firstLeadRecordLink,
                  secondaryActionLabel: 'Open first lead record',
                },
                {
                  title: 'Channel Intake',
                  description:
                    'Alibaba, forms, manual import, and webhook intake should converge into the same lead pool instead of creating isolated acquisition pages or duplicate lead states.',
                  href: channelIntakeWorkspaceLink,
                  actionLabel: 'Open channel intake',
                },
                {
                  title: 'Assignment Review',
                  description:
                    'Lead ownership should follow product-category routing first. Manual reassignment is an exception path, not the default distribution mechanism.',
                  href: assignmentReviewWorkspaceLink,
                  actionLabel: 'Open assignment review',
                },
              ];

  const insights =
    currentViewKey === 'first-response-risk'
      ? [
          {
            label: 'Assignment',
            value: 'Response first',
            description:
              'Protect first response before deeper qualification or longer-cycle nurturing work continues.',
          },
          {
            label: 'Promotion',
            value: 'Manual escalation',
            description:
              'Reminders and escalation are allowed. Automatic lead-state promotion is not.',
          },
          {
            label: 'Traceability',
            value: 'SLA visible',
            description:
              'Late and near-late leads should stay visible inside the operating surface, not only inside logs.',
          },
          {
            label: 'Conversion boundary',
            value: 'Still manual',
            description:
              'Responding to a lead does not automatically make it a customer or an opportunity.',
          },
        ]
      : currentViewKey === 'channel-intake'
        ? [
            {
              label: 'Assignment',
              value: 'Unified intake',
              description:
                'Channels may differ, but they should still land in one lead execution chain.',
            },
            {
              label: 'Promotion',
              value: 'Human confirmation',
              description:
                'AI or imported intake still requires human confirmation before formal lead promotion.',
            },
            {
              label: 'Traceability',
              value: 'Channel retained',
              description:
                'Each lead should retain source context for later routing and source-effect review.',
            },
            {
              label: 'Conversion boundary',
              value: 'Lead first',
              description:
                'The system should create or update a lead first, then let sellers decide the next business move.',
            },
          ]
        : currentViewKey === 'assignment-review'
          ? [
              {
                label: 'Assignment',
                value: 'Category first',
                description:
                  'Product categories follow the storefront top-level classification and drive routing first.',
              },
              {
                label: 'Promotion',
                value: 'Review exceptions',
                description:
                  'Manual reassignment is an exception path and should stay reviewable.',
              },
              {
                label: 'Traceability',
                value: 'Owner visible',
                description:
                  'Missing owners and routing anomalies must remain visible to supervisors.',
              },
              {
                label: 'Conversion boundary',
                value: 'Routing before conversion',
                description:
                  'Leads with unclear ownership should not skip directly into later customer or opportunity stages.',
              },
            ]
          : [
              {
                label: 'Assignment',
                value: 'Category first',
                description:
                  'Product category follows the Alibaba storefront top-level categories.',
              },
              {
                label: 'Promotion',
                value: 'Manual confirmation',
                description:
                  'AI-sourced prospects require human confirmation before promotion into true CRM leads.',
              },
              {
                label: 'Traceability',
                value: 'Channel retained',
                description:
                  'Each lead keeps intake source so later conversion analysis has a clean basis.',
              },
              {
                label: 'Conversion boundary',
                value: 'Manual judgment',
                description:
                  'Lead to customer or opportunity movement still requires seller judgment instead of automatic state promotion.',
              },
            ];

  return (
    <QueueWorkspaceLayout
      title="Prospecting"
      heroTitle={currentView.heroTitle}
      heroDescription={currentView.heroDescription}
      heroPills={[
        `Lead pool ${hasLeadObject ? 'available' : 'not ready'}`,
        `Today new leads ${totalTodayNewLeadsCount}`,
        `First-response risk ${totalRiskCount}`,
        `Current ${currentView.title}`,
        `Priority ${activeWorkstreamLabel}`,
        liveLeadContextLabel,
      ]}
      tabs={tabs}
      sidebarTitle="Prospecting workspace"
      sidebarItems={sidebarItems}
      cards={cards}
      insightTitle="Lead execution rules"
      insightDescription="This workspace should answer what came in, who owns it, which leads are at response risk, and where supervisors need to intervene."
      insights={insights}
      workspaceContext={{
        workspace: 'Lead Center',
        entityType: 'lead',
        entityId: firstLeadRecord?.id as string | undefined,
        ownerId: firstLeadOwnerId ?? undefined,
        channel: 'lead-intake-and-qualification',
        stage: firstLeadStatus ?? currentView.title,
        summaryText: [
          'Workspace: Lead Center',
          `Current view: ${currentView.title}`,
          `Today New Leads: ${totalTodayNewLeadsCount}`,
          `First-response risk: ${totalRiskCount}`,
          `Priority: ${activeWorkstreamLabel}`,
          `Live Lead Record: ${firstLeadRecordLink ? 'available' : 'not available'}`,
          `Lead Status: ${firstLeadStatus ?? 'unknown'}`,
          `Lead Source: ${firstLeadSource ?? 'unknown'}`,
          `Product Category: ${firstLeadCategory ?? 'unknown'}`,
          `Lead Country: ${firstLeadCountry ?? 'unknown'}`,
          `Lead Contact Anchor: ${firstLeadContactAnchor ?? 'missing'}`,
          `Lead Owner: ${firstLeadOwnerName ?? 'unassigned'}`,
        ].join('\n'),
      }}
    />
  );
};
