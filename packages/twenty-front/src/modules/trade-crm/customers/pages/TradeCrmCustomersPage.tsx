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
import { useTradeCrmObjectViewLink } from '@/workbench/hooks/useTradeCrmObjectViewLink';
import { useTasksDueToday } from '@/workbench/hooks/useTasksDueToday';
import { useSearchParams } from 'react-router-dom';
import { CoreObjectNameSingular } from 'twenty-shared/types';

type CustomerWorkspaceViewKey =
  | 'customer-list'
  | 'contacts'
  | 'segmentation'
  | 'public-pool'
  | 'customer-360';

type CustomerWorkspaceView = {
  key: CustomerWorkspaceViewKey;
  label: string;
  title: string;
  heroTitle: string;
  heroDescription: string;
  heroSummaryTitle: string;
  heroSummaryText: string;
  insightTitle: string;
  insightDescription: string;
};

const customerWorkspaceViews: CustomerWorkspaceView[] = [
  {
    key: 'customer-list',
    label: 'Customer List',
    title: 'Customer Base',
    heroTitle:
      'Start with customer ownership, contact coverage, and active follow-up before drilling into individual records.',
    heroDescription:
      'The customer workspace should answer which accounts are being worked, who owns them, whether contact coverage exists, and whether commercial motion is still active. It is the operating entry, not a static master-data page.',
    heroSummaryTitle: 'Account operating lens',
    heroSummaryText:
      'Keep ownership, contact coverage, open opportunities, and due follow-up visible together so the customer page remains an action surface.',
    insightTitle: 'Customer Operating Focus',
    insightDescription:
      'Phase-one customer work should keep ownership, contacts, opportunities, and follow-up activity visible in one surface.',
  },
  {
    key: 'contacts',
    label: 'Contacts',
    title: 'Contact Coverage',
    heroTitle:
      'Verify contact coverage first, then continue with outbound email and account follow-up.',
    heroDescription:
      'The contacts surface should show whether usable decision-makers and reachable contacts exist for the account. It is not just an attached address book.',
    heroSummaryTitle: 'Coverage first',
    heroSummaryText:
      'This view should close communication gaps quickly and route sellers back into customer and mail execution with real reachable contacts.',
    insightTitle: 'Coverage Rules',
    insightDescription:
      'Contact coverage quality directly affects whether customer follow-up and outbound work are actually executable.',
  },
  {
    key: 'segmentation',
    label: 'Segmentation',
    title: 'Customer Segmentation',
    heroTitle:
      'Use segmentation, stage, source, and owner together in one operating view.',
    heroDescription:
      'Segmentation should support real execution by showing which accounts need acceleration, contact repair, or reactivation.',
    heroSummaryTitle: 'Priority logic',
    heroSummaryText:
      'Segmentation is only useful when it changes which accounts need acceleration, repair, reactivation, or manager attention next.',
    insightTitle: 'Segmentation Rules',
    insightDescription:
      'Segmentation only has value when it changes priorities, follow-up rhythm, and manager review.',
  },
  {
    key: 'public-pool',
    label: 'Public Pool',
    title: 'Public and Private Pool',
    heroTitle:
      'Keep claim, recycle, and ownership transfer visible inside the operating surface.',
    heroDescription:
      'The public-pool surface should show which accounts can be claimed, which should be recycled, and which rules affect ownership.',
    heroSummaryTitle: 'Ownership discipline',
    heroSummaryText:
      'Public pool execution should expose claim, recycle, and transfer decisions directly in the workspace instead of hiding them in settings.',
    insightTitle: 'Ownership Discipline',
    insightDescription:
      'Ownership transfer rules need to stay visible in execution, not hidden only in settings.',
  },
  {
    key: 'customer-360',
    label: 'Customer 360',
    title: 'Customer 360 Entry',
    heroTitle:
      'Use Customer 360 as the handoff into real account context, not as a separate system.',
    heroDescription:
      'This round keeps Customer 360 as the workspace entry into company, people, opportunity, and AI context. Deeper aggregation can continue on top of real record shells.',
    heroSummaryTitle: 'Context handoff',
    heroSummaryText:
      'Customer 360 should reduce page-jumping by handing sellers from the workspace into live company, people, task, and opportunity context.',
    insightTitle: '360 Goal',
    insightDescription:
      'Customer 360 should reduce jumping between pages and context gaps, not create another long static detail page.',
  },
];

