import { Injectable } from '@nestjs/common';

type AssistantContext =
  | 'workbench'
  | 'mail'
  | 'lead'
  | 'company'
  | 'people'
  | 'opportunity'
  | 'task'
  | 'general';

type GenerateType = 'summary' | 'next_action' | 'draft' | 'lead_score';

type WorkspaceContext = {
  workspace?: string;
  entityType?: string;
  entityId?: string;
  ownerId?: string;
  channel?: string;
  stage?: string;
  pathname?: string;
  summaryText?: string;
};

type SuggestionRequest = {
  context?: string | null;
  workspaceContext?: WorkspaceContext | null;
};

type GenerateRequest = {
  type?: GenerateType;
  text?: string;
  prompt?: string;
  metadata?: Record<string, unknown>;
  workspaceContext?: WorkspaceContext | null;
};

type SuggestionItem = {
  id: string;
  label: string;
  type: GenerateType;
  prompt: string;
};

@Injectable()
export class AiAssistantService {
  getCapabilities() {
    return {
      service: 'trade-crm-ai-assistant',
      version: 'phase1',
      boundaries: [
        'AI only returns suggestion, summary, draft, and scoring output.',
        'AI does not directly update lead, customer, opportunity, or task critical statuses.',
      ],
      objectCoverage: ['mail', 'lead', 'company', 'people', 'opportunity', 'task'],
      actionPolicy: {
        stateMutationAllowed: false,
        allowedGenerateTypes: [
          'summary',
          'next_action',
          'draft',
          'lead_score',
        ],
      },
      capabilities: [
        {
          key: 'summary',
          description: 'Summarize notes, queues, and record context.',
        },
        {
          key: 'next_action',
          description: 'Recommend the next seller action with rationale.',
        },
        {
          key: 'draft',
          description: 'Generate outreach or follow-up draft content.',
        },
        {
          key: 'lead_score',
          description: 'Generate explainable lead-priority scoring output.',
        },
      ],
    };
  }

  buildSuggestions(payload?: SuggestionRequest) {
    const workspaceContext = this.resolveWorkspaceContext(
      payload?.workspaceContext,
    );
    const normalizedContext = this.normalizeContext(
      payload?.context,
      workspaceContext,
    );
    const suggestions = this.getSuggestionTemplates(
      normalizedContext,
      workspaceContext,
    );

    return {
      context: normalizedContext,
      workspaceContext,
      description: this.buildWorkspaceDescription(
        normalizedContext,
        workspaceContext,
      ),
      assistantEntry: {
        stateMutationAllowed: false,
        allowedGenerateTypes: [
          'summary',
          'next_action',
          'draft',
          'lead_score',
        ],
      },
      suggestions,
      generatedAt: new Date().toISOString(),
    };
  }

  generate(payload: GenerateRequest) {
    const workspaceContext = this.resolveWorkspaceContext(
      payload.workspaceContext,
    );
    const metadata = {
      ...(payload.metadata ?? {}),
      ...workspaceContext,
    };
    const context = this.normalizeContext(undefined, workspaceContext);
    const type: GenerateType = payload.type ?? 'next_action';
    const prompt = (payload.prompt ?? '').trim();
    const sourceText = (
      payload.text ??
      workspaceContext.summaryText ??
      ''
    ).trim();
    const fallbackText = sourceText.length > 0 ? sourceText : prompt;

    if (type === 'summary') {
      return {
        type,
        context,
        result: {
          title: `${this.getContextLabel(context)} brief`,
          summary: this.buildSummary(fallbackText, workspaceContext),
          focus: this.getSummaryFocus(context, workspaceContext),
          confidence: sourceText.length > 0 ? 0.78 : 0.58,
        },
      };
    }

    if (type === 'draft') {
      return {
        type,
        context,
        result: this.buildDraft(context, workspaceContext),
      };
    }

    if (type === 'lead_score') {
      const score = this.computeLeadScore(fallbackText, metadata);

      return {
        type,
        context,
        result: {
          score,
          level: score >= 80 ? 'A' : score >= 60 ? 'B' : 'C',
          reason:
            score >= 80
              ? 'High buying intent and better qualification completeness are both present.'
              : score >= 60
                ? 'Intent is usable but still needs qualification and follow-up discipline.'
                : 'Intent signals are still weak; qualify before escalating seller effort.',
          factors: this.buildLeadScoreFactors(fallbackText, metadata),
        },
      };
    }

    return {
      type: 'next_action',
      context,
      result: {
        title: `${this.getContextLabel(context)} next actions`,
        actions: this.buildNextActions(context, workspaceContext),
        rationale: this.buildNextActionRationale(context, workspaceContext),
        confidence: sourceText.length > 0 ? 0.8 : 0.66,
      },
    };
  }

