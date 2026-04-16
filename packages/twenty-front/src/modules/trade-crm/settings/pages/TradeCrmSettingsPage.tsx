import { useSearchParams } from 'react-router-dom';
import { AppPath, SettingsPath } from 'twenty-shared/types';
import { getAppPath, getSettingsPath } from 'twenty-shared/utils';

import {
  getTradeCrmScopedViewPath,
  tradeCrmRouteMap,
} from '@/trade-crm/navigation/tradeCrmRouteMap';
import {
  AdminWorkspaceLayout,
  type AdminWorkspaceCard,
} from '@/trade-crm/shared/layouts/AdminWorkspaceLayout';
import {
  getTradeCrmCurrentView,
  getTradeCrmPageTabs,
} from '@/trade-crm/shared/navigation/tradeCrmPageView';
import {
  createTradeCrmRecordSource,
  getTradeCrmRecordPathFromSource,
} from '@/trade-crm/shared/navigation/tradeCrmRecordSource';
import { useLeadFirstResponseRisk } from '@/workbench/hooks/useLeadFirstResponseRisk';
import { useQuoteFollowUpReminderQueue } from '@/workbench/hooks/useQuoteFollowUpReminderQueue';
import { useStalledOpportunityReminderQueue } from '@/workbench/hooks/useStalledOpportunityReminderQueue';
import { useTodayNewLeads } from '@/workbench/hooks/useTodayNewLeads';

type TradeCrmSettingsViewKey =
  | 'fields-dictionaries'
  | 'stages-status'
  | 'assignment-rules'
  | 'sources-dedup'
  | 'automation-rules'
  | 'ai-config'
  | 'integrations';

type TradeCrmSettingsView = {
  key: TradeCrmSettingsViewKey;
  label: string;
  title: string;
  heroTitle: string;
  heroDescription: string;
  cards: AdminWorkspaceCard[];
};

