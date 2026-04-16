import { useSearchParams } from 'react-router-dom';
import { tradeCrmRouteMap } from '@/trade-crm/navigation/tradeCrmRouteMap';
import { AppPath, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

import { getTradeCrmScopedViewPath } from '@/trade-crm/navigation/tradeCrmRouteMap';
import { QueueWorkspaceLayout } from '@/trade-crm/shared/layouts/QueueWorkspaceLayout';
import {
  getTradeCrmCurrentView,
  getTradeCrmPageTabs,
} from '@/trade-crm/shared/navigation/tradeCrmPageView';

type MailWorkspaceViewKey =
  | 'inbox'
  | 'pending-replies'
  | 'sent'
  | 'templates'
  | 'sequences'
  | 'tracking';

type MailWorkspaceView = {
  key: MailWorkspaceViewKey;
  label: string;
  title: string;
  heroTitle: string;
  heroDescription: string;
};

const mailWorkspaceViews: MailWorkspaceView[] = [
  {
    key: 'inbox',
    label: 'Inbox',
    title: 'Inbox Entry',
    heroTitle:
      'Use mail as a CRM communication entry point, not as a detached mailbox shell.',
    heroDescription:
      'The repository does not yet have a full standalone inbox product surface. In phase one this page should route sellers back to real mailbox settings, CRM records, and follow-up workspaces.',
  },
  {
    key: 'pending-replies',
    label: 'Pending Replies',
    title: 'Pending Replies',
    heroTitle:
      'Pending replies should be carried by tasks and CRM workspaces before a dedicated reply console exists.',
    heroDescription:
      'Phase one reply handling stays grounded in task queues and customer or opportunity context so communication does not disappear inside a fake mail-only page.',
  },
  {
    key: 'sent',
    label: 'Sent',
    title: 'Sent Communication',
    heroTitle:
      'Use sent mail for review and CRM handoff, not as a passive message archive.',
    heroDescription:
      'The sent view should help confirm that important outbound messages continue inside customer and opportunity workflows instead of ending inside the mailbox.',
  },
  {
    key: 'templates',
    label: 'Templates',
    title: 'Mail Templates',
    heroTitle:
      'Templates remain human-reviewed content assets and do not become an auto-send engine.',
    heroDescription:
      'In phase one templates are an operating layer only. AI may help draft content, but critical business emails still require explicit seller confirmation.',
  },
  {
    key: 'sequences',
    label: 'Sequences',
    title: 'Mail Sequences',
    heroTitle:
      'Keep sequences as a direction-setting workspace and do not expand them into mass automation too early.',
    heroDescription:
      'Mail sequences remain a later capability. Even when extended, they must stay inside manual review, CRM linkage, and sender-readiness boundaries.',
  },
  {
    key: 'tracking',
    label: 'Tracking',
    title: 'Tracking Analysis',
    heroTitle:
      'Evaluate tracking through customer follow-up quality, task closure, and opportunity movement before deeper BI is added.',
    heroDescription:
      'Tracking analysis in phase one focuses on whether replies are handled, whether key communication returns to CRM records, and whether commercial motion continues after the thread.',
  },
];

export const TradeCrmMailPage = () => {
  const [searchParams] = useSearchParams();
  const requestedView = searchParams.get('view');
  const { currentViewKey, currentView } = getTradeCrmCurrentView({
    requestedView,
    views: mailWorkspaceViews,
    fallbackViewKey: 'inbox' satisfies MailWorkspaceViewKey,
  });

  const tabs = getTradeCrmPageTabs({
    route: tradeCrmRouteMap.mail,
    views: mailWorkspaceViews,
    currentViewKey,
  });

  const sidebarItems =
    currentViewKey === 'pending-replies'
      ? [
          {
            label: 'Pending Replies',
            hint: 'Prioritize messages and follow-up actions that still need a seller response.',
            isActive: true,
            to: getTradeCrmScopedViewPath(tradeCrmRouteMap.mail, 'pending-replies'),
          },
          {
            label: 'Task Handoff',
            hint: 'The most stable pending-reply operating surface in phase one is still the task queue.',
            to: AppPath.TasksPage,
          },
          {
            label: 'Customer Context',
            hint: 'Important replies should return to the customer workspace for continued follow-up.',
            to: tradeCrmRouteMap.customers,
          },
          {
            label: 'Opportunity Context',
            hint: 'Quote and stage-related replies should return to the opportunity workspace.',
            to: tradeCrmRouteMap.opportunities,
          },
        ]
      : currentViewKey === 'templates'
        ? [
            {
              label: 'Templates',
              hint: 'Templates remain seller-reviewed content assets, not an auto-send surface.',
              isActive: true,
              to: getTradeCrmScopedViewPath(tradeCrmRouteMap.mail, 'templates'),
            },
            {
              label: 'AI Drafts',
              hint: 'AI can propose drafts and edits, but it cannot send critical mail directly.',
            },
            {
              label: 'Customer Context',
              hint: 'Templates should serve real customer and opportunity communication, not a detached mail workflow.',
              to: tradeCrmRouteMap.customers,
            },
            {
              label: 'Guardrails',
              hint: 'Critical business emails still require manual confirmation before sending.',
            },
          ]
        : currentViewKey === 'sequences'
          ? [
              {
                label: 'Sequences',
                hint: 'This remains a directional workspace only and is not yet a bulk automation engine.',
                isActive: true,
                to: getTradeCrmScopedViewPath(tradeCrmRouteMap.mail, 'sequences'),
              },
              {
                label: 'Manual Approval',
                hint: 'Any future sequence execution must keep a manual review step.',
              },
              {
                label: 'Email Accounts',
                hint: 'Sequences depend on stable mailbox accounts and sender configuration.',
                to: getSettingsPath(SettingsPath.AccountsEmails),
              },
              {
                label: 'Sending Domains',
                hint: 'Domain readiness comes before sequence scale-up.',
                to: getSettingsPath(SettingsPath.Domains),
              },
            ]
          : currentViewKey === 'tracking'
            ? [
                {
                  label: 'Tracking',
                  hint: 'Review whether replies are being handled and routed back into CRM action loops.',
                  isActive: true,
                  to: getTradeCrmScopedViewPath(tradeCrmRouteMap.mail, 'tracking'),
                },
                {
                  label: 'Customer Follow-up',
                  hint: 'Mail quality is only useful if it improves customer follow-up quality.',
                  to: tradeCrmRouteMap.customers,
                },
                {
                  label: 'Opportunity Follow-up',
                  hint: 'Quote-stage mail quality must show up in opportunity progression.',
                  to: tradeCrmRouteMap.opportunities,
                },
                {
                  label: 'Task Handoff',
                  hint: 'If mail signals do not return to tasks, the follow-up loop stays incomplete.',
                  to: AppPath.TasksPage,
                },
              ]
            : currentViewKey === 'sent'
              ? [
                  {
                    label: 'Sent',
                    hint: 'Review whether important outbound messages are linked back into CRM context.',
                    isActive: true,
                    to: getTradeCrmScopedViewPath(tradeCrmRouteMap.mail, 'sent'),
                  },
                  {
                    label: 'Customer Context',
                    hint: 'Important sent mail should continue inside the customer workspace.',
                    to: tradeCrmRouteMap.customers,
                  },
                  {
                    label: 'Opportunity Context',
                    hint: 'Commercial quote communication should remain visible inside opportunity workflow.',
                    to: tradeCrmRouteMap.opportunities,
                  },
                  {
                    label: 'AI Summary',
                    hint: 'AI can summarize sent communication, but it cannot mutate CRM state.',
                  },
                ]
              : [
                  {
                    label: 'Inbox',
                    hint: 'Use real mailbox accounts and CRM entry paths instead of a fake inbox shell.',
                    isActive: true,
                    to: getTradeCrmScopedViewPath(tradeCrmRouteMap.mail, 'inbox'),
                  },
                  {
                    label: 'Email Accounts',
                    hint: 'Confirm mailbox connection and sync stability first.',
                    to: getSettingsPath(SettingsPath.AccountsEmails),
                  },
                  {
                    label: 'Sending Domains',
                    hint: 'Domain and sender readiness are prerequisites for outbound work.',
                    to: getSettingsPath(SettingsPath.Domains),
                  },
                  {
                    label: 'CRM Linkage',
                    hint: 'Important threads should return to customer and opportunity context.',
                    to: tradeCrmRouteMap.customers,
                  },
                ];

  const cards =
    currentViewKey === 'pending-replies'
      ? [
          {
            title: 'Need Reply / Follow-up',
            description:
              'Use the existing task queue as the current reliable follow-up surface until a dedicated mail reply workspace is built.',
            href: AppPath.TasksPage,
            actionLabel: 'Open pending-reply tasks',
          },
          {
            title: 'Customer-linked Replies',
            description:
              'Pending reply work should return to the customer workspace so communication turns into visible relationship follow-up.',
            href: tradeCrmRouteMap.customers,
            actionLabel: 'Open customers workspace',
          },
          {
            title: 'Opportunity Replies',
            description:
              'Quote and stage-related replies should return to the opportunity workspace instead of staying isolated inside mail.',
            href: tradeCrmRouteMap.opportunities,
            actionLabel: 'Open opportunities workspace',
          },
          {
            title: 'AI Reply Draft',
            description:
              'AI can summarize thread context and draft a reply, but sending still requires explicit seller confirmation.',
          },
        ]
      : currentViewKey === 'sent'
        ? [
            {
              title: 'Sent Communication',
              description:
                'Use the sent workspace to confirm whether key outbound communication continues into customer and opportunity actions.',
            },
            {
              title: 'Customer-linked Communication',
              description:
                'Use the customer workspace as the operating base after important outbound mail is sent.',
              href: tradeCrmRouteMap.customers,
              actionLabel: 'Open customers workspace',
            },
            {
              title: 'Quote-stage Communication',
              description:
                'Quote-stage outbound mail should stay linked to the opportunity workflow so commercial movement remains visible.',
              href: tradeCrmRouteMap.opportunities,
              actionLabel: 'Open opportunities workspace',
            },
            {
              title: 'AI Summary',
              description:
                'AI can summarize what was sent and suggest next steps, but it cannot auto-send or auto-update status.',
            },
          ]
        : currentViewKey === 'templates'
          ? [
              {
                title: 'Templates',
                description:
                  'Templates are seller-reviewed content assets, not an automated delivery engine.',
              },
              {
                title: 'AI Draft Guardrail',
                description:
                  'AI may propose drafts and edits, but it cannot bypass manual confirmation for critical business mail.',
              },
              {
                title: 'Customer Context',
                description:
                  'Template content must serve real customer communication instead of a detached marketing flow.',
                href: tradeCrmRouteMap.customers,
                actionLabel: 'Open customers workspace',
              },
              {
                title: 'Opportunity Context',
                description:
                  'Quote, follow-up, and stage-specific templates should stay tied to opportunity actions.',
                href: tradeCrmRouteMap.opportunities,
                actionLabel: 'Open opportunities workspace',
              },
            ]
          : currentViewKey === 'sequences'
            ? [
                {
                  title: 'Sequences',
                  description:
                    'Templates, sequences, and tracking remain later-phase mail capabilities. They should stay manual and review-driven, not auto-send driven.',
                },
                {
                  title: 'Email Accounts',
                  description:
                    'The first prerequisite for sequences is reliable mailbox account connection and sync, not more automation.',
                  href: getSettingsPath(SettingsPath.AccountsEmails),
                  actionLabel: 'Open email accounts',
                },
                {
                  title: 'Sending Domains',
                  description:
                    'Domain and sender readiness must be confirmed before sequence expansion.',
                  href: getSettingsPath(SettingsPath.Domains),
                  actionLabel: 'Open domain settings',
                },
                {
                  title: 'Manual Review',
                  description:
                    'Even when sequences are extended later, they must keep manual approval and CRM context guardrails.',
                },
              ]
            : currentViewKey === 'tracking'
              ? [
                  {
                    title: 'Tracking Analysis',
                    description:
                      'Tracking should first map back to reply handling, task closure, and CRM linkage quality instead of becoming a detached mail BI panel.',
                  },
                  {
                    title: 'Task-linked Follow-up',
                    description:
                      'If tracking signals do not return to the task queue, the real follow-up loop remains incomplete.',
                    href: AppPath.TasksPage,
                    actionLabel: 'Open task queue',
                  },
                  {
                    title: 'Customer-linked Communication',
                    description:
                      'The customer workspace is the real place to confirm whether mail activity becomes customer operating progress.',
                    href: tradeCrmRouteMap.customers,
                    actionLabel: 'Open customers workspace',
                  },
                  {
                    title: 'Opportunity-linked Communication',
                    description:
                      'Quote and progression-related tracking should ultimately be reviewed from the opportunity workspace.',
                    href: tradeCrmRouteMap.opportunities,
                    actionLabel: 'Open opportunities workspace',
                  },
                ]
              : [
                  {
                    title: 'Email Accounts',
                    description:
                      'Connect and review synced mailboxes from the real account settings page instead of using a fake inbox shell.',
                    href: getSettingsPath(SettingsPath.AccountsEmails),
                    actionLabel: 'Open email accounts',
                  },
                  {
                    title: 'Sending Domains',
                    description:
                      'Manage emailing domains and sender readiness from the existing settings flow before scaling outbound communication.',
                    href: getSettingsPath(SettingsPath.Domains),
                    actionLabel: 'Open domain settings',
                  },
                  {
                    title: 'Need Reply / Follow-up',
                    description:
                      'Use the existing task queue as the current reliable follow-up surface until a dedicated mail reply workspace is built.',
                    href: AppPath.TasksPage,
                    actionLabel: 'Open pending-reply tasks',
                  },
                  {
                    title: 'CRM-linked Communication',
                    description:
                      'Use customer and opportunity workspaces as the current entry points for email-thread context instead of splitting communication away from CRM records.',
                    href: tradeCrmRouteMap.customers,
                    actionLabel: 'Open customers workspace',
                  },
                  {
                    title: 'Quote-stage Communication',
                    description:
                      'Quote follow-up and reply risk should remain visible from the opportunity workspace until a fuller mail workbench exists.',
                    href: tradeCrmRouteMap.opportunities,
                    actionLabel: 'Open opportunities workspace',
                  },
                  {
                    title: 'AI Reply Summary',
                    description:
                      'The AI dock on this page uses mail context to summarize reply pressure, surface CRM linkage gaps, and point the seller to the threads that matter first.',
                  },
                  {
                    title: 'AI Draft Guardrail',
                    description:
                      'AI can draft a follow-up email or quote-stage reply, but it cannot send mail or change CRM status without explicit seller confirmation.',
                  },
                  {
                    title: 'Templates and Sequences',
                    description:
                      'Templates, sequences, and tracking remain later-phase mail capabilities. They stay manual and review-driven in phase one.',
                    href: getTradeCrmScopedViewPath(tradeCrmRouteMap.mail, 'templates'),
                    actionLabel: 'Switch to templates',
                  },
                ];

  const insights =
    currentViewKey === 'templates' || currentViewKey === 'sequences'
      ? [
          {
            label: 'AI role',
            value: 'Draft only',
            description:
              'In template and sequence scenarios, AI is limited to suggestions and drafts and cannot take over sending.',
          },
          {
            label: 'Critical rule',
            value: 'Manual approval',
            description:
              'Critical business emails still require explicit human confirmation.',
          },
          {
            label: 'Current stage',
            value: currentView.title,
            description:
              'This workspace stays as an operating layer and does not expand into a full automation engine yet.',
          },
          {
            label: 'Mail discipline',
            value: 'Serve CRM context',
            description:
              'Templates and sequences must serve customer and opportunity communication instead of becoming detached from CRM records.',
          },
        ]
      : [
          {
            label: 'AI role',
            value: 'Summarize, rank, and draft',
            description:
              'AI can summarize thread pressure, suggest reply order, and draft follow-up content from mail context.',
          },
          {
            label: 'Critical rule',
            value: 'No auto-send',
            description:
              'Templates and sequences still require explicit seller confirmation.',
          },
          {
            label: 'Current stage',
            value: currentView.title,
            description:
              'This page uses query-scoped mail workspaces instead of one fixed routing page.',
          },
          {
            label: 'Mail discipline',
            value: 'Reply with CRM context',
            description:
              'Important emails should route back into customers and opportunities so follow-up stays visible after the thread is closed.',
          },
        ];

  return (
    <QueueWorkspaceLayout
      title="Mail"
      heroTitle={currentView.heroTitle}
      heroDescription={currentView.heroDescription}
      heroPills={[
        'Email accounts',
        'Domains',
        currentView.title,
        'CRM linkage',
        'AI summary and draft',
      ]}
      tabs={tabs}
      sidebarTitle="Mail workspace"
      sidebarItems={sidebarItems}
      cards={cards}
      insightTitle="Mail guardrails and discipline"
      insightDescription="The mail workspace remains bounded by CRM linkage, human confirmation, and AI assistance. It does not become a detached mailbox product in phase one."
      insights={insights}
      workspaceContext={{
        workspace: 'Mail',
        entityType: 'mail',
        channel: 'email',
        stage: currentView.title,
        summaryText: [
          'Workspace: Mail',
          `Current mode: ${currentView.title}`,
          'AI focus: reply summary, draft generation, and follow-up sequencing.',
          'Guardrail: no auto-send and no CRM status mutation.',
        ].join('\n'),
      }}
    />
  );
};