  private resolveWorkspaceContext(
    workspaceContext?: WorkspaceContext | null,
  ): WorkspaceContext {
    return {
      workspace: workspaceContext?.workspace ?? 'Trade CRM',
      entityType: workspaceContext?.entityType ?? undefined,
      entityId: workspaceContext?.entityId ?? undefined,
      ownerId: workspaceContext?.ownerId ?? undefined,
      channel: workspaceContext?.channel ?? undefined,
      stage: workspaceContext?.stage ?? undefined,
      pathname: workspaceContext?.pathname ?? undefined,
      summaryText: workspaceContext?.summaryText ?? undefined,
    };
  }

  private normalizeContext(
    context?: string | null,
    workspaceContext?: WorkspaceContext,
  ): AssistantContext {
    const value = [
      context,
      workspaceContext?.workspace,
      workspaceContext?.entityType,
      workspaceContext?.channel,
      workspaceContext?.stage,
      workspaceContext?.pathname,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (value.includes('workbench')) return 'workbench';
    if (value.includes('mail') || value.includes('email') || value.includes('inbox')) {
      return 'mail';
    }
    if (value.includes('lead')) return 'lead';
    if (value.includes('company') || value.includes('customer')) return 'company';
    if (value.includes('people') || value.includes('contact')) return 'people';
    if (value.includes('opportunity') || value.includes('pipeline')) {
      return 'opportunity';
    }
    if (value.includes('task')) return 'task';

    return 'general';
  }

  private getSuggestionTemplates(
    context: AssistantContext,
    workspaceContext: WorkspaceContext,
  ): SuggestionItem[] {
    const workspaceLabel = workspaceContext.workspace ?? 'Trade CRM';
    const entityLabel =
      workspaceContext.entityType ?? this.getContextLabel(context);
    const stageLabel = workspaceContext.stage ?? 'current stage';
    const channelLabel = workspaceContext.channel ?? 'current channel';

    const byContext: Record<AssistantContext, SuggestionItem[]> = {
      workbench: [
        {
          id: 'workbench-summary',
          label: 'Generate queue summary',
          type: 'summary',
          prompt: `Summarize what the seller should move first in ${workspaceLabel}.`,
        },
        {
          id: 'workbench-next-action',
          label: 'Recommend today priority',
          type: 'next_action',
          prompt: `Recommend the best execution order for today's workbench queues in ${workspaceLabel}.`,
        },
        {
          id: 'workbench-draft',
          label: 'Draft a first follow-up',
          type: 'draft',
          prompt: `Draft a short first follow-up message for the most urgent queue in ${workspaceLabel}.`,
        },
      ],
      mail: [
        {
          id: 'mail-summary',
          label: 'Summarize reply pressure',
          type: 'summary',
          prompt: `Summarize reply pressure, follow-up urgency, and CRM linkage gaps in ${workspaceLabel}.`,
        },
        {
          id: 'mail-next-action',
          label: 'Recommend reply order',
          type: 'next_action',
          prompt: `Recommend the best reply and follow-up order for ${workspaceLabel}.`,
        },
        {
          id: 'mail-draft',
          label: 'Draft email follow-up',
          type: 'draft',
          prompt: `Draft a seller email follow-up for ${channelLabel}.`,
        },
      ],
      lead: [
        {
          id: 'lead-summary',
          label: 'Summarize lead context',
          type: 'summary',
          prompt: `Summarize the current lead and highlight qualification gaps for ${entityLabel}.`,
        },
        {
          id: 'lead-score',
          label: 'Score this lead',
          type: 'lead_score',
          prompt: `Explain the lead priority score for ${entityLabel}.`,
        },
        {
          id: 'lead-draft',
          label: 'Draft first reply',
          type: 'draft',
          prompt: `Draft the first reply for this lead through ${channelLabel}.`,
        },
      ],
      company: [
        {
          id: 'company-summary',
          label: 'Summarize account health',
          type: 'summary',
          prompt: `Summarize account health and contact coverage for ${entityLabel}.`,
        },
        {
          id: 'company-next-action',
          label: 'Recommend account action',
          type: 'next_action',
          prompt: `Recommend the next account-management action for ${entityLabel}.`,
        },
        {
          id: 'company-draft',
          label: 'Draft account follow-up',
          type: 'draft',
          prompt: `Draft an account follow-up message for ${entityLabel}.`,
        },
      ],
      people: [
        {
          id: 'people-summary',
          label: 'Summarize contact role',
          type: 'summary',
          prompt: `Summarize this contact's role, likely influence, and communication angle.`,
        },
        {
          id: 'people-next-action',
          label: 'Recommend contact action',
          type: 'next_action',
          prompt: `Recommend the next communication move for this contact.`,
        },
        {
          id: 'people-draft',
          label: 'Draft contact outreach',
          type: 'draft',
          prompt: `Draft a contact outreach message for ${channelLabel}.`,
        },
      ],
      opportunity: [
        {
          id: 'opportunity-summary',
          label: 'Summarize deal risk',
          type: 'summary',
          prompt: `Summarize the current deal risk, blockers, and commercial context at ${stageLabel}.`,
        },
        {
          id: 'opportunity-next-action',
          label: 'Recommend next deal step',
          type: 'next_action',
          prompt: `Recommend the next deal step for an opportunity currently at ${stageLabel}.`,
        },
        {
          id: 'opportunity-draft',
          label: 'Draft quote follow-up',
          type: 'draft',
          prompt: `Draft a quote or stage follow-up message for an opportunity at ${stageLabel}.`,
        },
      ],
      task: [
        {
          id: 'task-summary',
          label: 'Summarize task pressure',
          type: 'summary',
          prompt: `Summarize the current task queue and identify pressure points.`,
        },
        {
          id: 'task-next-action',
          label: 'Prioritize tasks',
          type: 'next_action',
          prompt: `Recommend the best order to process today's task queue.`,
        },
        {
          id: 'task-draft',
          label: 'Draft task follow-up',
          type: 'draft',
          prompt: `Draft the follow-up needed to close the most urgent task.`,
        },
      ],
      general: [
        {
          id: 'general-summary',
          label: 'Summarize current page',
          type: 'summary',
          prompt: `Summarize the current ${workspaceLabel} context.`,
        },
        {
          id: 'general-next-action',
          label: 'Recommend next action',
          type: 'next_action',
          prompt: `Recommend the next seller action from the current ${workspaceLabel} context.`,
        },
        {
          id: 'general-draft',
          label: 'Draft follow-up',
          type: 'draft',
          prompt: `Draft a seller follow-up based on the current ${workspaceLabel} context.`,
        },
      ],
    };

    return byContext[context];
  }

  private buildWorkspaceDescription(
    context: AssistantContext,
    workspaceContext: WorkspaceContext,
  ) {
    const workspace = workspaceContext.workspace ?? 'Trade CRM';
    const entity = workspaceContext.entityType
      ? ` for the current ${workspaceContext.entityType}`
      : '';

    return `${this.getContextLabel(
      context,
    )} AI is active in ${workspace}${entity}. It can summarize, recommend next actions, draft follow-up content, and explain lead scoring without changing business status.`;
  }

  private buildSummary(sourceText: string, workspaceContext: WorkspaceContext) {
    const scope = workspaceContext.workspace ?? 'Trade CRM';
    const entity = workspaceContext.entityType ?? 'record';
    const stageNote = workspaceContext.stage
      ? ` Current stage or focus: ${workspaceContext.stage}.`
      : '';

    if (sourceText.length > 0) {
      return `Summary for ${scope} / ${entity}: ${sourceText.slice(0, 220)}.${stageNote}`;
    }

    return `Summary for ${scope} / ${entity}: no raw conversation or note text was provided, so the brief is based on page context only.${stageNote}`;
  }

  private getSummaryFocus(
    context: AssistantContext,
    workspaceContext: WorkspaceContext,
  ) {
    if (context === 'workbench') {
      return 'Queue priority, SLA pressure, and the next seller move.';
    }

    if (context === 'lead') {
      return 'Intent, qualification completeness, and first-response readiness.';
    }

    if (context === 'mail') {
      return 'Reply urgency, CRM linkage, and the next email follow-up move.';
    }

    if (context === 'opportunity') {
      return `Deal progression, blockers, and stage discipline${workspaceContext.stage ? ` at ${workspaceContext.stage}` : ''}.`;
    }

    if (context === 'company' || context === 'people') {
      return 'Customer coverage, communication continuity, and ownership clarity.';
    }

    return 'Current workspace signal, follow-up gaps, and recommended next move.';
  }

  private buildDraft(
    context: AssistantContext,
    workspaceContext: WorkspaceContext,
  ) {
    const workspace = workspaceContext.workspace ?? 'Trade CRM';
    const channel = workspaceContext.channel ?? 'email';
    const stage = workspaceContext.stage ?? 'current stage';

    if (context === 'opportunity') {
      return {
        subject: `Follow-up on ${stage}`,
        body: [
          'Hello,',
          '',
          `I am following up on the current ${stage.toLowerCase()} discussion.`,
          'We can align on final specifications, quantity, delivery timing, and any open commercial questions so the next step does not stall.',
          '',
          'Please let me know the remaining blockers and the best time to close the next action.',
          '',
          'Best regards,',
        ].join('\n'),
        channel,
        confidence: 0.76,
      };
    }

    if (context === 'mail') {
      return {
        subject: `Follow-up from ${workspace}`,
        body: [
          'Hello,',
          '',
          'I am following up on our recent discussion and would like to keep the next step moving.',
          'We can confirm the required model, quantity, lead time, quotation details, and any open commercial questions in one reply.',
          '',
          'Please let me know the remaining questions or the best time to continue.',
          '',
          'Best regards,',
        ].join('\n'),
        channel,
        confidence: 0.77,
      };
    }

    if (context === 'lead') {
      return {
        subject: 'Follow-up on your inquiry',
        body: [
          'Hello,',
          '',
          'Thank you for your inquiry. We can share specifications, MOQ, lead time, and the best-fit model recommendation based on your requirement.',
          '',
          'Please confirm your target product, quantity, and destination market so we can reply with an accurate commercial proposal today.',
          '',
          'Best regards,',
        ].join('\n'),
        channel,
        confidence: 0.74,
      };
    }

    return {
      subject: `${workspace} follow-up`,
      body: [
        'Hello,',
        '',
        'I am following up on the current discussion and would like to keep the next step moving.',
        'Please let me know the remaining questions, target timing, and any information needed from our side.',
        '',
        'Best regards,',
      ].join('\n'),
      channel,
      confidence: 0.7,
    };
  }

  private buildNextActions(
    context: AssistantContext,
    workspaceContext: WorkspaceContext,
  ) {
    if (context === 'workbench') {
      return [
        'Handle first-response risk before any lower-urgency account work.',
        'Clear tasks due today and add missing next actions on open deals.',
        'Review fresh leads last so new inbound volume is qualified on the same day.',
      ];
    }

    if (context === 'lead') {
      return [
        'Confirm decision maker, product scope, quantity, and target timeline.',
        'Send the first commercial reply with MOQ, lead time, and the best-fit model.',
        'Create a follow-up checkpoint within 24 to 48 hours if no reply arrives.',
      ];
    }

    if (context === 'mail') {
      return [
        'Reply to the threads that block quotation, sample, or decision timing first.',
        'Tie each important thread back to its customer or opportunity context before sending.',
        'Create an explicit follow-up checkpoint instead of leaving the thread in passive inbox state.',
      ];
    }

    if (context === 'opportunity') {
      return [
        'Clarify the blocker preventing stage progression.',
        `Update the next action and next action date for ${workspaceContext.stage ?? 'the current deal stage'}.`,
        'Push one explicit commercial move instead of leaving the deal in passive monitoring.',
      ];
    }

    if (context === 'company' || context === 'people') {
      return [
        'Check whether customer coverage is still active across key contacts.',
        'Identify the last meaningful communication gap and schedule a follow-up.',
        'Tie the next customer action to an open opportunity or renewal signal.',
      ];
    }

    return [
      'Summarize the current context before taking action.',
      'Choose one clear next step with an owner and a date.',
      'Avoid changing business status until the seller confirms the action manually.',
    ];
  }

  private buildNextActionRationale(
    context: AssistantContext,
    workspaceContext: WorkspaceContext,
  ) {
    if (context === 'opportunity') {
      return `Open opportunities should not stay at ${workspaceContext.stage ?? 'the current stage'} without a visible commercial next step.`;
    }

    if (context === 'lead') {
      return 'Lead handling should compress qualification, first response, and the next checkpoint into one execution chain.';
    }

    if (context === 'workbench') {
      return 'The workbench exists to reduce seller decision overhead and keep SLA-sensitive queues visible first.';
    }

    if (context === 'mail') {
      return 'Mail should operate as a CRM communication desk, not as an isolated inbox without customer and opportunity context.';
    }

    return 'AI guidance should tighten execution order without taking ownership of critical business state.';
  }

  private buildLeadScoreFactors(
    text: string,
    metadata?: Record<string, unknown>,
  ) {
    const factors: string[] = [];
    const normalizedText = text.toLowerCase();
    const hasCountryInText = this.hasStructuredFieldValue(normalizedText, 'country');
    const hasCategoryInText = this.hasStructuredFieldValue(
      normalizedText,
      'product category',
    );
    const hasSourceInText = this.hasStructuredFieldValue(normalizedText, 'source');

    if (normalizedText.includes('quote') || normalizedText.includes('price')) {
      factors.push('Commercial intent words are present.');
    }

    if (normalizedText.includes('sample')) {
      factors.push('Sample request suggests evaluation intent.');
    }

    if (normalizedText.includes('urgent')) {
      factors.push('Urgency signal detected.');
    }

    if (
      (metadata?.source &&
        String(metadata.source).toLowerCase().includes('alibaba')) ||
      normalizedText.includes('source: alibaba')
    ) {
      factors.push('Lead source is Alibaba, which is included in phase-one weighting.');
    }

    if (metadata?.country || hasCountryInText) {
      factors.push('Country information is present.');
    }

    if (metadata?.productCategory || hasCategoryInText) {
      factors.push('Product category is present.');
    }

    if (hasSourceInText && !factors.includes('Lead source is Alibaba, which is included in phase-one weighting.')) {
      factors.push('Lead source context is present.');
    }

    return factors.length > 0 ? factors : ['Limited structured buying signal was provided.'];
  }

  private getContextLabel(context: AssistantContext) {
    const labels: Record<AssistantContext, string> = {
      workbench: 'Workbench',
      mail: 'Mail',
      lead: 'Lead',
      company: 'Company',
      people: 'Contact',
      opportunity: 'Opportunity',
      task: 'Task',
      general: 'Workspace',
    };

    return labels[context];
  }

  private computeLeadScore(
    text: string,
    metadata?: Record<string, unknown>,
  ): number {
    let score = 50;
    const normalizedText = text.toLowerCase();

    if (normalizedText.length > 160) score += 8;
    if (normalizedText.includes('quote')) score += 10;
    if (normalizedText.includes('price')) score += 8;
    if (normalizedText.includes('sample')) score += 8;
    if (normalizedText.includes('urgent')) score += 10;

    if (metadata && typeof metadata === 'object') {
      const source = String(metadata.source ?? '').toLowerCase();
      const hasCountry = Boolean(metadata.country);
      const hasCategory = Boolean(metadata.productCategory);
      const hasCountryInText = this.hasStructuredFieldValue(normalizedText, 'country');
      const hasCategoryInText = this.hasStructuredFieldValue(
        normalizedText,
        'product category',
      );

      if (source.includes('alibaba')) score += 6;
      if (hasCountry || hasCountryInText) score += 4;
      if (hasCategory || hasCategoryInText) score += 4;
    }

    return Math.max(0, Math.min(100, score));
  }

  private hasStructuredFieldValue(text: string, fieldLabel: string) {
    const escapedFieldLabel = fieldLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fieldPattern = new RegExp(
      `${escapedFieldLabel}:\\s*[^\\n]+`,
      'i',
    );

    return fieldPattern.test(text);
  }
}
