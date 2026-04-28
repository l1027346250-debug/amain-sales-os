import { useSearchParams } from 'react-router-dom';
import { CoreObjectNameSingular } from 'twenty-shared/types';

import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  getTradeCrmScopedViewPath,
  tradeCrmRouteMap,
} from '@/trade-crm/navigation/tradeCrmRouteMap';
import { PipelineWorkspaceLayout } from '@/trade-crm/shared/layouts/PipelineWorkspaceLayout';
import {
  getTradeCrmCurrentView,
  getTradeCrmPageTabs,
} from '@/trade-crm/shared/navigation/tradeCrmPageView';
import {
  createTradeCrmRecordSource,
  getTradeCrmRecordPathFromSource,
} from '@/trade-crm/shared/navigation/tradeCrmRecordSource';
import { useMyPipelineNeedingNextAction } from '@/workbench/hooks/useMyPipelineNeedingNextAction';
import { useQuoteFollowUpReminderQueue } from '@/workbench/hooks/useQuoteFollowUpReminderQueue';
import { useStalledOpportunityReminderQueue } from '@/workbench/hooks/useStalledOpportunityReminderQueue';
import { useTradeCrmObjectViewLink } from '@/workbench/hooks/useTradeCrmObjectViewLink';

type OpportunityWorkspaceViewKey =
  | 'pipeline-board'
  | 'my-opportunities'
  | 'quotation-follow-up'
  | 'stalled'
  | 'lost-analysis';

type OpportunityWorkspaceView = {
  key: OpportunityWorkspaceViewKey;
  label: string;
  title: string;
  heroTitle: string;
  heroDescription: string;
  heroSummaryTitle: string;
  heroSummaryText: string;
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

const getOpportunityOwnerName = (value: unknown): string | null => {
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
  };

  if (typeof relation.name === 'string' && relation.name.trim().length > 0) {
    return relation.name;
  }

  if (relation.name && typeof relation.name === 'object') {
    const fullName = [relation.name.firstName, relation.name.lastName]
      .filter((part): part is string => Boolean(part?.trim()))
      .join(' ')
      .trim();

    return fullName.length > 0 ? fullName : null;
  }

  return null;
};

const getRelationLabel = (value: unknown): string | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const relation = value as {
    name?: string | null;
  };

  return relation.name ?? null;
};

const opportunityWorkspaceViews: OpportunityWorkspaceView[] = [
  {
    key: 'pipeline-board',
    label: 'Pipeline',
    title: 'Pipeline',
    heroTitle:
      'Review stage movement, quote follow-up, and next-action hygiene before drilling into a single opportunity.',
    heroDescription:
      'The pipeline workspace should expose what is moving, what is slowing down, and which deals need immediate action. It is an execution surface, not a passive archive.',
    heroSummaryTitle: 'Pipeline control',
    heroSummaryText:
      'Use this view to judge movement, delay, and seller pressure first, then open a live deal only when the queue signal is clear.',
  },
  {
    key: 'my-opportunities',
    label: 'My Opportunities',
    title: 'My Opportunities',
    heroTitle:
      'Pull seller-owned opportunities into one operating surface with clear next-action pressure.',
    heroDescription:
      'This workspace keeps seller attention on the opportunities that need movement, follow-up, or stage correction first.',
    heroSummaryTitle: 'Seller pressure',
    heroSummaryText:
      'The seller view should stay biased toward next action, next-action date, and follow-up pressure rather than passive record browsing.',
  },
  {
    key: 'quotation-follow-up',
    label: 'Quote Follow-up',
    title: 'Quote Follow-up',
    heroTitle:
      'Keep quote-stage progress visible inside the opportunity workspace instead of losing it in mailbox-only workflows.',
    heroDescription:
      'Quotation is not the end of the pipeline. The system should keep quote-stage discipline visible through next action, expected response, and manager review.',
    heroSummaryTitle: 'Quote-stage discipline',
    heroSummaryText:
      'Quotation follow-up belongs in the pipeline surface so the team can see aging quotes, reminders, and commercial momentum together.',
  },
  {
    key: 'stalled',
    label: 'Stalled',
    title: 'Stalled Deals',
    heroTitle:
      'Expose slow-moving opportunities through missing updates and missing next steps before adding heavier scoring logic.',
    heroDescription:
      'Phase one needs a stable stalled-risk workspace so sellers and managers can work the queue before deeper analytics arrive.',
    heroSummaryTitle: 'Recovery queue',
    heroSummaryText:
      'Stalled work should surface missing updates, missing next steps, and recovery pressure before the team invests in heavier scoring layers.',
  },
  {
    key: 'lost-analysis',
    label: 'Loss Review',
    title: 'Loss Review',
    heroTitle:
      'Keep lost reasons and breakpoints reviewable from the pipeline surface instead of waiting for a separate BI build.',
    heroDescription:
      'Loss review should already support manager inspection and weekly review through the CRM operating layer.',
    heroSummaryTitle: 'Learning loop',
    heroSummaryText:
      'Loss review should feed directly back into active pipeline management instead of becoming an isolated reporting exercise.',
  },
];

