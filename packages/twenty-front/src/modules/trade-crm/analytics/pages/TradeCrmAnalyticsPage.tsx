import { useSearchParams } from 'react-router-dom';
import { AppPath, SettingsPath } from 'twenty-shared/types';
import { getAppPath, getSettingsPath } from 'twenty-shared/utils';

import {
  getTradeCrmScopedViewPath,
  tradeCrmRouteMap,
} from '@/trade-crm/navigation/tradeCrmRouteMap';
import { AdminWorkspaceLayout } from '@/trade-crm/shared/layouts/AdminWorkspaceLayout';
import {
  getTradeCrmCurrentView,
  getTradeCrmPageTabs,
} from '@/trade-crm/shared/navigation/tradeCrmPageView';
import {
  createTradeCrmRecordSource,
  getTradeCrmRecordPathFromSource,
} from '@/trade-crm/shared/navigation/tradeCrmRecordSource';
import { useLeadFirstResponseRisk } from '@/workbench/hooks/useLeadFirstResponseRisk';
import { useMyPipelineNeedingNextAction } from '@/workbench/hooks/useMyPipelineNeedingNextAction';
import { useQuoteFollowUpReminderQueue } from '@/workbench/hooks/useQuoteFollowUpReminderQueue';
import { useStalledOpportunityReminderQueue } from '@/workbench/hooks/useStalledOpportunityReminderQueue';
import { useTasksDueToday } from '@/workbench/hooks/useTasksDueToday';
import { useTasksOverdueByAssignee } from '@/workbench/hooks/useTasksOverdueByAssignee';
import { useTodayNewLeads } from '@/workbench/hooks/useTodayNewLeads';
import { useTradeCrmObjectViewLink } from '@/workbench/hooks/useTradeCrmObjectViewLink';

type AnalyticsWorkspaceViewKey =
  | 'execution-overview'
  | 'lead-conversion'
  | 'mail-efficiency'
  | 'pipeline-funnel'
  | 'team-performance'
  | 'source-impact';

type AnalyticsWorkspaceView = {
  key: AnalyticsWorkspaceViewKey;
  label: string;
  title: string;
  heroTitle: string;
  heroDescription: string;
};

const analyticsWorkspaceViews: AnalyticsWorkspaceView[] = [
  {
    key: 'execution-overview',
    label: 'Execution Overview',
    title: 'Execution Overview',
    heroTitle:
      'Start with the queues that need manager intervention today, then drill into the underlying records.',
    heroDescription:
      'This page is the manager control layer for daily execution. It should surface pressure from new leads, first-response risk, due tasks, and pipeline hygiene before deeper reporting is needed.',
  },
  {
    key: 'lead-conversion',
    label: 'Lead Conversion',
    title: 'Lead Conversion',
    heroTitle:
      'Use fresh demand and first-response risk to judge whether inbound leads are being caught in time.',
    heroDescription:
      'Phase one lead conversion management stays grounded in operational signals: today new leads, first-response risk, routing quality, and owner follow-through.',
  },
  {
    key: 'mail-efficiency',
    label: 'Mail Efficiency',
    title: 'Mail Efficiency',
    heroTitle:
      'Review reply pressure and follow-up handoff first, then extend into deeper mail analytics later.',
    heroDescription:
      'Mail efficiency in phase one is measured through CRM execution. The key question is whether replies, quote follow-up, and owner tasks keep moving through the workflow.',
  },
  {
    key: 'pipeline-funnel',
    label: 'Pipeline Funnel',
    title: 'Pipeline Funnel',
    heroTitle:
      'Keep stage movement, quote follow-up, and stalled reminders visible before building heavier reporting layers.',
    heroDescription:
      'The pipeline view supports manager inspection and seller follow-up. The focus is on missing next actions, quote-stage delays, and stalled opportunities that need reactivation.',
  },
  {
    key: 'team-performance',
    label: 'Team Performance',
    title: 'Team Performance',
    heroTitle:
      'Measure team performance through visible execution queues instead of abstract ranking tables.',
    heroDescription:
      'Team performance should map back to actual work: lead handling discipline, task completion, and opportunity follow-through. Ranking without queue visibility is not useful.',
  },
  {
    key: 'source-impact',
    label: 'Source Impact',
    title: 'Source Impact',
    heroTitle:
      'Review source quality through lead intake, routing rules, and response coverage before expanding attribution models.',
    heroDescription:
      'Source impact should stay tied to lead operations in phase one. When a source underperforms, the first checks are intake volume, routing accuracy, and response execution.',
  },
];

