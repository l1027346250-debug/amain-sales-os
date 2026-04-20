import { useLingui } from '@lingui/react/macro';
import { useSearchParams } from 'react-router-dom';

import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { getTradeCrmCustomerPath } from '@/trade-crm/customers/utils/tradeCrmCustomerRouting';
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
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLeadFirstResponseRisk } from '@/workbench/hooks/useLeadFirstResponseRisk';
import { useMyPipelineNeedingNextAction } from '@/workbench/hooks/useMyPipelineNeedingNextAction';
import { useTasksDueToday } from '@/workbench/hooks/useTasksDueToday';
import { useTodayNewLeads } from '@/workbench/hooks/useTodayNewLeads';
import { useTradeCrmObjectViewLink } from '@/workbench/hooks/useTradeCrmObjectViewLink';

const getDescription = ({
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
    return 'Loading the latest queue signal from CRM core.';
  }

  if (hasError) {
    return fallback;
  }

  return success;
};

type WorkbenchWorkspaceViewKey =
  | 'my-tasks'
  | 'first-response'
  | 'follow-up'
  | 'overdue'
  | 'manager-board';

type WorkbenchWorkspaceView = {
  key: WorkbenchWorkspaceViewKey;
  label: string;
  title: string;
  heroTitle: string;
  heroDescription: string;
};

const workbenchWorkspaceViews: WorkbenchWorkspaceView[] = [
  {
    key: 'my-tasks',
    label: 'My Tasks',
    title: 'My Tasks',
    heroTitle:
      'Start with the tasks, follow-up moves, and queue pressure that must move today.',
    heroDescription:
      'The workbench is not a reporting page. It is the seller\'s daily action surface for clearing due work, protecting first response, and keeping deals moving.',
  },
  {
    key: 'first-response',
    label: 'First Response',
    title: 'First Response',
    heroTitle:
      'Protect first response before slower customer or opportunity work takes over the day.',
    heroDescription:
      'Fresh inbound leads and near-SLA cases should be handled from one visible response surface so the team does not lose demand at the very start of the funnel.',
  },
  {
    key: 'follow-up',
    label: 'Follow-up',
    title: 'Follow-up',
    heroTitle:
      'Keep tasks, customer follow-up, and opportunity next steps inside one daily execution surface.',
    heroDescription:
      'The follow-up view should help sellers clear due actions first and then continue customer and pipeline motion without bouncing across unrelated pages.',
  },
  {
    key: 'overdue',
    label: 'Overdue Alerts',
    title: 'Overdue Alerts',
    heroTitle:
      'Make overdue execution visible as its own workspace instead of letting delayed work hide in regular queues.',
    heroDescription:
      'Late first response, overdue tasks, and deals missing next actions should be exposed together so the team sees execution pressure clearly.',
  },
  {
    key: 'manager-board',
    label: 'Manager Board',
    title: 'Manager Board',
    heroTitle:
      'Let managers start from queue pressure and exception signals, not detached scoreboard numbers.',
    heroDescription:
      'This manager view should show where intervention is needed first: first-response pressure, due-task buildup, and pipeline hygiene gaps.',
  },
];