export const TradeCrmOpportunitiesPage = () => {
  const [searchParams] = useSearchParams();
  const { objectMetadataItems } = useObjectMetadataItems();
  const hasOpportunityObject = objectMetadataItems.some(
    (item) => item.nameSingular === CoreObjectNameSingular.Opportunity,
  );

  const requestedView = searchParams.get('view');
  const { currentViewKey, currentView } = getTradeCrmCurrentView({
    requestedView,
    views: opportunityWorkspaceViews,
    fallbackViewKey: 'pipeline-board' satisfies OpportunityWorkspaceViewKey,
  });

  const {
    records: opportunityRecords,
    totalCount: opportunityTotalCount,
    loading: opportunitiesLoading,
    error: opportunitiesError,
  } = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    limit: 1,
    skip: !hasOpportunityObject,
  });

  const {
    myPipelineNeedingNextAction,
    totalMyPipelineNeedingNextActionCount,
    loading: nextActionLoading,
    hasError: nextActionError,
  } = useMyPipelineNeedingNextAction();
  const {
    integrationHubApiBaseUrl,
    quoteFollowUpReminders,
    totalQuoteFollowUpReminderCount,
    loading: quoteFollowUpLoading,
    errorMessage: quoteFollowUpErrorMessage,
  } = useQuoteFollowUpReminderQueue();
  const {
    stalledOpportunityReminders,
    totalStalledOpportunityReminderCount,
    loading: stalledLoading,
    errorMessage: stalledErrorMessage,
  } = useStalledOpportunityReminderQueue();

  const opportunityListLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });
  const pipelineBoardSource = createTradeCrmRecordSource({
    href: opportunityListLink,
    workspaceKey: 'opportunities',
    workspaceLabel: 'Pipeline',
    viewKey: 'pipeline-board',
    viewLabel: 'Pipeline',
  });
  const firstOpportunityRecordLink = opportunityRecords?.[0]?.id
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: CoreObjectNameSingular.Opportunity,
        objectRecordId: opportunityRecords[0].id,
        source: pipelineBoardSource,
      })
    : undefined;
  const firstOpportunityRecord = opportunityRecords?.[0] as
    | Record<string, unknown>
    | undefined;
  const firstOpportunityName =
    getRecordTextValue(firstOpportunityRecord?.name) ?? 'Live opportunity';
  const firstOpportunityStage =
    getRecordTextValue(firstOpportunityRecord?.stage) ?? 'Unknown stage';
  const firstOpportunityOwnerName =
    getOpportunityOwnerName(firstOpportunityRecord?.owner) ?? 'Unassigned';
  const firstOpportunityCompanyName =
    getRelationLabel(firstOpportunityRecord?.company) ??
    getRecordTextValue(firstOpportunityRecord?.companyName) ??
    'No account anchor';
  const pipelineNeedsNextActionLink = useTradeCrmObjectViewLink({
    objectNameSingular: 'opportunity',
    preferredViewName: 'Pipeline Needs Next Action',
  });
  const quotationFollowUpWorkspaceLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.opportunities,
    'quotation-follow-up',
  );
  const stalledWorkspaceLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.opportunities,
    'stalled',
  );
  const lostAnalysisWorkspaceLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.opportunities,
    'lost-analysis',
  );
  const nextActionSource = createTradeCrmRecordSource({
    href: pipelineNeedsNextActionLink,
    workspaceKey: 'opportunities',
    workspaceLabel: 'Pipeline',
    viewKey: 'my-opportunities',
    viewLabel: 'Next Action Queue',
  });
  const quotationFollowUpSource = createTradeCrmRecordSource({
    href: quotationFollowUpWorkspaceLink,
    workspaceKey: 'opportunities',
    workspaceLabel: 'Pipeline',
    viewKey: 'quotation-follow-up',
    viewLabel: 'Quote Follow-up',
  });
  const stalledSource = createTradeCrmRecordSource({
    href: stalledWorkspaceLink,
    workspaceKey: 'opportunities',
    workspaceLabel: 'Pipeline',
    viewKey: 'stalled',
    viewLabel: 'Stalled',
  });
  const firstNextActionRecordLink = myPipelineNeedingNextAction[0]?.id
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: CoreObjectNameSingular.Opportunity,
        objectRecordId: myPipelineNeedingNextAction[0].id,
        source: nextActionSource,
      })
    : undefined;
  const firstQuoteReminderRecordLink = quoteFollowUpReminders[0]?.opportunityId
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: CoreObjectNameSingular.Opportunity,
        objectRecordId: quoteFollowUpReminders[0].opportunityId,
        source: quotationFollowUpSource,
      })
    : undefined;
  const firstStalledReminderRecordLink = stalledOpportunityReminders[0]?.opportunityId
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: CoreObjectNameSingular.Opportunity,
        objectRecordId: stalledOpportunityReminders[0].opportunityId,
        source: stalledSource,
      })
    : undefined;

  const opportunityBaseDescription = !hasOpportunityObject
    ? 'Opportunity object metadata is not initialized yet. Complete the phase-one object setup before pipeline execution starts here.'
    : opportunitiesLoading
      ? 'Loading opportunity coverage from CRM core.'
      : opportunitiesError
        ? 'Opportunity list is temporarily unavailable. Open the standard opportunity list to retry.'
        : `${opportunityTotalCount ?? 0} opportunities are currently available for pipeline review, quote follow-up, and stage progression.`;

  const nextActionDescription = !hasOpportunityObject
    ? 'Pipeline hygiene depends on the opportunity object being available first.'
    : nextActionLoading
      ? 'Loading opportunities that still need a next action or next action date.'
      : nextActionError
        ? 'Pipeline hygiene queue is temporarily unavailable. Open the opportunity list to retry.'
        : `${totalMyPipelineNeedingNextActionCount} open opportunities currently need a next action or next action date.`;
  const quotationFollowUpDescription = !integrationHubApiBaseUrl
    ? 'integration-hub is not configured yet, so quotation follow-up reminders cannot be loaded.'
    : quoteFollowUpLoading
      ? 'Loading quotation follow-up reminders from integration-hub.'
      : quoteFollowUpErrorMessage
        ? 'Quote follow-up reminder queue is temporarily unavailable. Open the pipeline workspace to retry.'
        : `${totalQuoteFollowUpReminderCount} opportunities are currently overdue for quotation follow-up.`;
  const stalledDescription = !integrationHubApiBaseUrl
    ? 'integration-hub is not configured yet, so stalled opportunity reminders cannot be loaded.'
    : stalledLoading
      ? 'Loading stalled reminder queue from integration-hub.'
      : stalledErrorMessage
        ? 'Stalled reminder queue is temporarily unavailable. Open the pipeline workspace to retry.'
        : `${totalStalledOpportunityReminderCount} opportunities are currently flagged as stalled and need re-engagement.`;

  const pipelinePriorityLabel =
    totalMyPipelineNeedingNextActionCount > 0
      ? 'Next action hygiene'
      : totalQuoteFollowUpReminderCount > 0
        ? 'Quote follow-up pressure'
      : totalStalledOpportunityReminderCount > 0
        ? 'Stalled recovery'
      : (opportunityTotalCount ?? 0) > 0
        ? 'Quote and stage follow-up'
        : 'Pipeline base setup';
  const pipelinePriorityDescription =
    totalMyPipelineNeedingNextActionCount > 0
      ? 'Open deals are missing a next action or next-action date and need direct seller cleanup first.'
      : totalQuoteFollowUpReminderCount > 0
        ? 'Quoted deals are aging without enough follow-up and should be pushed back into active seller motion.'
      : totalStalledOpportunityReminderCount > 0
        ? 'The pipeline contains stalled deals that need re-engagement or manager review before they silently decay.'
      : (opportunityTotalCount ?? 0) > 0
        ? 'The base pipeline is available, so the next focus is quotation discipline and stage movement.'
        : 'Opportunity object setup exists before live commercial records accumulate.';

  const recordShellCard = {
    title:
      firstOpportunityRecordLink != null
        ? 'Latest live opportunity'
        : 'Open Live Deal',
    description:
      firstOpportunityRecordLink != null
        ? `${firstOpportunityName} | Stage: ${firstOpportunityStage} | Owner: ${firstOpportunityOwnerName} | Account: ${firstOpportunityCompanyName}`
        : 'No opportunity record is available yet. Stay on the opportunity base until the first live record exists.',
    href:
      firstOpportunityRecordLink ??
      (hasOpportunityObject ? opportunityListLink : undefined),
    actionLabel:
      firstOpportunityRecordLink != null
        ? 'Open opportunity record'
        : 'Open opportunity base',
  };

  const tabs = getTradeCrmPageTabs({
    route: tradeCrmRouteMap.opportunities,
    views: opportunityWorkspaceViews,
    currentViewKey,
  });

  const columns =
    currentViewKey === 'my-opportunities'
      ? [
          {
            label: 'My opportunities',
            cards: [
              {
                title: 'Opportunity coverage',
                description: opportunityBaseDescription,
                href: hasOpportunityObject ? opportunityListLink : undefined,
                actionLabel: 'Open opportunity list',
              },
              recordShellCard,
              {
                title: 'Primary seller entry',
                description:
                  'Keep seller execution anchored to the live opportunity base first, then use queue views to pressure next moves.',
                href: hasOpportunityObject ? opportunityListLink : undefined,
                actionLabel: 'Review pipeline base',
              },
            ],
          },
          {
            label: 'Next action',
            cards: [
              {
                title: 'Pipeline Needs Next Action',
                description: nextActionDescription,
                href: hasOpportunityObject
                  ? pipelineNeedsNextActionLink
                  : undefined,
                actionLabel: 'Open next-action queue',
                secondaryHref: firstNextActionRecordLink,
                secondaryActionLabel: 'Open first opportunity',
              },
              {
                title: 'Hygiene rule',
                description:
                  'Every active opportunity should carry both a next action and a next action date.',
              },
            ],
          },
          {
            label: 'Quote follow-up',
            cards: [
              {
                title: 'Mail linkage',
                description:
                  'Quote follow-up can use mail, but quote-stage progress still needs to stay visible inside the opportunity workspace.',
                href: tradeCrmRouteMap.mail,
                actionLabel: 'Open mail workspace',
              },
              {
                title: 'Manager review',
                description: quotationFollowUpDescription,
                href: tradeCrmRouteMap.analytics,
                actionLabel: 'Open team data',
              },
              {
                title: 'Quotation queue',
                description: quotationFollowUpDescription,
                href: quotationFollowUpWorkspaceLink,
                actionLabel: 'Open quotation workspace',
                secondaryHref: firstQuoteReminderRecordLink,
                secondaryActionLabel: 'Open first opportunity',
              },
            ],
          },
        ]
      : currentViewKey === 'quotation-follow-up'
        ? [
            {
              label: 'Quote-stage deals',
              cards: [
                {
                  title: 'Opportunity base',
                  description:
                    'Quotation follow-up stays inside the opportunity surface instead of being split into mailbox-only actions.',
                  href: hasOpportunityObject ? opportunityListLink : undefined,
                  actionLabel: 'Open opportunity base',
                },
                recordShellCard,
                {
                  title: 'Follow-up discipline',
                  description: quotationFollowUpDescription,
                },
              ],
            },
            {
              label: 'Advance',
              cards: [
                {
                  title: 'Next-action queue',
                  description: nextActionDescription,
                  href: hasOpportunityObject
                    ? pipelineNeedsNextActionLink
                    : undefined,
                  actionLabel: 'Open next-action queue',
                  secondaryHref: firstNextActionRecordLink,
                  secondaryActionLabel: 'Open first opportunity',
                },
                {
                  title: 'Mail support',
                  description:
                    'Mail supports quotation follow-up, but commercial stage and outcome still belong to the opportunity record.',
                  href: tradeCrmRouteMap.mail,
                  actionLabel: 'Open mail workspace',
                },
              ],
            },
            {
              label: 'Manager checks',
              cards: [
                {
                  title: 'Review priority',
                  description: quotationFollowUpDescription,
                  href: tradeCrmRouteMap.analytics,
                  actionLabel: 'Open team data',
                },
                {
                  title: 'Return to pipeline',
                  description:
                    'After checking quote-stage discipline, return to the main pipeline surface to continue stage review and owner follow-up.',
                  href: tradeCrmRouteMap.opportunities,
                  actionLabel: 'Open pipeline overview',
                },
                {
                  title: 'Boundary',
                  description:
                    'Automation may remind, but AI must not directly change the main opportunity stage.',
                },
              ],
            },
          ]
        : currentViewKey === 'stalled'
          ? [
              {
                label: 'Stalled detection',
                cards: [
                {
                  title: 'Stalled risk',
                    description: stalledDescription,
                    href: hasOpportunityObject
                      ? stalledWorkspaceLink
                      : undefined,
                    actionLabel: 'Open stalled queue',
                    secondaryHref: firstStalledReminderRecordLink,
                    secondaryActionLabel: 'Open first opportunity',
                  },
                  {
                    title: 'Current entry',
                    description: stalledDescription,
                  },
                  {
                    title: 'Pipeline return',
                    description:
                      'After clearing stalled-risk items, move back to the main pipeline view for broader stage review.',
                    href: tradeCrmRouteMap.opportunities,
                    actionLabel: 'Open pipeline overview',
                  },
                ],
              },
              {
                label: 'Actions',
                cards: [
                  {
                    title: 'Seller action',
                    description:
                      'First restore next action, next action date, and verify whether the current stage still matches reality.',
                  },
                  {
                    title: 'Manager action',
                    description: stalledDescription,
                    href: tradeCrmRouteMap.analytics,
                    actionLabel: 'Open team data',
                  },
                ],
              },
              {
                label: 'Boundaries',
                cards: [
                  {
                    title: 'AI boundary',
                    description:
                      'AI can surface stalled risk and suggest next steps, but it cannot auto-close or auto-change the stage.',
                  },
                  {
                    title: 'System boundary',
                    description:
                      'Stalled detection belongs to CRM execution hygiene, not ERP orchestration.',
                  },
                ],
              },
            ]
          : currentViewKey === 'lost-analysis'
            ? [
                {
                  label: 'Loss review',
                  cards: [
                    {
                      title: 'Standardized lost reasons',
                      description:
                        'Lost reasons should stay standardized and attached to the live opportunity base first.',
                      href: hasOpportunityObject ? opportunityListLink : undefined,
                      actionLabel: 'Open opportunity list',
                    },
                    {
                      title: 'Review target',
                      description:
                        'Loss review should already support weekly manager review before a full BI layer exists.',
                    },
                  ],
                },
                {
                  label: 'Review dimensions',
                  cards: [
                    {
                      title: 'Stage breakpoint',
                      description:
                        'Check which stages fail most often before deciding whether quoting, follow-up, or qualification needs adjustment.',
                    },
                    {
                      title: 'Team review',
                      description:
                        'Team data should absorb lost-deal review rather than waiting for a separate warehouse project.',
                      href: tradeCrmRouteMap.analytics,
                      actionLabel: 'Open team data',
                    },
                    {
                      title: 'Return to live queue',
                      description:
                        'After reviewing loss patterns, return to live open deals so the findings change current execution rather than staying as passive reporting.',
                      href: hasOpportunityObject
                        ? pipelineNeedsNextActionLink
                        : undefined,
                      actionLabel: 'Open next-action queue',
                    },
                  ],
                },
                {
                  label: 'Next step',
                  cards: [
                    {
                      title: 'Follow-on direction',
                      description:
                        'A later round can connect lost reasons, stage breakpoints, and source impact more tightly in manager reporting.',
                    },
                  ],
                },
              ]
            : [
                {
                  label: 'Pipeline base',
                  cards: [
                    {
                      title: 'Opportunity coverage',
                      description: opportunityBaseDescription,
                      href: hasOpportunityObject ? opportunityListLink : undefined,
                      actionLabel: 'Open opportunity base',
                    },
                    recordShellCard,
                    {
                      title: 'Primary entry',
                      description: hasOpportunityObject
                        ? `Use the live opportunity base at ${opportunityListLink} as the source of truth for stage review and owner-level execution.`
                        : 'Opportunity base becomes available after the phase-one object setup is completed.',
                      href: hasOpportunityObject ? opportunityListLink : undefined,
                      actionLabel: 'Open standard opportunity list',
                    },
                  ],
                },
                {
                  label: 'Advance next',
                  cards: [
                    {
                      title: 'Pipeline Needs Next Action',
                      description: nextActionDescription,
                      href: hasOpportunityObject
                        ? pipelineNeedsNextActionLink
                        : undefined,
                      actionLabel: 'Open next-action queue',
                      secondaryHref: firstNextActionRecordLink,
                      secondaryActionLabel: 'Open first opportunity',
                    },
                    {
                      title: 'Operating priority',
                      description: `Current pipeline priority: ${pipelinePriorityLabel}. ${pipelinePriorityDescription}`,
                    },
                  ],
                },
                {
                  label: 'Quote follow-up',
                  cards: [
                    {
                      title: 'Quotation Sent Stage',
                      description: quotationFollowUpDescription,
                      href: quotationFollowUpWorkspaceLink,
                      actionLabel: 'Switch to quotation follow-up',
                      secondaryHref: firstQuoteReminderRecordLink,
                      secondaryActionLabel: 'Open first opportunity',
                    },
                    {
                      title: 'Commercial discipline',
                      description:
                        'After quotation, follow-up should be treated as a visible pipeline motion problem, not hidden in mailbox-only workflows.',
                    },
                  ],
                },
                {
                  label: 'Risk and review',
                  cards: [
                    {
                      title: 'Stalled deals',
                      description: stalledDescription,
                      href: stalledWorkspaceLink,
                      actionLabel: 'Switch to stalled workspace',
                      secondaryHref: firstStalledReminderRecordLink,
                      secondaryActionLabel: 'Open first opportunity',
                    },
                    {
                      title: 'Loss review',
                      description:
                        'Lost reasons should stay standardized and reviewable from the pipeline base so the team can learn without a separate BI layer.',
                      href: lostAnalysisWorkspaceLink,
                      actionLabel: 'Switch to loss review',
                    },
                    {
                      title: 'Pipeline queue link',
                      description: hasOpportunityObject
                        ? `Use ${pipelineNeedsNextActionLink} for the live queue that needs attention first.`
                        : 'Pipeline hygiene queue becomes available after the opportunity object is initialized.',
                      href: hasOpportunityObject
                        ? pipelineNeedsNextActionLink
                        : undefined,
                      actionLabel: 'Open live queue',
                    },
                  ],
                },
              ];

  return (
    <PipelineWorkspaceLayout
      title="Opportunities"
      heroTitle={currentView.heroTitle}
      heroDescription={currentView.heroDescription}
      heroPills={[
        `${opportunityTotalCount ?? 0} opportunities`,
        `${totalMyPipelineNeedingNextActionCount} need action`,
        `${totalQuoteFollowUpReminderCount} quote follow-up`,
        `${totalStalledOpportunityReminderCount} stalled`,
        currentView.title,
        pipelinePriorityLabel,
      ]}
      heroSummaryTitle={currentView.heroSummaryTitle}
      heroSummaryText={currentView.heroSummaryText}
      tabs={tabs}
      columns={columns}
      workspaceContext={{
        workspace: 'Pipeline',
        entityType: 'opportunity',
        stage: currentView.title,
        channel: 'pipeline-and-quote-follow-up',
        summaryText: [
          'Workspace: Pipeline',
          `Current view: ${currentView.title}`,
          `Opportunities: ${opportunityTotalCount ?? 0}`,
          `Needs next action: ${totalMyPipelineNeedingNextActionCount}`,
          `Quotation follow-up reminders: ${totalQuoteFollowUpReminderCount}`,
          `Stalled reminders: ${totalStalledOpportunityReminderCount}`,
          `Priority: ${pipelinePriorityLabel}`,
        ].join('\n'),
      }}
    />
  );
};
