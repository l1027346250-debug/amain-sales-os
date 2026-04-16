import { useSearchParams } from 'react-router-dom';
import { AppPath, CoreObjectNameSingular } from 'twenty-shared/types';

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
import { useTasksDueToday } from '@/workbench/hooks/useTasksDueToday';
import { useTradeCrmObjectViewLink } from '@/workbench/hooks/useTradeCrmObjectViewLink';

type CollaborationWorkspaceViewKey = 'tasks' | 'calendar' | 'approvals';

type CollaborationWorkspaceView = {
  key: CollaborationWorkspaceViewKey;
  label: string;
  title: string;
  heroTitle: string;
  heroDescription: string;
};

const collaborationWorkspaceViews: CollaborationWorkspaceView[] = [
  {
    key: 'tasks',
    label: 'Tasks',
    title: 'Task Collaboration',
    heroTitle:
      'Keep tasks as the primary collaboration carrier instead of expanding CRM into an OA platform.',
    heroDescription:
      'In phase one the collaboration workspace serves tasks, follow-up handoff, and execution across CRM objects. Tasks remain the closest artifact to daily seller action.',
  },
  {
    key: 'calendar',
    label: 'Calendar',
    title: 'Calendar Rhythm',
    heroTitle:
      'Use calendar as a rhythm layer for CRM execution, not as a separate scheduling system.',
    heroDescription:
      'The calendar view helps sellers and managers review follow-up timing and execution rhythm. It should support CRM action loops instead of becoming a full office calendar product.',
  },
  {
    key: 'approvals',
    label: 'Approvals',
    title: 'Approvals Placeholder',
    heroTitle:
      'Keep approvals as a placeholder with explicit scope boundaries and do not force it into phase one delivery.',
    heroDescription:
      'The repository does not currently contain a mature approval flow path for this module. This surface stays as a placeholder so the boundary is explicit without faking a working feature.',
  },
];