export const TradeCrmCustomersPage = () => {
  const [searchParams] = useSearchParams();
  const { objectMetadataItems } = useObjectMetadataItems();
  const hasCompanyObject = objectMetadataItems.some(
    (item) => item.nameSingular === CoreObjectNameSingular.Company,
  );
  const hasPersonObject = objectMetadataItems.some(
    (item) => item.nameSingular === CoreObjectNameSingular.Person,
  );
  const hasOpportunityObject = objectMetadataItems.some(
    (item) => item.nameSingular === CoreObjectNameSingular.Opportunity,
  );
  const hasTaskObject = objectMetadataItems.some(
    (item) => item.nameSingular === CoreObjectNameSingular.Task,
  );

  const requestedView = searchParams.get('view');
  const { currentViewKey, currentView } = getTradeCrmCurrentView({
    requestedView,
    views: customerWorkspaceViews,
    fallbackViewKey: 'customer-list' satisfies CustomerWorkspaceViewKey,
  });

  const {
    records: companyRecords,
    totalCount: companyTotalCount,
    loading: companiesLoading,
    error: companiesError,
  } = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.Company,
    limit: 1,
    skip: !hasCompanyObject,
  });

  const {
    records: peopleRecords,
    totalCount: peopleTotalCount,
    loading: peopleLoading,
    error: peopleError,
  } = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.Person,
    limit: 1,
    skip: !hasPersonObject,
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

  const companyListLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Company,
  });
  const peopleListLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Person,
  });
  const opportunityListLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });
  const taskListLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Task,
  });
  const tasksDueTodayLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Task,
    preferredViewName: 'Tasks Due Today',
  });
  const pipelineNeedsNextActionLink = useTradeCrmObjectViewLink({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    preferredViewName: 'Pipeline Needs Next Action',
  });
  const customerListSource = createTradeCrmRecordSource({
    href: companyListLink,
    workspaceKey: 'customers',
    workspaceLabel: 'Customers',
    viewKey: 'customer-list',
    viewLabel: 'Customer List',
  });
  const contactsSource = createTradeCrmRecordSource({
    href: peopleListLink,
    workspaceKey: 'customers',
    workspaceLabel: 'Customers',
    viewKey: 'contacts',
    viewLabel: 'Contacts',
  });
  const customer360Source = createTradeCrmRecordSource({
    href: opportunityListLink,
    workspaceKey: 'customers',
    workspaceLabel: 'Customers',
    viewKey: 'customer-360',
    viewLabel: 'Customer 360',
  });
  const followUpTaskSource = createTradeCrmRecordSource({
    href: taskListLink,
    workspaceKey: 'customers',
    workspaceLabel: 'Customers',
    viewKey: 'customer-360',
    viewLabel: 'Follow-up Tasks',
  });

  const firstCompanyRecordLink = companyRecords?.[0]?.id
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: CoreObjectNameSingular.Company,
        objectRecordId: companyRecords[0].id,
        source: customerListSource,
      })
    : undefined;
  const firstPeopleRecordLink = peopleRecords?.[0]?.id
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: CoreObjectNameSingular.Person,
        objectRecordId: peopleRecords[0].id,
        source: contactsSource,
      })
    : undefined;
  const firstOpportunityRecordLink = opportunityRecords?.[0]?.id
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: CoreObjectNameSingular.Opportunity,
        objectRecordId: opportunityRecords[0].id,
        source: customer360Source,
      })
    : undefined;
  const firstTaskRecordLink = taskRecords?.[0]?.id
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: CoreObjectNameSingular.Task,
        objectRecordId: taskRecords[0].id,
        source: followUpTaskSource,
      })
    : undefined;

  const companyDescription = !hasCompanyObject
    ? 'Company object metadata is not initialized yet. Complete the phase-one object setup before customer operations start here.'
    : companiesLoading
      ? 'Loading customer company coverage from CRM core.'
      : companiesError
        ? 'Company list is temporarily unavailable. Open the standard company list to retry.'
        : `${companyTotalCount ?? 0} companies are currently available for customer ownership, follow-up, and opportunity linkage.`;

  const peopleDescription = !hasPersonObject
    ? 'Person object metadata is not initialized yet. Complete the phase-one object setup before contact operations start here.'
    : peopleLoading
      ? 'Loading contact coverage from CRM core.'
      : peopleError
        ? 'Contact list is temporarily unavailable. Open the standard people list to retry.'
        : `${peopleTotalCount ?? 0} contacts are currently available to support communication and account coverage.`;

  const opportunityDescription = !hasOpportunityObject
    ? 'Opportunity object metadata is not initialized yet. Customer 360 and account review remain shallow until opportunities are available.'
    : opportunitiesLoading
      ? 'Loading opportunity linkage from CRM core.'
      : opportunitiesError
        ? 'Opportunity list is temporarily unavailable. Open the standard opportunity list to retry.'
        : `${opportunityTotalCount ?? 0} opportunities are currently available to connect customer coverage with pipeline execution.`;
  const taskDescription = !hasTaskObject
    ? 'Task object metadata is not initialized yet. Customer follow-up remains shallow until task execution is available.'
    : tasksLoading
      ? 'Loading customer follow-up task coverage from CRM core.'
      : tasksError
        ? 'Task list is temporarily unavailable. Open the standard task list to retry.'
        : `${taskTotalCount ?? 0} tasks are currently available to carry customer follow-up, reminder discipline, and account handoff.`;
  const tasksDueTodayDescription = !hasTaskObject
    ? 'Today-task pressure depends on task setup being available first.'
    : tasksDueTodayLoading
      ? 'Loading today follow-up pressure from the task queue.'
      : tasksDueTodayError
        ? 'Today task pressure is temporarily unavailable. Open the task queue to retry.'
        : `${totalTasksDueTodayCount} tasks are currently due today and should be reviewed alongside customer ownership and opportunity motion.`;
  const operatingPriorityLabel =
    totalTasksDueTodayCount > 0
      ? 'Customer follow-up execution'
      : (companyTotalCount ?? 0) > 0
        ? 'Account coverage and follow-up'
        : 'Customer base initialization';

  const tabs = getTradeCrmPageTabs({
    route: tradeCrmRouteMap.customers,
    views: customerWorkspaceViews,
    currentViewKey,
  });

  const sidebarItems = [
    {
      label: 'Customer List',
      hint: 'Customer base, ownership, and follow-up entry.',
      isActive: currentViewKey === 'customer-list',
      to: getTradeCrmScopedViewPath(tradeCrmRouteMap.customers, 'customer-list'),
      countLabel: `${companyTotalCount ?? 0}`,
    },
    {
      label: 'Contacts',
      hint: 'Coverage and communication readiness.',
      isActive: currentViewKey === 'contacts',
      to: getTradeCrmScopedViewPath(tradeCrmRouteMap.customers, 'contacts'),
      countLabel: `${peopleTotalCount ?? 0}`,
    },
    {
      label: 'Segmentation',
      hint: 'Stage, tier, and priority review.',
      isActive: currentViewKey === 'segmentation',
      to: getTradeCrmScopedViewPath(tradeCrmRouteMap.customers, 'segmentation'),
      countLabel: `${companyTotalCount ?? 0}`,
    },
    {
      label: 'Public Pool',
      hint: 'Claim, recycle, and reassignment view.',
      isActive: currentViewKey === 'public-pool',
      to: getTradeCrmScopedViewPath(tradeCrmRouteMap.customers, 'public-pool'),
      countLabel: `${companyTotalCount ?? 0}`,
    },
    {
      label: 'Customer 360',
      hint: 'Account, people, opportunity, and AI handoff.',
      isActive: currentViewKey === 'customer-360',
      to: getTradeCrmScopedViewPath(tradeCrmRouteMap.customers, 'customer-360'),
      countLabel: `${taskTotalCount ?? 0}`,
    },
  ];

  const cards =
    currentViewKey === 'contacts'
      ? [
          {
            title: 'Contacts',
            description: peopleDescription,
            href: hasPersonObject ? peopleListLink : undefined,
            actionLabel: 'Open contact base',
            secondaryHref: firstPeopleRecordLink,
            secondaryActionLabel: 'Open first contact',
          },
          {
            title: 'Open Contact Record',
            description:
              firstPeopleRecordLink != null
                ? 'Use one real contact record as the handoff target so contact coverage work can continue inside the actual people detail shell.'
                : 'No contact record is available yet. Keep contact coverage work anchored to the people base until records exist.',
            href:
              firstPeopleRecordLink ??
              (hasPersonObject ? peopleListLink : undefined),
            actionLabel:
              firstPeopleRecordLink != null
                ? 'Open contact record'
                : 'Open contact base',
          },
          {
            title: 'Customer Linkage',
            description:
              'Contacts must link back to the customer account context. Otherwise outbound email, follow-up notes, and opportunity movement remain fragmented across separate entry points.',
            href: hasCompanyObject ? companyListLink : undefined,
            actionLabel: 'Open customer base',
          },
          {
            title: 'Email Readiness',
            description:
              'Use this view to find accounts that still miss key contacts, have weak outbound readiness, or need better communication coverage.',
            href: tradeCrmRouteMap.mail,
            actionLabel: 'Open mail workspace',
          },
          {
            title: 'Customer 360 Direction',
            description:
              'The next step for contact work is not more profile fields. It is using those contacts inside customer context, opportunity context, and the activity stream.',
            href: getTradeCrmScopedViewPath(
              tradeCrmRouteMap.customers,
              'customer-360',
            ),
            actionLabel: 'Open customer 360 entry',
          },
        ]
      : currentViewKey === 'segmentation'
        ? [
            {
              title: 'Customer Segmentation',
              description:
                'Segmentation should stay attached to real company records instead of duplicating labels inside a separate module.',
              href: hasCompanyObject ? companyListLink : undefined,
              actionLabel: 'Review company base',
              secondaryHref: firstCompanyRecordLink,
              secondaryActionLabel: 'Open first company',
            },
            {
              title: 'Account Stage Review',
              description:
                'Account stage, activity level, and ownership should stay in one operating view so sellers and managers use the same priority lens.',
              href: hasCompanyObject ? companyListLink : undefined,
              actionLabel: 'Inspect account stage',
            },
            {
              title: 'Opportunity Linkage',
              description: opportunityDescription,
              href: hasOpportunityObject ? opportunityListLink : undefined,
              actionLabel: 'Open opportunity workspace',
              secondaryHref: firstOpportunityRecordLink,
              secondaryActionLabel: 'Open first opportunity',
            },
            {
              title: 'Execution Focus',
              description:
                'Segmentation only matters when it changes follow-up rhythm, contact repair, and resource focus.',
            },
          ]
        : currentViewKey === 'public-pool'
          ? [
              {
                title: 'Public Pool Readiness',
                description:
                  'The public-pool surface should expose claimable accounts, recycle candidates, and ownership rules directly inside the workspace.',
                href: hasCompanyObject ? companyListLink : undefined,
                actionLabel: 'Review customer pool',
                secondaryHref: firstCompanyRecordLink,
                secondaryActionLabel: 'Open first company',
              },
              {
                title: 'Reassignment Rules',
                description:
                  'Ownership transfer only has operating value when assignment, recycle rules, and owner visibility stay linked together.',
                href: tradeCrmRouteMap.settings,
                actionLabel: 'Open trade CRM settings',
              },
              {
                title: 'Contact Coverage Before Claim',
                description:
                  'Before claiming an account, review contact coverage and active opportunity state instead of only the account name.',
                href: hasPersonObject ? peopleListLink : undefined,
                actionLabel: 'Review contact readiness',
                secondaryHref: firstPeopleRecordLink,
                secondaryActionLabel: 'Open first contact',
              },
              {
                title: 'Manager Discipline',
                description:
                  'Managers should see overdue accounts, recycle candidates, and ownership conflicts from the same surface.',
                href: tradeCrmRouteMap.analytics,
                actionLabel: 'Open team data',
              },
            ]
          : currentViewKey === 'customer-360'
            ? [
                {
                  title: 'Company Record Shell',
                  description:
                    'Customer 360 still starts from the company record, which should hold together contacts, opportunities, activity, and AI insight.',
                  href:
                    firstCompanyRecordLink ??
                    (hasCompanyObject ? companyListLink : undefined),
                  actionLabel:
                    firstCompanyRecordLink != null
                      ? 'Open company record'
                      : 'Open company records',
                },
                {
                  title: 'People And Coverage',
                  description:
                    'Contact data is a required layer of Customer 360. Without usable contacts, account operations remain weak.',
                  href:
                    firstPeopleRecordLink ??
                    (hasPersonObject ? peopleListLink : undefined),
                  actionLabel:
                    firstPeopleRecordLink != null
                      ? 'Open people record'
                      : 'Open people records',
                },
                {
                  title: 'Opportunity Context',
                  description: opportunityDescription,
                  href:
                    firstOpportunityRecordLink ??
                    (hasOpportunityObject
                      ? pipelineNeedsNextActionLink
                      : undefined),
                  actionLabel:
                    firstOpportunityRecordLink != null
                      ? 'Open opportunity record'
                      : 'Open opportunity queue',
                },
                {
                  title: 'Task And Follow-up Context',
                  description:
                    firstTaskRecordLink != null
                      ? `${tasksDueTodayDescription} Use one live task as the handoff into real customer follow-up execution.`
                      : `${taskDescription} Stay on the task queue until the first live task is available.`,
                  href:
                    firstTaskRecordLink ??
                    (hasTaskObject ? tasksDueTodayLink : undefined),
                  actionLabel:
                    firstTaskRecordLink != null
                      ? 'Open live task'
                      : 'Open task queue',
                },
                {
                  title: 'AI Insight',
                  description:
                    'AI on the customer page should stay limited to summary, risk prompts, and next-step suggestions. It must not directly change core customer state.',
                },
              ]
            : [
                {
                  title: 'Companies',
                  description: companyDescription,
                  href: hasCompanyObject ? companyListLink : undefined,
                  actionLabel: 'Open company base',
                  secondaryHref: firstCompanyRecordLink,
                  secondaryActionLabel: 'Open first company',
                },
                {
                  title: 'Contacts',
                  description: peopleDescription,
                  href: hasPersonObject ? peopleListLink : undefined,
                  actionLabel: 'Open contact base',
                  secondaryHref: firstPeopleRecordLink,
                  secondaryActionLabel: 'Open first contact',
                },
                {
                  title: 'Open Company Record',
                  description:
                    firstCompanyRecordLink != null
                      ? 'Use one real company record as the handoff target so customer operations can move from the workspace into the actual record shell.'
                      : 'No company record is available yet. Keep customer operations anchored to the company base until records exist.',
                  href:
                    firstCompanyRecordLink ??
                    (hasCompanyObject ? companyListLink : undefined),
                  actionLabel:
                    firstCompanyRecordLink != null
                      ? 'Open company record'
                      : 'Open company base',
                },
                {
                  title: 'Opportunity Linkage',
                  description: opportunityDescription,
                  href: hasOpportunityObject ? opportunityListLink : undefined,
                  actionLabel: 'Open opportunity workspace',
                  secondaryHref: firstOpportunityRecordLink,
                  secondaryActionLabel: 'Open first opportunity',
                },
                {
                  title: 'Customer Tasks',
                  description: tasksDueTodayDescription,
                  href: hasTaskObject ? tasksDueTodayLink : undefined,
                  actionLabel: 'Open tasks due today',
                  secondaryHref: firstTaskRecordLink,
                  secondaryActionLabel: 'Open first task',
                },
                {
                  title: 'Customer Follow-up',
                  description:
                    'Customer follow-up should answer whether ownership is clear, contacts are covered, opportunities are linked, and the most recent key action is visible.',
                  href: hasTaskObject ? taskListLink : undefined,
                  actionLabel: 'Review task activity base',
                },
              ];

  const insights =
    currentViewKey === 'contacts'
      ? [
          {
            label: 'Record focus',
            value: 'Contact coverage',
            description:
              'This view should solve coverage gaps and outbound readiness, not become a standalone contact archive.',
          },
          {
            label: 'Priority',
            value: peopleLoading ? 'Loading' : `${peopleTotalCount ?? 0} contacts`,
            description:
              'The real priority is whether key accounts have usable contacts, not the raw contact count.',
          },
          {
            label: 'Execution',
            value: 'Link back to customers',
            description:
              'Contacts must be used inside customer and opportunity context, not drift outside the operating workflow.',
          },
          {
            label: 'Current stage',
            value: 'Coverage first',
            description:
              'Stabilize contact coverage first, then deepen Customer 360 aggregation.',
          },
        ]
      : currentViewKey === 'public-pool'
        ? [
            {
              label: 'Record focus',
              value: 'Ownership discipline',
              description:
                'The public pool should make claim, recycle, and ownership transfer visible.',
            },
            {
              label: 'Priority',
              value: 'Claim and recycle',
              description:
                'Ownership rules should be visible in the workspace, not only in back-office settings.',
            },
            {
              label: 'Execution',
              value: 'Pool before detail',
              description:
                'Clarify public and private pool execution before expanding deeper customer detail work.',
            },
            {
              label: 'Current stage',
              value: 'Governed ownership',
              description:
                'Customer operating discipline depends on stable ownership transfer rules.',
            },
          ]
        : currentViewKey === 'customer-360'
          ? [
              {
                label: 'Record focus',
                value: 'Context over fields',
                description:
                  'The goal of Customer 360 is to hold account, contact, opportunity, and activity context together, not to create a longer field form.',
              },
              {
                label: 'Priority',
                value: operatingPriorityLabel,
                description:
                  'Customer 360 should prioritize ownership, contact coverage, task follow-up, and opportunity motion.',
              },
              {
                label: 'Execution',
                value: hasTaskObject ? `${taskTotalCount ?? 0} tasks` : 'Task setup pending',
                description:
                  'Customer execution needs visible tasks and reminders; AI stays in the assist layer and should not directly change core customer state.',
              },
              {
                label: 'Current stage',
                value: 'Entry first',
                description:
                  'Phase one establishes the entry first, then deepens aggregation around real record shells.',
              },
            ]
          : [
              {
                label: 'Record focus',
                value: 'Account first',
                description:
                  'Company remains the customer anchor while people and opportunities stay attached around it.',
              },
              {
                label: 'Priority',
                value: operatingPriorityLabel,
                description:
                  'Customer work should start from ownership and active follow-up, not from passive profile maintenance.',
              },
              {
                label: 'Execution',
                value:
                  currentViewKey === 'segmentation'
                    ? 'Operate by priority'
                    : 'Context over fields',
                description:
                  currentViewKey === 'segmentation'
                    ? 'Segmentation and stage only matter when they drive real operating priority and follow-up rhythm.'
                    : 'Sellers need communication, task, and opportunity visibility more than another static detail section.',
              },
              {
                label: 'Current stage',
                value: currentView.title,
                description:
                  'This page routes customer work through query-scoped sub-workspaces instead of one static concept surface.',
              },
            ];

  return (
    <QueueWorkspaceLayout
      title="Customers"
      heroTitle={currentView.heroTitle}
      heroDescription={currentView.heroDescription}
      heroPills={[
        `${companyTotalCount ?? 0} companies`,
        `${peopleTotalCount ?? 0} contacts`,
        `${opportunityTotalCount ?? 0} opportunities`,
        `${taskTotalCount ?? 0} tasks`,
        currentView.title,
        operatingPriorityLabel,
      ]}
      heroSummaryTitle={currentView.heroSummaryTitle}
      heroSummaryText={currentView.heroSummaryText}
      tabs={tabs}
      sidebarTitle="Customer Workspace"
      sidebarItems={sidebarItems}
      cards={cards}
      insightTitle={currentView.insightTitle}
      insightDescription={currentView.insightDescription}
      insights={insights}
      workspaceContext={{
        workspace: 'Customers',
        entityType: 'customer',
        channel: 'account-ownership-and-follow-up',
        stage: currentView.title,
        summaryText: [
          'Workspace: Customers',
          `Current view: ${currentView.title}`,
          `Companies: ${companyTotalCount ?? 0}`,
          `Contacts: ${peopleTotalCount ?? 0}`,
          `Opportunities: ${opportunityTotalCount ?? 0}`,
          `Tasks: ${taskTotalCount ?? 0}`,
          `Tasks Due Today: ${hasTaskObject ? totalTasksDueTodayCount : 0}`,
          `Priority: ${operatingPriorityLabel}`,
        ].join('\n'),
      }}
    />
  );
};