const tradeCrmSettingsViews: TradeCrmSettingsView[] = [
  {
    key: 'fields-dictionaries',
    label: 'Fields & Dictionaries',
    title: 'Field Governance',
    heroTitle: 'Keep trade CRM fields and controlled vocabularies anchored to the core data model.',
    heroDescription:
      'Trade CRM settings should extend the Twenty object model, not create a second metadata system. This workspace collects the entry points for fields, dictionary values, and related governance.',
    cards: [
      {
        title: 'Object Data Model',
        description:
          'Manage trade-specific fields on lead, company, people, opportunity, and task in the core object settings.',
        href: getSettingsPath(SettingsPath.Objects),
        actionLabel: 'Open object settings',
      },
      {
        title: 'Workspace Conventions',
        description:
          'Keep naming, required-field expectations, and list hygiene aligned with the shared workspace baseline.',
        href: getSettingsPath(SettingsPath.Workspace),
        actionLabel: 'Open workspace settings',
      },
      {
        title: 'Role Impact',
        description:
          'Review whether new fields need role-aware visibility or update permissions before wider rollout.',
        href: getSettingsPath(SettingsPath.Roles),
        actionLabel: 'Open roles',
      },
      {
        title: 'Dictionary Discipline',
        description:
          'Standard dictionaries remain a governance rule. Avoid free-text drift for source, stage, and classification values.',
      },
    ],
  },
  {
    key: 'stages-status',
    label: 'Stages & Status',
    title: 'Pipeline Semantics',
    heroTitle: 'Control stage and status meaning in one place before workflow logic expands.',
    heroDescription:
      'Phase-one execution depends on consistent lead status, customer tiering, and opportunity stage semantics. This workspace keeps stage governance attached to the existing CRM configuration surface.',
    cards: [
      {
        title: 'Opportunity Stage Model',
        description:
          'Update pipeline stages and field definitions in the object model instead of embedding stage rules in page-only code.',
        href: getSettingsPath(SettingsPath.Objects),
        actionLabel: 'Open object settings',
      },
      {
        title: 'Workspace Defaults',
        description:
          'Review workspace-level defaults that affect state naming, object visibility, and shared settings conventions.',
        href: getSettingsPath(SettingsPath.Workspace),
        actionLabel: 'Open workspace settings',
      },
      {
        title: 'Role and Ownership',
        description:
          'When stage change authority matters, align it with role permissions rather than ad hoc UI branching.',
        href: getSettingsPath(SettingsPath.Roles),
        actionLabel: 'Open roles',
      },
      {
        title: 'Status Governance',
        description:
          'Lead, customer, and opportunity status values should stay stable enough to support automation and manager reporting.',
      },
    ],
  },
  {
    key: 'assignment-rules',
    label: 'Assignment Rules',
    title: 'Ownership Routing',
    heroTitle: 'Route new demand into clear ownership rules before adding more automation layers.',
    heroDescription:
      'Assignment remains a management rule, not an AI behavior. This workspace groups the control points for owner mapping, member governance, and role boundaries.',
    cards: [
      {
        title: 'Workspace Members',
        description:
          'Assignment rules depend on the actual member roster, manager coverage, and active sellers in the workspace.',
        href: getSettingsPath(SettingsPath.WorkspaceMembersPage),
        actionLabel: 'Open members',
      },
      {
        title: 'Role Permissions',
        description:
          'Review who can reassign, reclaim, or override owner decisions before enabling broader rule coverage.',
        href: getSettingsPath(SettingsPath.Roles),
        actionLabel: 'Open roles',
      },
      {
        title: 'General Workspace Settings',
        description:
          'Keep shared ownership and governance conventions centralized in the normal settings shell.',
        href: getSettingsPath(SettingsPath.Workspace),
        actionLabel: 'Open workspace settings',
      },
      {
        title: 'Rule Boundary',
        description:
          'Trade CRM assignment logic should remain explicit and reviewable. Do not hide ownership routing inside opaque UI-only heuristics.',
      },
    ],
  },
  {
    key: 'sources-dedup',
    label: 'Sources & Dedup',
    title: 'Intake Hygiene',
    heroTitle: 'Normalize sources and dedup boundaries before scaling lead ingestion channels.',
    heroDescription:
      'Source governance and dedup logic belong to the intake control layer. This workspace links the visible settings surfaces that support source registration, domain trust, and API boundaries.',
    cards: [
      {
        title: 'API and Webhooks',
        description:
          'Inbound source registration, webhook boundaries, and ingestion-facing credentials stay inside the existing API settings shell.',
        href: getSettingsPath(SettingsPath.ApiWebhooks),
        actionLabel: 'Open APIs & Webhooks',
      },
      {
        title: 'Domains',
        description:
          'Emailing and public domain setup provide part of the source-trust baseline used by intake and matching rules.',
        href: getSettingsPath(SettingsPath.Domains),
        actionLabel: 'Open domains',
      },
      {
        title: 'Workspace Conventions',
        description:
          'Shared source naming and matching discipline should be documented and enforced through workspace-level governance.',
        href: getSettingsPath(SettingsPath.Workspace),
        actionLabel: 'Open workspace settings',
      },
      {
        title: 'Dedup Boundary',
        description:
          'Dedup orchestration still belongs to integration-hub. The frontend settings layer should expose rules and context, not execute matching pipelines.',
      },
    ],
  },
  {
    key: 'automation-rules',
    label: 'Automation Rules',
    title: 'Automation Guardrails',
    heroTitle: 'Keep phase-one automation explicit, reviewable, and attached to stable CRM states.',
    heroDescription:
      'The first release only supports a small automation set. This workspace gathers the places operators need to check when rule behavior depends on object fields, API boundaries, or workspace conventions.',
    cards: [
      {
        title: 'Object Preconditions',
        description:
          'Rule triggers only work if the underlying fields and statuses are defined consistently on the CRM objects.',
        href: getSettingsPath(SettingsPath.Objects),
        actionLabel: 'Open object settings',
      },
      {
        title: 'API and Webhooks',
        description:
          'External triggers and callback surfaces should stay auditable through the existing API configuration pages.',
        href: getSettingsPath(SettingsPath.ApiWebhooks),
        actionLabel: 'Open APIs & Webhooks',
      },
      {
        title: 'Execution Overview Signals',
        description:
          'Use Team Data execution-overview to check first-response, quote follow-up, and stalled reminder pressure before changing rule thresholds.',
        href: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.analytics,
          'execution-overview',
        ),
        actionLabel: 'Open execution overview',
      },
      {
        title: 'Pipeline Reminder Signals',
        description:
          'Use Team Data pipeline-funnel to review quote-follow-up and stalled reminder queues before adjusting automation behavior.',
        href: getTradeCrmScopedViewPath(
          tradeCrmRouteMap.analytics,
          'pipeline-funnel',
        ),
        actionLabel: 'Open pipeline funnel',
      },
      {
        title: 'Workspace Governance',
        description:
          'Reminder cadence, ownership expectations, and rollout discipline should remain visible in the shared workspace settings layer.',
        href: getSettingsPath(SettingsPath.Workspace),
        actionLabel: 'Open workspace settings',
      },
      {
        title: 'Automation Boundary',
        description:
          'Phase-one rules may create tasks and reminders, but they must not directly close opportunities or change key business outcomes automatically.',
      },
    ],
  },
  {
    key: 'ai-config',
    label: 'AI Config',
    title: 'AI Control Layer',
    heroTitle: 'Keep AI configuration inside settings while preserving business-state guardrails.',
    heroDescription:
      'AI belongs to the enhancement layer. This workspace keeps provider, prompt, and usage configuration inside the settings shell instead of elevating AI into a first-level business module.',
    cards: [
      {
        title: 'AI Settings',
        description:
          'Provider selection, basic usage settings, and model-level controls live in the existing AI settings pages.',
        href: getSettingsPath(SettingsPath.AI),
        actionLabel: 'Open AI settings',
      },
      {
        title: 'Prompt Governance',
        description:
          'Prompt-level configuration should remain traceable so summaries, suggestions, and drafts stay aligned with phase-one boundaries.',
        href: getSettingsPath(SettingsPath.AIPrompts),
        actionLabel: 'Open prompt settings',
      },
      {
        title: 'Integration Boundary',
        description:
          'AI can summarize, score, and suggest. It must not write key CRM states or replace routing rules owned by business logic.',
      },
      {
        title: 'Operations Linkage',
        description:
          'Trade CRM AI views should continue to consume workspace context from workbench, lead, customer, and opportunity pages rather than introducing a detached AI console.',
      },
    ],
  },
  {
    key: 'integrations',
    label: 'Integrations',
    title: 'Integration Surface',
    heroTitle: 'Expose integration entry points here while keeping orchestration in integration-hub.',
    heroDescription:
      'This settings workspace gathers the visible surfaces for apps, APIs, and domain-level setup. It does not move synchronization pipelines or retry logic into the frontend.',
    cards: [
      {
        title: 'Integrations',
        description:
          'Connected applications and packaged integrations remain discoverable through the standard integrations settings entry.',
        href: getSettingsPath(SettingsPath.Integrations),
        actionLabel: 'Open integrations',
      },
      {
        title: 'API and Webhooks',
        description:
          'Operational endpoints, credentials, and callback registration stay in the API and webhook settings shell.',
        href: getSettingsPath(SettingsPath.ApiWebhooks),
        actionLabel: 'Open APIs & Webhooks',
      },
      {
        title: 'Domains',
        description:
          'Email and public domain configuration remains part of the integration readiness layer for mail and external-facing workflows.',
        href: getSettingsPath(SettingsPath.Domains),
        actionLabel: 'Open domains',
      },
      {
        title: 'Integration Boundary',
        description:
          'External orchestration, retries, dedup, and source synchronization still belong to integration-hub. The settings page only exposes configuration surfaces.',
      },
    ],
  },
];