export const TradeCrmWorkbenchPage = () => {
  const [searchParams] = useSearchParams();
  const { t } = useLingui();
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const {
    sellerRiskReminders,
    totalRiskCount,
    loading: riskLoading,
    errorMessage: riskErrorMessage,
    integrationHubApiBaseUrl,
  } = useLeadFirstResponseRisk();
  const {
    todayNewLeads,
    totalTodayNewLeadsCount,
    loading: newLeadsLoading,
    hasError: newLeadsHasError,
  } = useTodayNewLeads();
  const {
    tasksDueToday,
    totalTasksDueTodayCount,
    loading: tasksLoading,
    hasError: tasksHasError,
  } = useTasksDueToday();
  const {
    myPipelineNeedingNextAction,
    totalMyPipelineNeedingNextActionCount,
    loading: pipelineLoading,
    hasError: pipelineHasError,
  } = useMyPipelineNeedingNextAction();

  const requestedView = searchParams.get('view');
  const { currentViewKey, currentView } = getTradeCrmCurrentView({
    requestedView,
    views: workbenchWorkspaceViews,
    fallbackViewKey: 'my-tasks' satisfies WorkbenchWorkspaceViewKey,
  });

  const leadPoolLink = useTradeCrmObjectViewLink({
    objectNameSingular: 'lead',
    preferredViewName: 'Leads (Trade CRM)',
  });
  const todayNewLeadsLink = useTradeCrmObjectViewLink({
    objectNameSingular: 'lead',
    preferredViewName: 'Today New Leads',
  });
  const tasksDueTodayLink = useTradeCrmObjectViewLink({
    objectNameSingular: 'task',
    preferredViewName: 'Tasks Due Today',
  });
  const pipelineNeedsNextActionLink = useTradeCrmObjectViewLink({
    objectNameSingular: 'opportunity',
    preferredViewName: 'Pipeline Needs Next Action',
  });
  const firstResponseSource = createTradeCrmRecordSource({
    href: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'first-response'),
    workspaceKey: 'workbench',
    workspaceLabel: 'Workbench',
    viewKey: 'first-response',
    viewLabel: 'First Response',
  });
  const todayNewLeadsSource = createTradeCrmRecordSource({
    href: todayNewLeadsLink,
    workspaceKey: 'workbench',
    workspaceLabel: 'Workbench',
    viewKey: 'first-response',
    viewLabel: 'Today New Leads',
  });
  const followUpTaskSource = createTradeCrmRecordSource({
    href: tasksDueTodayLink,
    workspaceKey: 'workbench',
    workspaceLabel: 'Workbench',
    viewKey: 'follow-up',
    viewLabel: 'Follow-up',
  });
  const pipelineHygieneSource = createTradeCrmRecordSource({
    href: pipelineNeedsNextActionLink,
    workspaceKey: 'workbench',
    workspaceLabel: 'Workbench',
    viewKey: 'follow-up',
    viewLabel: 'Pipeline Hygiene',
  });
  const firstRiskLeadRecordLink = sellerRiskReminders[0]?.leadId
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: 'lead',
        objectRecordId: sellerRiskReminders[0].leadId,
        source: firstResponseSource,
      })
    : undefined;
  const firstTodayLeadRecordLink = todayNewLeads[0]?.id
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: 'lead',
        objectRecordId: todayNewLeads[0].id,
        source: todayNewLeadsSource,
      })
    : undefined;
  const firstTaskRecordLink = tasksDueToday[0]?.id
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: 'task',
        objectRecordId: tasksDueToday[0].id,
        source: followUpTaskSource,
      })
    : undefined;
  const firstPipelineRecordLink = myPipelineNeedingNextAction[0]?.id
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: 'opportunity',
        objectRecordId: myPipelineNeedingNextAction[0].id,
        source: pipelineHygieneSource,
      })
    : undefined;

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
    'Sales teammate';

  const totalAttentionCount =
    totalRiskCount +
    totalTodayNewLeadsCount +
    totalTasksDueTodayCount +
    totalMyPipelineNeedingNextActionCount;

  const topPriorityLabel =
    totalRiskCount > 0
      ? 'Protect first response'
      : totalTasksDueTodayCount > 0
        ? 'Clear due tasks'
        : totalTodayNewLeadsCount > 0
          ? 'Qualify fresh leads'
          : totalMyPipelineNeedingNextActionCount > 0
            ? 'Add next actions to deals'
            : 'Queues are stable';

  const tabs = getTradeCrmPageTabs({
    route: tradeCrmRouteMap.workbench,
    views: workbenchWorkspaceViews,
    currentViewKey,
  });

  const sidebarItems =
    currentViewKey === 'first-response'
      ? [
          {
            label: 'First Response',
            hint: 'Protect response SLA before new leads turn into aged missed demand.',
            isActive: true,
            to: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'first-response'),
            countLabel: `${totalRiskCount}`,
          },
          {
            label: 'Today New Leads',
            hint: 'Fresh inbound volume is the first source of response pressure.',
            to: todayNewLeadsLink,
            countLabel: `${totalTodayNewLeadsCount}`,
          },
          {
            label: 'Lead Pool',
            hint: 'Return to the lead base when ownership or qualification needs review.',
            to: leadPoolLink,
          },
          {
            label: 'Manager Review',
            hint: 'Escalate persistent response failures into the manager surface.',
            to: tradeCrmRouteMap.analytics,
          },
        ]
      : currentViewKey === 'follow-up'
        ? [
            {
              label: 'Follow-up',
              hint: 'Clear due actions across tasks and opportunities from one surface.',
              isActive: true,
              to: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'follow-up'),
              countLabel: `${totalTasksDueTodayCount + totalMyPipelineNeedingNextActionCount}`,
            },
            {
              label: 'Tasks Due Today',
              hint: 'Task queues remain the most stable daily follow-up entry point.',
              to: tasksDueTodayLink,
              countLabel: `${totalTasksDueTodayCount}`,
            },
            {
              label: 'Pipeline Hygiene',
              hint: 'Deals without next actions belong in the same follow-up pressure view.',
              to: pipelineNeedsNextActionLink,
              countLabel: `${totalMyPipelineNeedingNextActionCount}`,
            },
            {
              label: 'Customer Context',
              hint: 'Follow-up should always be able to return to the customer workspace.',
              to: getTradeCrmCustomerPath('list'),
            },
          ]
        : currentViewKey === 'overdue'
          ? [
              {
                label: 'Overdue Alerts',
                hint: 'Review late response, overdue tasks, and slipping pipeline signals together.',
                isActive: true,
                to: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'overdue'),
                countLabel: `${totalAttentionCount}`,
              },
              {
                label: 'First Response Risk',
                hint: 'Response delay remains the highest-priority overdue signal.',
                to: leadPoolLink,
                countLabel: `${totalRiskCount}`,
              },
              {
                label: 'Tasks Due Today',
                hint: 'Clear overdue tasks from the task base before they stack up further.',
                to: tasksDueTodayLink,
                countLabel: `${totalTasksDueTodayCount}`,
              },
              {
                label: 'Pipeline Hygiene',
                hint: 'Missing next actions in live deals also belong in the overdue view.',
                to: pipelineNeedsNextActionLink,
                countLabel: `${totalMyPipelineNeedingNextActionCount}`,
              },
            ]
          : currentViewKey === 'manager-board'
            ? [
                {
                  label: 'Manager Board',
                  hint: 'Start from real queue pressure, then drill into records only where needed.',
                  isActive: true,
                  to: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'manager-board'),
                  countLabel: `${totalAttentionCount}`,
                },
                {
                  label: 'Team Data',
                  hint: 'Use the broader manager workspace for daily inspection and review.',
                  to: tradeCrmRouteMap.analytics,
                },
                {
                  label: 'First Response Risk',
                  hint: 'Review whether response handling is failing before other pipeline checks.',
                  to: leadPoolLink,
                  countLabel: `${totalRiskCount}`,
                },
                {
                  label: 'Pipeline Hygiene',
                  hint: 'Then check stalled risk and deals missing their next move.',
                  to: pipelineNeedsNextActionLink,
                  countLabel: `${totalMyPipelineNeedingNextActionCount}`,
                },
              ]
            : [
                {
                  label: 'My Tasks',
                  hint: 'Clear the work that must move today before lower-priority review.',
                  isActive: true,
                  to: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'my-tasks'),
                  countLabel: `${totalTasksDueTodayCount}`,
                },
                {
                  label: 'First Response',
                  hint: 'Protect fresh inbound demand before it falls out of cadence.',
                  to: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'first-response'),
                  countLabel: `${totalRiskCount}`,
                },
                {
                  label: 'Follow-up',
                  hint: 'Keep customer, task, and deal follow-up in one visible loop.',
                  to: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'follow-up'),
                  countLabel: `${totalTasksDueTodayCount + totalMyPipelineNeedingNextActionCount}`,
                },
                {
                  label: 'Overdue Alerts',
                  hint: 'Expose late work and slowing queues as a separate pressure view.',
                  to: getTradeCrmScopedViewPath(tradeCrmRouteMap.workbench, 'overdue'),
                  countLabel: `${totalAttentionCount}`,
                },
              ];

  const cards =
    currentViewKey === 'first-response'
      ? [
          {
            title: 'First Response Risk',
            description: !integrationHubApiBaseUrl
              ? 'integration-hub is not configured yet, so the first-response queue cannot be calculated.'
              : getDescription({
                  loading: riskLoading,
                  hasError: Boolean(riskErrorMessage),
                  fallback:
                    'First-response risk is temporarily unavailable. Open the lead pool and retry.',
                  success: `${totalRiskCount} leads need first-response protection or review right now.`,
                }),
            href: leadPoolLink,
            actionLabel: 'Open first-response risk',
            secondaryHref: firstRiskLeadRecordLink,
            secondaryActionLabel: 'Open first lead record',
          },
          {
            title: 'Today New Leads',
            description: getDescription({
              loading: newLeadsLoading,
              hasError: newLeadsHasError,
              fallback:
                'Today new lead queue is temporarily unavailable. Open the lead pool to retry.',
              success: `${totalTodayNewLeadsCount} leads were created today and should be qualified quickly.`,
            }),
            href: todayNewLeadsLink,
            actionLabel: 'Open today new leads',
            secondaryHref: firstTodayLeadRecordLink,
            secondaryActionLabel: 'Open first lead record',
          },
          {
            title: 'Lead Qualification',
            description:
              'Response is only the first step. The next move is to qualify, assign, and decide whether the lead continues toward customer or opportunity work.',
            href: tradeCrmRouteMap.prospecting,
            actionLabel: 'Open prospecting workspace',
          },
          {
            title: 'Manager Escalation',
            description:
              'When response failures start stacking up, managers should continue review from the team-data surface instead of only watching counts.',
            href: tradeCrmRouteMap.analytics,
            actionLabel: 'Open team data',
          },
        ]
      : currentViewKey === 'follow-up'
        ? [
            {
              title: 'Tasks Due Today',
              description: getDescription({
                loading: tasksLoading,
                hasError: tasksHasError,
                fallback:
                  'Task queue is temporarily unavailable. Open the task list to retry.',
                success: `${totalTasksDueTodayCount} open tasks are due today and should stay visible until cleared.`,
              }),
              href: tasksDueTodayLink,
              actionLabel: 'Open tasks due today',
              secondaryHref: firstTaskRecordLink,
              secondaryActionLabel: 'Open first task',
            },
            {
              title: 'Pipeline Needs Next Action',
              description: getDescription({
                loading: pipelineLoading,
                hasError: pipelineHasError,
                fallback:
                  'Pipeline hygiene queue is temporarily unavailable. Open opportunities to retry.',
                success: `${totalMyPipelineNeedingNextActionCount} open opportunities still need a next action or next action date.`,
              }),
              href: pipelineNeedsNextActionLink,
              actionLabel: 'Open pipeline hygiene',
              secondaryHref: firstPipelineRecordLink,
              secondaryActionLabel: 'Open first opportunity',
            },
            {
              title: 'Customer Follow-up',
              description:
                'Customer follow-up should continue inside the customer workspace instead of stopping inside an isolated task list.',
              href: getTradeCrmCustomerPath('list'),
              actionLabel: 'Open customer workspace',
            },
            {
              title: 'Mail Linkage',
              description:
                'If the next move depends on replies or quotation discussion, continue from the mail and opportunity surfaces together.',
              href: tradeCrmRouteMap.mail,
              actionLabel: 'Open mail workspace',
            },
          ]
        : currentViewKey === 'overdue'
          ? [
              {
                title: 'Execution Pressure',
                description:
                  `Current overdue signal count is ${totalAttentionCount}. Review response delay, due tasks, and missing next actions from one pressure view.`,
              },
              {
                title: 'First Response Overdue',
                description: !integrationHubApiBaseUrl
                  ? 'integration-hub is not configured yet, so the first-response queue cannot be calculated.'
                  : `${totalRiskCount} leads are already in first-response risk or close to it.`,
                href: leadPoolLink,
                actionLabel: 'Open first-response risk',
                secondaryHref: firstRiskLeadRecordLink,
                secondaryActionLabel: 'Open first lead record',
              },
              {
                title: 'Tasks Due Today',
                description: `${totalTasksDueTodayCount} tasks are still due today and should be cleared before they roll further into overdue execution.`,
                href: tasksDueTodayLink,
                actionLabel: 'Open tasks queue',
                secondaryHref: firstTaskRecordLink,
                secondaryActionLabel: 'Open first task',
              },
              {
                title: 'Pipeline Hygiene',
                description: `${totalMyPipelineNeedingNextActionCount} opportunities still need a next action or next action date and are already at slip risk.`,
                href: pipelineNeedsNextActionLink,
                actionLabel: 'Open pipeline hygiene',
                secondaryHref: firstPipelineRecordLink,
                secondaryActionLabel: 'Open first opportunity',
              },
            ]
          : currentViewKey === 'manager-board'
            ? [
                {
                  title: 'Manager Priority',
                  description:
                    `Current manager priority: ${topPriorityLabel}. Start from live queue pressure, then decide where deeper intervention is needed.`,
                  href: tradeCrmRouteMap.analytics,
                  actionLabel: 'Open team data',
                },
                {
                  title: 'First Response Signal',
                  description: !integrationHubApiBaseUrl
                    ? 'integration-hub is not configured yet, so the first-response queue cannot be calculated.'
                    : `${totalRiskCount} leads currently need first-response protection or manager review.`,
                  href: leadPoolLink,
                  actionLabel: 'Open first-response risk',
                  secondaryHref: firstRiskLeadRecordLink,
                  secondaryActionLabel: 'Open first lead record',
                },
                {
                  title: 'Task Execution Signal',
                  description: `${totalTasksDueTodayCount} open tasks are due today and may require intervention if they keep rolling forward.`,
                  href: tasksDueTodayLink,
                  actionLabel: 'Open tasks queue',
                  secondaryHref: firstTaskRecordLink,
                  secondaryActionLabel: 'Open first task',
                },
                {
                  title: 'Pipeline Signal',
                  description: `${totalMyPipelineNeedingNextActionCount} open opportunities still need a next action or next action date.`,
                  href: pipelineNeedsNextActionLink,
                  actionLabel: 'Open pipeline hygiene',
                  secondaryHref: firstPipelineRecordLink,
                  secondaryActionLabel: 'Open first opportunity',
                },
              ]
            : [
                {
                  title: 'First Response Risk',
                  description: !integrationHubApiBaseUrl
                    ? 'integration-hub is not configured yet, so the first-response queue cannot be calculated.'
                    : getDescription({
                        loading: riskLoading,
                        hasError: Boolean(riskErrorMessage),
                        fallback:
                          'First-response risk is temporarily unavailable. Open the lead pool and retry.',
                        success: `${totalRiskCount} leads need first-response protection or review right now.`,
                      }),
                  href: leadPoolLink,
                  actionLabel: 'Open first-response risk',
                  secondaryHref: firstRiskLeadRecordLink,
                  secondaryActionLabel: 'Open first lead record',
                },
                {
                  title: 'Today New Leads',
                  description: getDescription({
                    loading: newLeadsLoading,
                    hasError: newLeadsHasError,
                    fallback:
                      'Today new lead queue is temporarily unavailable. Open the lead pool to retry.',
                    success: `${totalTodayNewLeadsCount} leads were created today and should be qualified quickly.`,
                  }),
                  href: todayNewLeadsLink,
                  actionLabel: 'Open today new leads',
                  secondaryHref: firstTodayLeadRecordLink,
                  secondaryActionLabel: 'Open first lead record',
                },
                {
                  title: 'Tasks Due Today',
                  description: getDescription({
                    loading: tasksLoading,
                    hasError: tasksHasError,
                    fallback:
                      'Task queue is temporarily unavailable. Open the task list to retry.',
                    success: `${totalTasksDueTodayCount} open tasks are due today and should stay visible until cleared.`,
                  }),
                  href: tasksDueTodayLink,
                  actionLabel: 'Open tasks due today',
                  secondaryHref: firstTaskRecordLink,
                  secondaryActionLabel: 'Open first task',
                },
                {
                  title: 'Pipeline Needs Next Action',
                  description: getDescription({
                    loading: pipelineLoading,
                    hasError: pipelineHasError,
                    fallback:
                      'Pipeline hygiene queue is temporarily unavailable. Open opportunities to retry.',
                    success: `${totalMyPipelineNeedingNextActionCount} open opportunities still need a next action or next action date.`,
                  }),
                  href: pipelineNeedsNextActionLink,
                  actionLabel: 'Open pipeline hygiene',
                  secondaryHref: firstPipelineRecordLink,
                  secondaryActionLabel: 'Open first opportunity',
                },
              ];

  const insights =
    currentViewKey === 'manager-board'
      ? [
          {
            label: 'Execution order',
            value: 'Manager by queues',
            description:
              'Managers should start from visible queue pressure before drilling into individual records or team members.',
          },
          {
            label: 'Lead handling',
            value: 'Escalate SLA risk',
            description:
              'If response-risk cases keep accumulating, the issue belongs in the manager inspection loop immediately.',
          },
          {
            label: 'Pipeline discipline',
            value: 'Intervene before stall',
            description:
              'The manager board is for catching slowing deals early, not waiting for win/loss reporting later.',
          },
        ]
      : currentViewKey === 'overdue'
        ? [
            {
              label: 'Execution order',
              value: 'Overdue first',
              description:
                'Overdue work should stay exposed as its own pressure layer, not hidden inside normal daily queues.',
            },
            {
              label: 'Lead handling',
              value: 'SLA visible',
              description:
                'First-response delay remains the highest-priority overdue signal.',
            },
            {
              label: 'Pipeline discipline',
              value: 'Slip signals matter',
              description:
                'Deals missing next actions are overdue signals too, even before they become formally stalled.',
            },
          ]
        : [
            {
              label: 'Execution order',
              value: 'SLA before detail',
              description:
                'First-response protection and due tasks come before slower account review.',
            },
            {
              label: 'Lead handling',
              value: 'Queue first',
              description:
                'Fresh inbound leads should land in one visible working queue instead of scattered intake pages.',
            },
            {
              label: 'Pipeline discipline',
              value: 'Next action required',
              description:
                'Any open deal without a next action is already slipping, even if the stage still looks healthy.',
            },
          ];

  return (
    <QueueWorkspaceLayout
      title={t`Workbench`}
      heroTitle={
        currentView.heroTitle || `Hi ${sellerName}, move the highest-risk queue first.`
      }
      heroDescription={currentView.heroDescription}
      heroPills={[
        `Open attention ${totalAttentionCount}`,
        `Current ${currentView.title}`,
        `Top priority ${topPriorityLabel}`,
        integrationHubApiBaseUrl
          ? 'integration-hub connected'
          : 'integration-hub not configured',
      ]}
      tabs={tabs}
      sidebarTitle="Workbench views"
      sidebarItems={sidebarItems}
      cards={cards}
      insightTitle="Daily operating intent"
      insightDescription="The workbench should reduce decision overhead and tell sellers or managers which queue needs movement first."
      insights={insights}
      workspaceContext={{
        workspace: 'Workbench',
        channel: 'daily-operating-view',
        stage: currentView.title,
        summaryText: [
          'Workspace: Workbench',
          `Current view: ${currentView.title}`,
          `Open attention: ${totalAttentionCount}`,
          `Top priority: ${topPriorityLabel}`,
          `Today new leads: ${totalTodayNewLeadsCount}`,
          `Tasks due today: ${totalTasksDueTodayCount}`,
          `Pipeline needs next action: ${totalMyPipelineNeedingNextActionCount}`,
        ].join('\n'),
      }}
    />
  );
};