export const TradeCrmCollaborationPage = () => {
  const [searchParams] = useSearchParams();
  const { objectMetadataItems } = useObjectMetadataItems();
  const hasTaskObject = objectMetadataItems.some(
    (item) => item.nameSingular === CoreObjectNameSingular.Task,
  );
  const {
    records: taskRecords,
    totalCount: taskTotalCount,
    loading: tasksLoading,
    error: tasksError,
  } = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.Task,
    limit: 1,
    skip: !hasTaskObject,
  });
  const {
    totalTasksDueTodayCount,
    loading: tasksDueTodayLoading,
    hasError: tasksDueTodayError,
  } = useTasksDueToday();
  const taskListLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Task,
  });
  const requestedView = searchParams.get('view');
  const { currentViewKey, currentView } = getTradeCrmCurrentView({
    requestedView,
    views: collaborationWorkspaceViews,
    fallbackViewKey: 'tasks' satisfies CollaborationWorkspaceViewKey,
  });
  const taskRuntimeLink = hasTaskObject ? taskListLink : AppPath.TasksPage;
  const firstTaskRecordLink = taskRecords?.[0]?.id
    ? `${AppPath.TasksPage}/${taskRecords[0].id}`
    : undefined;
  const taskCoverageDescription = !hasTaskObject
    ? 'Task object metadata is not initialized yet. Complete phase-one task setup before collaboration carries real execution.'
    : tasksLoading
      ? 'Loading task coverage from CRM core.'
      : tasksError
        ? 'Task coverage is temporarily unavailable. Open the task workspace to retry.'
        : `${taskTotalCount ?? 0} tasks are currently available to carry CRM execution and cross-object handoff.`;
  const tasksDueTodayDescription = !hasTaskObject
    ? 'Today-task pressure depends on the task object being available first.'
    : tasksDueTodayLoading
      ? 'Loading today-task pressure from the task queue.'
      : tasksDueTodayError
        ? 'Today-task pressure is temporarily unavailable. Open the task workspace to retry.'
        : `${totalTasksDueTodayCount} tasks are currently due today for follow-up execution.`;

  const tabs = getTradeCrmPageTabs({
    route: tradeCrmRouteMap.collaboration,
    views: collaborationWorkspaceViews,
    currentViewKey,
  });

  const sidebarItems =
    currentViewKey === 'calendar'
      ? [
          {
            label: 'Calendar',
            hint: 'Use calendar to organize follow-up timing and execution rhythm without expanding into OA.',
            isActive: true,
            to: getTradeCrmScopedViewPath(
              tradeCrmRouteMap.collaboration,
              'calendar',
            ),
          },
          {
            label: 'Task Handoff',
            hint: taskCoverageDescription,
            to: taskRuntimeLink,
          },
          {
            label: 'Customer Context',
            hint: 'Important meetings and check-ins should continue in the customer workspace.',
            to: tradeCrmRouteMap.customers,
          },
          {
            label: 'Opportunity Context',
            hint: 'Quote, sample, and progression-related scheduling should return to opportunities.',
            to: tradeCrmRouteMap.opportunities,
          },
        ]
      : currentViewKey === 'approvals'
        ? [
            {
              label: 'Approvals',
              hint: 'This remains a placeholder with explicit scope boundaries, not a production approval flow.',
              isActive: true,
              to: getTradeCrmScopedViewPath(
                tradeCrmRouteMap.collaboration,
                'approvals',
              ),
            },
            {
              label: 'Task Collaboration',
              hint: taskCoverageDescription,
              to: getTradeCrmScopedViewPath(
                tradeCrmRouteMap.collaboration,
                'tasks',
              ),
            },
            {
              label: 'Boundary Note',
              hint: 'Do not force OA approvals, document flow, or unrelated administration into CRM.',
            },
            {
              label: 'Manager Review',
              hint: 'If escalation is needed, return to the manager data workspace first.',
              to: tradeCrmRouteMap.analytics,
            },
          ]
        : [
            {
              label: 'Tasks',
              hint: taskCoverageDescription,
              isActive: true,
              to: getTradeCrmScopedViewPath(tradeCrmRouteMap.collaboration, 'tasks'),
              countLabel: taskTotalCount != null ? `${taskTotalCount}` : undefined,
            },
            {
              label: 'Calendar',
              hint: 'Calendar supports execution rhythm without becoming a full office tool.',
              to: getTradeCrmScopedViewPath(
                tradeCrmRouteMap.collaboration,
                'calendar',
              ),
            },
            {
              label: 'Approvals',
              hint: 'Approvals stay as a placeholder and do not expand phase-one scope.',
              to: getTradeCrmScopedViewPath(
                tradeCrmRouteMap.collaboration,
                'approvals',
              ),
            },
            {
              label: 'Cross-object handoff',
              hint: tasksDueTodayDescription,
            },
          ];

  const cards =
    currentViewKey === 'calendar'
      ? [
          {
            title: 'Calendar Rhythm',
            description:
              'Use date visibility for follow-up planning and team rhythm before introducing heavier scheduling complexity.',
          },
          {
            title: 'Task Linkage',
            description: taskCoverageDescription,
            href: taskRuntimeLink,
            actionLabel: 'Open task queue',
          },
          {
            title: 'Customer Coordination',
            description:
              'Customer meetings, review calls, and key touchpoints should remain visible inside the customer workspace.',
            href: tradeCrmRouteMap.customers,
            actionLabel: 'Open customers workspace',
          },
          {
            title: 'Opportunity Coordination',
            description:
              'Quote, sample, and progression-related scheduling should continue inside the opportunity workspace.',
            href: tradeCrmRouteMap.opportunities,
            actionLabel: 'Open opportunities workspace',
          },
        ]
      : currentViewKey === 'approvals'
        ? [
            {
              title: 'Approvals Placeholder',
              description:
                'Approvals remain a later extension unless the repository gains a stable implementation path.',
            },
            {
              title: 'Phase-one Boundary',
              description:
                'Do not pull OA approvals, document circulation, or unrelated administrative flow into the CRM collaboration module during phase one.',
            },
            {
              title: 'Execution First',
              description:
                'When coordination is needed, return to tasks, customers, and opportunities before inventing a new approval workflow.',
              href: getTradeCrmScopedViewPath(
                tradeCrmRouteMap.collaboration,
                'tasks',
              ),
              actionLabel: 'Switch to task collaboration',
            },
            {
              title: 'Manager Review',
              description:
                'If escalation is required, review the manager data workspace first instead of building a fake approval surface.',
              href: tradeCrmRouteMap.analytics,
              actionLabel: 'Open team data',
            },
          ]
        : [
            {
              title: 'Task Queue',
              description: taskCoverageDescription,
              href: taskRuntimeLink,
              actionLabel: 'Open task queue',
            },
            {
              title: 'Today Due',
              description: tasksDueTodayDescription,
              href: firstTaskRecordLink ?? taskRuntimeLink,
              actionLabel:
                firstTaskRecordLink != null
                  ? 'Open a live task'
                  : 'Open task workspace',
            },
            {
              title: 'Calendar Coordination',
              description:
                'Use calendar visibility for follow-up planning and rhythm review before introducing larger scheduling complexity.',
              href: getTradeCrmScopedViewPath(
                tradeCrmRouteMap.collaboration,
                'calendar',
              ),
              actionLabel: 'Switch to calendar',
            },
            {
              title: 'Approvals Placeholder',
              description:
                'Approvals stay as a later extension unless the repository gains a stable implementation path.',
              href: getTradeCrmScopedViewPath(
                tradeCrmRouteMap.collaboration,
                'approvals',
              ),
              actionLabel: 'Switch to approvals',
            },
            {
              title: 'Cross-team Handoff',
              description:
                'Keep cooperation focused on CRM-owned commercial work rather than unrelated office workflows.',
            },
          ];

  const insights =
    currentViewKey === 'approvals'
      ? [
          {
            label: 'Primary artifact',
            value: 'Task first',
            description:
              'Before approvals enter the mainline, tasks remain the only stable collaboration carrier.',
          },
          {
            label: 'Calendar role',
            value: 'Supportive',
            description:
              'Calendar supports execution rhythm but does not replace CRM-owned state.',
          },
          {
            label: 'Boundary',
            value: 'No OA expansion',
            description:
              'Do not expand approvals or document handling into non-CRM administrative processes.',
          },
        ]
      : [
          {
            label: 'Primary artifact',
            value: hasTaskObject ? `${taskTotalCount ?? 0} tasks` : 'Task unavailable',
            description: taskCoverageDescription,
          },
          {
            label: 'Calendar role',
            value: currentViewKey === 'calendar' ? 'Rhythm layer' : 'Supportive',
            description:
              currentViewKey === 'calendar'
                ? 'Calendar primarily serves execution rhythm and review and should not create a detached business state.'
                : 'Calendar helps coordinate execution but does not replace CRM-owned state.',
          },
          {
            label: 'Today pressure',
            value:
              hasTaskObject && !tasksDueTodayLoading && !tasksDueTodayError
                ? `${totalTasksDueTodayCount} due today`
                : 'Task pressure pending',
            description: tasksDueTodayDescription,
          },
        ];

  return (
    <QueueWorkspaceLayout
      title="Collaboration"
      heroTitle={currentView.heroTitle}
      heroDescription={currentView.heroDescription}
      heroPills={[
        'Tasks',
        'Calendar rhythm',
        currentView.title,
        hasTaskObject ? `${taskTotalCount ?? 0} tasks` : 'Task setup pending',
      ]}
      tabs={tabs}
      sidebarTitle="Collaboration workspace"
      sidebarItems={sidebarItems}
      cards={cards}
      insightTitle="Collaboration boundary"
      insightDescription="The collaboration module stays narrow. It serves CRM execution and handoff instead of expanding into a general office platform."
      insights={insights}
      workspaceContext={{
        workspace: 'Collaboration',
        channel: 'task-calendar-and-handoff',
        stage: currentView.title,
        summaryText: [
          'Workspace: Collaboration',
          `Current view: ${currentView.title}`,
          `Task coverage: ${hasTaskObject ? `${taskTotalCount ?? 0} tasks` : 'task object unavailable'}`,
          `Tasks due today: ${hasTaskObject ? `${totalTasksDueTodayCount}` : 'unavailable'}`,
          'Scope: task, calendar rhythm, lightweight handoff.',
          'Boundary: no OA expansion in phase one.',
        ].join('\n'),
      }}
    />
  );
};