export const TradeCrmSettingsPage = () => {
  const [searchParams] = useSearchParams();
  const {
    integrationHubApiBaseUrl,
    sellerRiskReminders,
    totalRiskCount,
    loading: riskLoading,
    errorMessage: riskErrorMessage,
  } = useLeadFirstResponseRisk();
  const {
    todayNewLeads,
    totalTodayNewLeadsCount,
    loading: todayNewLeadsLoading,
    hasError: todayNewLeadsError,
  } = useTodayNewLeads();
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
    views: tradeCrmSettingsViews,
    fallbackViewKey: 'fields-dictionaries' satisfies TradeCrmSettingsViewKey,
  });

  const tabs = getTradeCrmPageTabs({
    route: tradeCrmRouteMap.settings,
    views: tradeCrmSettingsViews,
    currentViewKey,
  });
  const firstLeadRiskPreview =
    sellerRiskReminders[0]?.leadName ?? sellerRiskReminders[0]?.email ?? null;
  const firstTodayLeadPreview =
    todayNewLeads[0]?.leadName ??
    todayNewLeads[0]?.contactName ??
    todayNewLeads[0]?.companyName ??
    null;
  const firstQuotePreview =
    quoteFollowUpReminders[0]?.opportunityName ??
    quoteFollowUpReminders[0]?.companyName ??
    null;
  const firstStalledPreview =
    stalledOpportunityReminders[0]?.opportunityName ??
    stalledOpportunityReminders[0]?.companyName ??
    null;
  const todayNewLeadsWorkspaceLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.prospecting,
    'today-new-leads',
  );
  const firstResponseWorkspaceLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.prospecting,
    'first-response-risk',
  );
  const quoteFollowUpWorkspaceLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.opportunities,
    'quotation-follow-up',
  );
  const stalledWorkspaceLink = getTradeCrmScopedViewPath(
    tradeCrmRouteMap.opportunities,
    'stalled',
  );
  const assignmentRulesSource = createTradeCrmRecordSource({
    href: todayNewLeadsWorkspaceLink,
    workspaceKey: 'settings',
    workspaceLabel: 'Settings',
    viewKey: 'assignment-rules',
    viewLabel: 'Assignment Rules',
  });
  const sourcesAndDedupSource = createTradeCrmRecordSource({
    href: firstResponseWorkspaceLink,
    workspaceKey: 'settings',
    workspaceLabel: 'Settings',
    viewKey: 'sources-dedup',
    viewLabel: 'Sources & Dedup',
  });
  const automationRulesSource = createTradeCrmRecordSource({
    href: quoteFollowUpWorkspaceLink,
    workspaceKey: 'settings',
    workspaceLabel: 'Settings',
    viewKey: 'automation-rules',
    viewLabel: 'Automation Rules',
  });
  const stalledAutomationSource = createTradeCrmRecordSource({
    href: stalledWorkspaceLink,
    workspaceKey: 'settings',
    workspaceLabel: 'Settings',
    viewKey: 'automation-rules',
    viewLabel: 'Automation Rules',
  });
  const firstTodayLeadRecordLink = todayNewLeads[0]?.id
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: 'lead',
        objectRecordId: todayNewLeads[0].id,
        source: assignmentRulesSource,
      })
    : undefined;
  const firstLeadRiskRecordLink = sellerRiskReminders[0]?.leadId
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: 'lead',
        objectRecordId: sellerRiskReminders[0].leadId,
        source: sourcesAndDedupSource,
      })
    : undefined;
  const firstQuoteRecordLink = quoteFollowUpReminders[0]?.opportunityId
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: 'opportunity',
        objectRecordId: quoteFollowUpReminders[0].opportunityId,
        source: automationRulesSource,
      })
    : undefined;
  const firstStalledRecordLink = stalledOpportunityReminders[0]?.opportunityId
    ? getTradeCrmRecordPathFromSource({
        objectNameSingular: 'opportunity',
        objectRecordId: stalledOpportunityReminders[0].opportunityId,
        source: stalledAutomationSource,
      })
    : undefined;
  const assignmentPressureDescription = todayNewLeadsLoading
    ? 'Loading current new-lead intake pressure before reviewing routing rules.'
    : todayNewLeadsError
      ? 'Today new lead pressure is temporarily unavailable. Review members and ownership coverage directly.'
      : totalTodayNewLeadsCount > 0
        ? `${totalTodayNewLeadsCount} new leads arrived today. ${firstTodayLeadPreview ? `First visible item: ${firstTodayLeadPreview}. ` : ''}Use this before changing owner routing or coverage rules.`
        : 'No new leads are visible today. Review assignment rules against active coverage rather than queue pressure.';
  const sourceDedupPressureDescription = !integrationHubApiBaseUrl
    ? 'integration-hub is not configured yet, so lead intake and first-response pressure cannot be read here.'
    : riskLoading
      ? 'Loading first-response risk before reviewing source and dedup controls.'
      : riskErrorMessage
        ? 'Lead first-response pressure is temporarily unavailable. Review source and dedup boundaries directly.'
        : totalRiskCount > 0
          ? `${totalRiskCount} leads are currently in first-response risk. ${firstLeadRiskPreview ? `First visible item: ${firstLeadRiskPreview}. ` : ''}Check source quality, routing, and dedup boundaries before changing seller behavior.`
          : 'No first-response risk is currently visible. Keep source naming and dedup boundaries stable.';
  const automationPressureDescription = !integrationHubApiBaseUrl
    ? 'integration-hub is not configured yet, so automation reminder pressure cannot be checked from settings.'
    : quoteFollowUpLoading || stalledLoading
      ? 'Loading quote-follow-up and stalled reminder pressure before rule review.'
      : quoteFollowUpErrorMessage || stalledErrorMessage
        ? 'Reminder pressure is temporarily unavailable. Review automation boundaries through execution views first.'
        : totalQuoteFollowUpReminderCount > 0 ||
            totalStalledOpportunityReminderCount > 0
          ? `${totalQuoteFollowUpReminderCount} quote reminders and ${totalStalledOpportunityReminderCount} stalled reminders are currently visible.${firstQuotePreview ? ` Quote preview: ${firstQuotePreview}.` : ''}${firstStalledPreview ? ` Stalled preview: ${firstStalledPreview}.` : ''} Tune rules only after checking these live queues.`
          : 'No quote-follow-up or stalled reminder pressure is currently visible. Keep automation rules narrow and reviewable.';
  const currentCards =
    currentViewKey === 'assignment-rules'
      ? currentView.cards.map((card) =>
          card.title === 'Workspace Members'
            ? {
                ...card,
                description: assignmentPressureDescription,
                secondaryHref:
                  firstTodayLeadRecordLink ?? todayNewLeadsWorkspaceLink,
                secondaryActionLabel: firstTodayLeadRecordLink
                  ? 'Open first lead record'
                  : 'Open new leads queue',
              }
            : card,
        )
      : currentViewKey === 'sources-dedup'
        ? currentView.cards.map((card) =>
            card.title === 'API and Webhooks'
              ? {
                  ...card,
                  description: sourceDedupPressureDescription,
                  secondaryHref:
                    firstLeadRiskRecordLink ?? firstResponseWorkspaceLink,
                  secondaryActionLabel: firstLeadRiskRecordLink
                    ? 'Open first lead record'
                    : 'Open first-response queue',
                }
              : card,
          )
        : currentViewKey === 'automation-rules'
          ? currentView.cards.map((card) =>
              card.title === 'Execution Overview Signals'
                ? {
                    ...card,
                    description: automationPressureDescription,
                    secondaryHref: firstQuoteRecordLink
                      ? firstQuoteRecordLink
                      : totalStalledOpportunityReminderCount > 0
                        ? firstStalledRecordLink
                        : quoteFollowUpWorkspaceLink,
                    secondaryActionLabel: firstQuoteRecordLink
                      ? 'Open first opportunity'
                      : totalStalledOpportunityReminderCount > 0
                        ? 'Open stalled opportunity'
                        : 'Open reminder queue',
                  }
                : card,
            )
          : currentView.cards;

  return (
    <AdminWorkspaceLayout
      title="Trade CRM Settings"
      heroTitle={currentView.heroTitle}
      heroDescription={currentView.heroDescription}
      tabs={tabs}
      cards={currentCards}
      workspaceContext={{
        workspace: 'Trade CRM Settings',
        channel: 'governance-and-configuration',
        stage: currentView.title,
        summaryText: [
          'Workspace: Trade CRM Settings',
          `Current view: ${currentView.title}`,
          'Scope: fields, stages, routing, sources, automation, AI, integrations.',
          `Today New Leads: ${totalTodayNewLeadsCount}`,
          `Lead First Response Risk: ${totalRiskCount}`,
          `Quote Follow-up Reminders: ${totalQuoteFollowUpReminderCount}`,
          `Stalled Opportunity Reminders: ${totalStalledOpportunityReminderCount}`,
          'Boundary: configuration only; orchestration remains outside the frontend settings shell.',
        ].join('\n'),
      }}
    />
  );
};