const getStatusDescription = ({
  loading,
  hasError,
  fallback,
  success,
}: {
  loading: boolean;
  hasError: boolean;
  fallback: string;
  success: string;
}) => {
  if (loading) {
    return 'Loading current manager check signal from CRM core.';
  }

  if (hasError) {
    return fallback;
  }

  return success;
};

const appendPreview = ({
  base,
  preview,
}: {
  base: string;
  preview: string | null;
}) => (preview ? `${base} First visible item: ${preview}.` : base);

export const TradeCrmAnalyticsPage = () => {
  const [searchParams] = useSearchParams();
  const {
    integrationHubApiBaseUrl,
    sellerRiskReminders,
    totalRiskCount,
    loading: riskLoading,
    errorMessage: riskErrorMessage,
  } = useLeadFirstResponseRisk();
  const {
    tasksDueToday,
    totalTasksDueTodayCount,
    loading: tasksLoading,
    hasError: tasksHasError,
  } = useTasksDueToday();
  const {
    overdueTasks,
    totalOverdueTasksCount,
    affectedAssigneeCount,
    ownerPreview,
    loading: overdueTasksLoading,
    hasError: overdueTasksHasError,
  } = useTasksOverdueByAssignee();
  const {
    todayNewLeads,
    totalTodayNewLeadsCount,
    loading: newLeadsLoading,
    hasError: newLeadsHasError,
  } = useTodayNewLeads();
  const {
    myPipelineNeedingNextAction,
    totalMyPipelineNeedingNextActionCount,
    loading: pipelineLoading,
    hasError: pipelineHasError,
  } = useMyPipelineNeedingNextAction();
  const {
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
  const requestedView = searchParams.get('view');
  const { currentViewKey, currentView } = getTradeCrmCurrentView({
    requestedView,
    views: analyticsWorkspaceViews,
    fallbackViewKey: 'execution-overview' satisfies AnalyticsWorkspaceViewKey,
  });

  const leadPoolLink = useTradeCrmObjectViewLink({
    objectNameSingular: 'lead',
    preferredViewName: 'Leads (Trade CRM)',
  });
  const tasksDueTodayLink = useTradeCrmObjectViewLink({
    objectNameSingular: 'task',
    preferredViewName: 'Tasks Due Today',
  });
  const taskBaseLink = useTradeCrmObjectViewLink({
    objectNameSingular: 'task',
  });
  const todayNewLeadsLink = useTradeCrmObjectViewLink({
    objectNameSingular: 'lead',
    preferredViewName: 'Today New Leads',
  });
  const pipelineNeedsNextActionLink = useTradeCrmObjectViewLink({
    objectNameSingular: 'opportunity',
    preferredViewName: 'Pipeline Needs Next Action',
  });
  const opportunityListLink = getAppPath(AppPath.RecordIndexPage, {
    objectNamePlural: 'opportunities',
  });
  const quoteFollowUpWorkspaceLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.opportunities,
    'quotation-follow-up',
  );
  const stalledWorkspaceLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.opportunities,
    'stalled',
  );
  const leadConversionSource = createTradeCrmRecordSource({
    href: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'first-response'),
    workspaceKey: 'analytics',
    workspaceLabel: 'Team',
    viewKey: 'lead-conversion',
    viewLabel: 'Lead Conversion',
  });
  const todayNewLeadsSource = createTradeCrmRecordSource({
    href: todayNewLeadsLink,
    workspaceKey: 'analytics',
    workspaceLabel: 'Team',
    viewKey: 'lead-conversion',
    viewLabel: 'Today New Leads',
  });
  const tasksDueTodaySource = createTradeCrmRecordSource({
    href: tasksDueTodayLink,
    workspaceKey: 'analytics',
    workspaceLabel: 'Team',
    viewKey: 'mail-efficiency',
    viewLabel: 'Tasks Due Today',
  });
  const overdueTasksSource = createTradeCrmRecordSource({
    href: taskBaseLink,
    workspaceKey: 'analytics',
    workspaceLabel: 'Team',
    viewKey: 'team-performance',
    viewLabel: 'Overdue Tasks',
  });
  const pipelineFunnelSource = createTradeCrmRecordSource({
    href: pipelineNeedsNextActionLink,
    workspaceKey: 'analytics',
    workspaceLabel: 'Team',
    viewKey: 'pipeline-funnel',
    viewLabel: 'Pipeline Funnel',
  });
  const quoteFollowUpSource = createTradeCrmRecordSource({
    href: quoteFollowUpWorkspaceLink,
    workspaceKey: 'analytics',
    workspaceLabel: 'Team',
    viewKey: 'mail-efficiency',
    viewLabel: 'Quote Follow-up',
  });
  const stalledRecoverySource = createTradeCrmRecordSource({
    href: stalledWorkspaceLink,
    workspaceKey: 'analytics',
    workspaceLabel: 'Team',
    viewKey: 'pipeline-funnel',
    viewLabel: 'Stalled Recovery',
  });
  const firstLeadRiskRecordLink = sellerRiskReminders[0]?.leadId
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: 'lead',
        objectRecordId: sellerRiskReminders[0].leadId,
        source: leadConversionSource,
      })
    : undefined;
  const firstTodayLeadRecordLink = todayNewLeads[0]?.id
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: 'lead',
        objectRecordId: todayNewLeads[0].id,
        source: todayNewLeadsSource,
      })
    : undefined;
  const firstTaskDueRecordLink = tasksDueToday[0]?.id
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: 'task',
        objectRecordId: tasksDueToday[0].id,
        source: tasksDueTodaySource,
      })
    : undefined;
  const firstOverdueTaskRecordLink = overdueTasks[0]?.id
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: 'task',
        objectRecordId: overdueTasks[0].id,
        source: overdueTasksSource,
      })
    : undefined;
  const firstPipelineRecordLink = myPipelineNeedingNextAction[0]?.id
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: 'opportunity',
        objectRecordId: myPipelineNeedingNextAction[0].id,
        source: pipelineFunnelSource,
      })
    : undefined;
  const firstQuoteRecordLink = quoteFollowUpReminders[0]?.opportunityId
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: 'opportunity',
        objectRecordId: quoteFollowUpReminders[0].opportunityId,
        source: quoteFollowUpSource,
      })
    : undefined;
  const firstStalledRecordLink = stalledOpportunityReminders[0]?.opportunityId
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: 'opportunity',
        objectRecordId: stalledOpportunityReminders[0].opportunityId,
        source: stalledRecoverySource,
      })
    : undefined;

  const managerPriorityLabel =
    totalRiskCount > 0
      ? 'First-response risk'
      : totalOverdueTasksCount > 0
        ? 'Overdue task pressure'
      : totalMyPipelineNeedingNextActionCount > 0
        ? 'Pipeline hygiene'
        : totalTasksDueTodayCount > 0
          ? 'Task execution'
          : 'Rules and coverage review';
  const openExecutionPressure =
    totalRiskCount +
    totalOverdueTasksCount +
    totalTodayNewLeadsCount +
    totalTasksDueTodayCount +
    totalMyPipelineNeedingNextActionCount;
  const executionHealthLabel =
    openExecutionPressure > 15
      ? 'High pressure'
      : openExecutionPressure > 6
        ? 'Manageable'
        : 'Stable';
  const firstLeadRiskPreview =
    sellerRiskReminders[0]?.leadName ??
    sellerRiskReminders[0]?.email ??
    null;
  const firstTodayLeadPreview =
    todayNewLeads[0]?.leadName ??
    todayNewLeads[0]?.contactName ??
    todayNewLeads[0]?.companyName ??
    null;
  const firstTaskDuePreview = tasksDueToday[0]?.title ?? null;
  const firstOverdueTaskPreview =
    overdueTasks[0]?.title ??
    overdueTasks[0]?.assignee?.name ??
    overdueTasks[0]?.assigneeId ??
    null;
  const firstPipelinePreview =
    myPipelineNeedingNextAction[0]?.name ??
    myPipelineNeedingNextAction[0]?.company?.name ??
    null;
  const firstQuotePreview =
    quoteFollowUpReminders[0]?.opportunityName ??
    quoteFollowUpReminders[0]?.companyName ??
    null;
  const firstStalledPreview =
    stalledOpportunityReminders[0]?.opportunityName ??
    stalledOpportunityReminders[0]?.companyName ??
    null;
  const summaryText = [
    'Workspace: Team Data',
    `Current view: ${currentView.title}`,
    `First Response Risk: ${totalRiskCount}`,
    `Today New Leads: ${totalTodayNewLeadsCount}`,
    `Tasks Due Today: ${totalTasksDueTodayCount}`,
    `Overdue Tasks: ${totalOverdueTasksCount}`,
    `Owners With Overdue Tasks: ${affectedAssigneeCount}`,
    `Pipeline Needs Next Action: ${totalMyPipelineNeedingNextActionCount}`,
    `Quote Follow-up Reminders: ${totalQuoteFollowUpReminderCount}`,
    `Stalled Opportunity Reminders: ${totalStalledOpportunityReminderCount}`,
    `Priority: ${managerPriorityLabel}`,
    `Execution Health: ${executionHealthLabel}`,
    `First Lead Risk Preview: ${firstLeadRiskPreview ?? 'none'}`,
    `First Today Lead Preview: ${firstTodayLeadPreview ?? 'none'}`,
    `First Due Task Preview: ${firstTaskDuePreview ?? 'none'}`,
    `First Pipeline Preview: ${firstPipelinePreview ?? 'none'}`,
  ].join('\n');

  const tabs = getTradeCrmPageTabs({
    route: tradeCrmRouteMap.analytics,
    views: analyticsWorkspaceViews,
    currentViewKey,
  });

  const cards =
    currentViewKey === 'lead-conversion'
      ? [
          {
            title: 'Today New Leads',
            description: appendPreview({
              base: getStatusDescription({
              loading: newLeadsLoading,
              hasError: newLeadsHasError,
              fallback:
                'Today new lead volume is temporarily unavailable. Open the lead base to retry.',
              success: `${totalTodayNewLeadsCount} leads entered the system today and should be reviewed against first-response capacity.`,
              }),
              preview: firstTodayLeadPreview,
            }),
            href: todayNewLeadsLink,
            actionLabel: 'Open today new leads',
            secondaryHref: firstTodayLeadRecordLink,
            secondaryActionLabel: 'Open first lead record',
          },
          {
            title: 'Lead First Response Risk',
            description: !integrationHubApiBaseUrl
              ? 'integration-hub is not configured yet, so the lead first-response manager queue cannot be calculated.'
              : appendPreview({
                  base: getStatusDescription({
                  loading: riskLoading,
                  hasError: Boolean(riskErrorMessage),
                  fallback:
                    'Lead first-response queue is temporarily unavailable. Open the lead pool and retry.',
                  success: `${totalRiskCount} leads currently need first-response protection, escalation, or manager review.`,
                  }),
                  preview: firstLeadRiskPreview,
                }),
            href: leadPoolLink,
            actionLabel: 'Open first-response risk',
            secondaryHref: firstLeadRiskRecordLink,
            secondaryActionLabel: 'Open first lead record',
          },
          {
            title: 'Lead Conversion Readiness',
            description:
              'Use today new lead volume together with first-response risk to judge whether the team is catching fresh demand quickly enough.',
            href: leadPoolLink,
            actionLabel: 'Open lead base',
          },
          {
            title: 'Routing And Source Rules',
            description:
              'When conversion quality slips, review source attribution, product-category routing, deduplication, and owner assignment rules before changing the workflow.',
            href: getSettingsPath(SettingsPath.TradeCrm),
            actionLabel: 'Open Trade CRM settings',
          },
        ]
      : currentViewKey === 'mail-efficiency'
        ? [
            {
              title: 'Reply Follow-up Pressure',
              description: appendPreview({
                base: `${totalTasksDueTodayCount} tasks are due today and ${totalOverdueTasksCount} are already overdue. In phase one, this is the most stable manager signal for reply handoff and seller follow-through.`,
                preview: firstTaskDuePreview ?? firstOverdueTaskPreview,
              }),
              href: tasksDueTodayLink,
              actionLabel: 'Open tasks due today',
            },
            {
              title: 'Quote-stage Communication',
              description:
                'Quote follow-up should stay visible across both opportunity and mail workspaces so critical replies do not remain hidden in inbox-only workflows.',
              href: tradeCrmRouteMap.opportunities,
              actionLabel: 'Open opportunities workspace',
            },
            {
              title: 'Mail Workspace',
              description:
                'Phase one mail efficiency focuses on setup stability, reply execution, and task linkage before deeper sequence or template analytics are added.',
              href: tradeCrmRouteMap.mail,
              actionLabel: 'Open mail workspace',
            },
            {
              title: 'Manager Check',
              description:
                'A manager should first confirm whether reply pressure is returning to tasks and opportunities, not just count sent messages in isolation.',
            },
          ]
        : currentViewKey === 'pipeline-funnel'
          ? [
              {
                title: 'Pipeline Needs Next Action',
                description: appendPreview({
                  base: getStatusDescription({
                  loading: pipelineLoading,
                  hasError: pipelineHasError,
                  fallback:
                    'Pipeline hygiene queue is temporarily unavailable. Open opportunities to retry.',
                  success: `${totalMyPipelineNeedingNextActionCount} open opportunities currently need a next action or next action date and should be escalated before they stall further.`,
                  }),
                  preview: firstPipelinePreview,
                }),
                href: pipelineNeedsNextActionLink,
                actionLabel: 'Open pipeline hygiene queue',
                secondaryHref: firstPipelineRecordLink,
                secondaryActionLabel: 'Open first opportunity',
              },
              {
                title: 'Quote Follow-up Reminders',
                description: !integrationHubApiBaseUrl
                  ? 'integration-hub is not configured yet, so quote follow-up reminder queue cannot be loaded.'
                  : appendPreview({
                      base: getStatusDescription({
                      loading: quoteFollowUpLoading,
                      hasError: Boolean(quoteFollowUpErrorMessage),
                      fallback:
                        'Quote follow-up reminder queue is temporarily unavailable. Open opportunities to retry.',
                      success: `${totalQuoteFollowUpReminderCount} opportunities are overdue for quotation follow-up and need owner re-engagement.`,
                      }),
                      preview: firstQuotePreview,
                    }),
                href: quoteFollowUpWorkspaceLink,
                actionLabel: 'Open quote follow-up queue',
                secondaryHref: firstQuoteRecordLink,
                secondaryActionLabel: 'Open first opportunity',
              },
              {
                title: 'Stalled Opportunity Reminders',
                description: !integrationHubApiBaseUrl
                  ? 'integration-hub is not configured yet, so stalled reminder queue cannot be loaded.'
                  : appendPreview({
                      base: getStatusDescription({
                      loading: stalledLoading,
                      hasError: Boolean(stalledErrorMessage),
                      fallback:
                        'Stalled reminder queue is temporarily unavailable. Open opportunities to retry.',
                      success: `${totalStalledOpportunityReminderCount} opportunities are currently stalled and should return to active next-action execution.`,
                      }),
                      preview: firstStalledPreview,
                    }),
                href: stalledWorkspaceLink,
                actionLabel: 'Open stalled queue',
                secondaryHref: firstStalledRecordLink,
                secondaryActionLabel: 'Open first opportunity',
              },
              {
                title: 'Quote And Stage Review',
                description:
                  'Managers should review quote-stage opportunities, stalled deals, and lost-deal reasons from the same pipeline surface so commercial risk stays visible.',
                href: tradeCrmRouteMap.opportunities,
                actionLabel: 'Open opportunities workspace',
              },
              {
                title: 'Opportunity Base',
                description:
                  'Phase one funnel management stays grounded in real opportunity records and saved CRM views instead of a separate reporting warehouse.',
                href: opportunityListLink,
                actionLabel: 'Open opportunity list',
              },
              {
                title: 'Manager Priority',
                description:
                  'If missing-next-action opportunities keep accumulating, manager attention should shift from top-of-funnel volume to pipeline hygiene and reactivation.',
              },
            ]
          : currentViewKey === 'team-performance'
            ? [
                {
                  title: 'Task Execution',
                  description: appendPreview({
                    base: getStatusDescription({
                    loading: tasksLoading,
                    hasError: tasksHasError,
                    fallback:
                      'Task execution queue is temporarily unavailable. Open the task base to retry.',
                    success: `${totalTasksDueTodayCount} tasks are due today and should be reviewed for seller follow-through and overdue movement.`,
                    }),
                    preview: firstTaskDuePreview,
                  }),
                  href: tasksDueTodayLink,
                  actionLabel: 'Open task base',
                  secondaryHref: firstTaskDueRecordLink,
                  secondaryActionLabel: 'Open first task',
                },
                {
                  title: 'Overdue Task Ownership',
                  description: appendPreview({
                    base: getStatusDescription({
                    loading: overdueTasksLoading,
                    hasError: overdueTasksHasError,
                    fallback:
                      'Overdue task ownership is temporarily unavailable. Open the task base to retry.',
                    success:
                      totalOverdueTasksCount === 0
                        ? 'No overdue task burden is currently visible in the loaded task set.'
                        : `${totalOverdueTasksCount} overdue tasks are currently distributed across ${affectedAssigneeCount} owners. Visible highest load: ${ownerPreview.join(', ')}.`,
                    }),
                    preview: firstOverdueTaskPreview,
                  }),
                  href: taskBaseLink,
                  actionLabel: 'Open overdue task queue',
                  secondaryHref: firstOverdueTaskRecordLink,
                  secondaryActionLabel: 'Open first overdue task',
                },
                {
                  title: 'Lead Handling',
                  description:
                    'Team performance should first reflect lead handling discipline and first-response coverage, not a detached member ranking table.',
                  href: leadPoolLink,
                  actionLabel: 'Review lead execution',
                },
                {
                  title: 'Opportunity Handling',
                  description:
                    'Opportunity movement and next-action completeness are strong operational signals for individual execution quality.',
                  href: pipelineNeedsNextActionLink,
                  actionLabel: 'Review opportunity execution',
                },
                {
                  title: 'Review Principle',
                  description:
                    'When checking team performance, managers should return to real execution queues before trusting any aggregate score.',
                },
              ]
            : currentViewKey === 'source-impact'
              ? [
                  {
                    title: 'Lead Source Review',
                    description:
                      'Source impact should be reviewed through lead intake, first-response risk, and routing exceptions rather than a detached source report.',
                    href: leadPoolLink,
                    actionLabel: 'Open lead base',
                  },
                  {
                    title: 'Today New Leads',
                    description: appendPreview({
                      base: getStatusDescription({
                      loading: newLeadsLoading,
                      hasError: newLeadsHasError,
                      fallback:
                        'Today new lead volume is temporarily unavailable. Open the lead base to retry.',
                      success: `${totalTodayNewLeadsCount} leads entered the system today and can be used as the current source-impact baseline.`,
                      }),
                      preview: firstTodayLeadPreview,
                    }),
                    href: todayNewLeadsLink,
                    actionLabel: 'Review today new leads',
                    secondaryHref: firstTodayLeadRecordLink,
                    secondaryActionLabel: 'Open first lead record',
                  },
                  {
                    title: 'Routing Rules',
                    description:
                      'When a source underperforms, inspect product-category assignment, routing rules, and deduplication logic before changing channel strategy.',
                    href: getSettingsPath(SettingsPath.TradeCrm),
                    actionLabel: 'Open Trade CRM settings',
                  },
                  {
                    title: 'Manager Principle',
                    description:
                      'The first source-impact question is which incoming channels are not being handled effectively, not which attribution chart looks best.',
                  },
                ]
              : [
                  {
                    title: 'Execution Health',
                    description: `Current team execution pressure: ${executionHealthLabel}. Combined visible queue load is ${openExecutionPressure}, built from new leads, first-response risk, tasks due today, and opportunities missing their next action.`,
                  },
                  {
                    title: 'Today New Leads',
                    description: appendPreview({
                      base: getStatusDescription({
                      loading: newLeadsLoading,
                      hasError: newLeadsHasError,
                      fallback:
                        'Today new lead volume is temporarily unavailable. Open the lead base to retry.',
                      success: `${totalTodayNewLeadsCount} leads entered the system today and should be reviewed against first-response capacity.`,
                      }),
                      preview: firstTodayLeadPreview,
                    }),
                    href: todayNewLeadsLink,
                    actionLabel: 'Open today new leads',
                    secondaryHref: firstTodayLeadRecordLink,
                    secondaryActionLabel: 'Open first lead record',
                  },
                  {
                    title: 'Lead First Response Risk',
                    description: !integrationHubApiBaseUrl
                      ? 'integration-hub is not configured yet, so the lead first-response manager queue cannot be calculated.'
                      : appendPreview({
                          base: getStatusDescription({
                          loading: riskLoading,
                          hasError: Boolean(riskErrorMessage),
                          fallback:
                            'Lead first-response queue is temporarily unavailable. Open the lead pool and retry.',
                          success: `${totalRiskCount} leads currently need first-response protection, escalation, or manager review.`,
                          }),
                          preview: firstLeadRiskPreview,
                        }),
                    href: leadPoolLink,
                    actionLabel: 'Open first-response risk',
                    secondaryHref: firstLeadRiskRecordLink,
                    secondaryActionLabel: 'Open first lead record',
                  },
                  {
                    title: 'Tasks Due Today',
                    description: appendPreview({
                      base: getStatusDescription({
                      loading: tasksLoading,
                      hasError: tasksHasError,
                      fallback:
                        'Task execution queue is temporarily unavailable. Open the task base to retry.',
                      success: `${totalTasksDueTodayCount} tasks are due today and should be reviewed for seller follow-through and overdue movement.`,
                      }),
                      preview: firstTaskDuePreview,
                    }),
                    href: tasksDueTodayLink,
                    actionLabel: 'Open tasks due today',
                    secondaryHref: firstTaskDueRecordLink,
                    secondaryActionLabel: 'Open first task',
                  },
                  {
                    title: 'Tasks Overdue By Owner',
                    description: appendPreview({
                      base: getStatusDescription({
                      loading: overdueTasksLoading,
                      hasError: overdueTasksHasError,
                      fallback:
                        'Overdue task ownership is temporarily unavailable. Open the task base to retry.',
                      success:
                        totalOverdueTasksCount === 0
                          ? 'No overdue task pressure is currently visible across the loaded team queue.'
                          : `${totalOverdueTasksCount} tasks are overdue across ${affectedAssigneeCount} owners. Highest visible pressure: ${ownerPreview.join(', ')}.`,
                      }),
                      preview: firstOverdueTaskPreview,
                    }),
                    href: taskBaseLink,
                    actionLabel: 'Open task queue',
                    secondaryHref: firstOverdueTaskRecordLink,
                    secondaryActionLabel: 'Open first overdue task',
                  },
                  {
                    title: 'Pipeline Needs Next Action',
                    description: appendPreview({
                      base: getStatusDescription({
                      loading: pipelineLoading,
                      hasError: pipelineHasError,
                      fallback:
                        'Pipeline hygiene queue is temporarily unavailable. Open opportunities to retry.',
                      success: `${totalMyPipelineNeedingNextActionCount} open opportunities currently need a next action or next action date and should be escalated before they stall further.`,
                      }),
                      preview: firstPipelinePreview,
                    }),
                    href: pipelineNeedsNextActionLink,
                    actionLabel: 'Open pipeline hygiene queue',
                    secondaryHref: firstPipelineRecordLink,
                    secondaryActionLabel: 'Open first opportunity',
                  },
                  {
                    title: 'Quote Follow-up Reminders',
                    description: !integrationHubApiBaseUrl
                      ? 'integration-hub is not configured yet, so quote follow-up reminder queue cannot be loaded.'
                      : appendPreview({
                          base: getStatusDescription({
                          loading: quoteFollowUpLoading,
                          hasError: Boolean(quoteFollowUpErrorMessage),
                          fallback:
                            'Quote follow-up reminder queue is temporarily unavailable. Open opportunities to retry.',
                          success: `${totalQuoteFollowUpReminderCount} opportunities are overdue for quotation follow-up and should be pushed back to active owner queue.`,
                          }),
                          preview: firstQuotePreview,
                        }),
                    href: quoteFollowUpWorkspaceLink,
                    actionLabel: 'Open quote follow-up queue',
                    secondaryHref: firstQuoteRecordLink,
                    secondaryActionLabel: 'Open first opportunity',
                  },
                  {
                    title: 'Stalled Opportunity Reminders',
                    description: !integrationHubApiBaseUrl
                      ? 'integration-hub is not configured yet, so stalled reminder queue cannot be loaded.'
                      : appendPreview({
                          base: getStatusDescription({
                          loading: stalledLoading,
                          hasError: Boolean(stalledErrorMessage),
                          fallback:
                            'Stalled reminder queue is temporarily unavailable. Open opportunities to retry.',
                          success: `${totalStalledOpportunityReminderCount} opportunities are currently in stalled lane and need re-engagement.`,
                          }),
                          preview: firstStalledPreview,
                        }),
                    href: stalledWorkspaceLink,
                    actionLabel: 'Open stalled queue',
                    secondaryHref: firstStalledRecordLink,
                    secondaryActionLabel: 'Open first opportunity',
                  },
                  {
                    title: 'Quote And Stage Review',
                    description:
                      'Managers should review quote-stage opportunities and stalled deals from the same pipeline surface so missed commercial motion stays visible.',
                    href: opportunityListLink,
                    actionLabel: 'Open opportunity list',
                  },
                  {
                    title: 'Lead Conversion Readiness',
                    description:
                      'Use new lead volume together with first-response risk to judge whether the team is converting fresh demand into active follow-up quickly enough.',
                    href: getTradeCrmScopedViewPath(
                      tradeCrmRouteMap.analytics,
                      'lead-conversion',
                    ),
                    actionLabel: 'Switch to lead conversion',
                  },
                  {
                    title: 'Routing And Source Rules',
                    description:
                      'Use the settings control layer to review source attribution, product-category routing, and AI or integration assumptions when queue behavior looks wrong.',
                    href: getSettingsPath(SettingsPath.TradeCrm),
                    actionLabel: 'Open settings control',
                  },
                  {
                    title: 'Current Team Priority',
                    description: `Current team priority: ${managerPriorityLabel}. This page should tell a manager which queue needs intervention first before they drill into detailed lists.`,
                  },
                ];

  return (
    <AdminWorkspaceLayout
      title="Team"
      heroTitle={currentView.heroTitle}
      heroDescription={currentView.heroDescription}
      tabs={tabs}
      cards={cards}
      workspaceContext={{
        workspace: 'Team',
        entityType: 'team-analytics',
        stage: currentView.title,
        channel: 'team-execution-review',
        summaryText,
      }}
    />
  );
};
