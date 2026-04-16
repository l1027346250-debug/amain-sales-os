import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IntegrationHubEnv } from 'src/config/env';
import { LeadAssignmentDecision } from 'src/modules/lead-intake/types/lead-assignment-decision.type';

type LeadAssignmentRule = {
  id: string;
  matchField: 'productCategory' | 'country';
  matchValue: string;
  assigneeId: string;
};

@Injectable()
export class RoutingService {
  constructor(
    private readonly configService: ConfigService<IntegrationHubEnv, true>,
  ) {}

  resolveLeadAssignment(payload: {
    productCategory?: string;
    country?: string;
  }): LeadAssignmentDecision {
    const normalizedProductCategory = this.normalizeValue(payload.productCategory);
    const normalizedCountry = this.normalizeValue(payload.country);
    const rules = this.getRules();

    const productCategoryRule = rules.find(
      (rule) =>
        rule.matchField === 'productCategory' &&
        normalizedProductCategory !== null &&
        rule.matchValue === normalizedProductCategory,
    );

    if (productCategoryRule) {
      return {
        status: 'assigned',
        strategy: 'product_category',
        assigneeId: productCategoryRule.assigneeId,
        ruleId: productCategoryRule.id,
        matchedField: 'productCategory',
        matchedValue: normalizedProductCategory,
        reason:
          'Matched product category assignment rule; this remains the primary phase-one routing rule.',
      };
    }

    const countryRule = rules.find(
      (rule) =>
        rule.matchField === 'country' &&
        normalizedCountry !== null &&
        rule.matchValue === normalizedCountry,
    );

    if (countryRule) {
      return {
        status: 'assigned',
        strategy: 'country',
        assigneeId: countryRule.assigneeId,
        ruleId: countryRule.id,
        matchedField: 'country',
        matchedValue: normalizedCountry,
        reason:
          'Matched country assignment rule because no product category rule applied.',
      };
    }

    const defaultAssigneeId =
      this.configService.get('LEAD_ASSIGNMENT_DEFAULT_ASSIGNEE_ID', {
        infer: true,
      }) ?? null;

    if (defaultAssigneeId) {
      return {
        status: 'assigned',
        strategy: 'default',
        assigneeId: defaultAssigneeId,
        ruleId: 'default-assignee',
        matchedField: null,
        matchedValue: null,
        reason:
          'No explicit product category or country rule matched, so the default assignee was used.',
      };
    }

    return {
      status: 'unassigned',
      strategy: 'unassigned',
      assigneeId: null,
      ruleId: null,
      matchedField: null,
      matchedValue: null,
      reason:
        'No routing rule matched and no default assignee is configured, so the lead stays unassigned.',
    };
  }

  private getRules(): LeadAssignmentRule[] {
    const rawRules =
      this.configService.get('LEAD_ASSIGNMENT_RULES_JSON', {
        infer: true,
      }) ?? null;

    if (!rawRules) {
      return [];
    }

    const parsed = JSON.parse(rawRules) as Array<{
      id?: string;
      matchField?: string;
      matchValue?: string;
      assigneeId?: string;
    }>;

    return parsed
      .filter(
        (rule): rule is {
          id?: string;
          matchField: 'productCategory' | 'country';
          matchValue: string;
          assigneeId: string;
        } =>
          (rule.matchField === 'productCategory' ||
            rule.matchField === 'country') &&
          typeof rule.matchValue === 'string' &&
          rule.matchValue.trim().length > 0 &&
          typeof rule.assigneeId === 'string' &&
          rule.assigneeId.trim().length > 0,
      )
      .map((rule, index) => ({
        id: rule.id?.trim() || `${rule.matchField}-${index + 1}`,
        matchField: rule.matchField,
        matchValue: this.normalizeValue(rule.matchValue) ?? '',
        assigneeId: rule.assigneeId.trim(),
      }))
      .filter((rule) => rule.matchValue.length > 0);
  }

  private normalizeValue(value?: string) {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ');

    return normalized.length > 0 ? normalized : null;
  }
}
