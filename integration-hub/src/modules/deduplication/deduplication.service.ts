import { Injectable } from '@nestjs/common';

import { LeadDeduplicationInput } from 'src/modules/deduplication/types/lead-deduplication-input.type';
import { LeadMatchResult } from 'src/modules/deduplication/types/lead-match-result.type';

@Injectable()
export class DeduplicationService {
  evaluateLead(payload: LeadDeduplicationInput): LeadMatchResult {
    const normalizedEmail = this.normalizeEmail(payload.email);
    const normalizedPhone = this.normalizePhone(payload.phone);
    const normalizedCompanyContact = this.normalizeCompanyContact(
      payload.companyName,
      payload.contactName,
    );
    const inputProfile = this.buildInputProfile({
      normalizedEmail,
      normalizedPhone,
      normalizedCompanyContact,
    });

    if (normalizedEmail) {
      return {
        strategy: 'email',
        score: 0.95,
        confidence: 'high',
        recommendedAction: 'merge_or_update',
        inputProfile,
        matchedOn: [
          {
            field: 'email',
            normalizedValue: normalizedEmail,
          },
        ],
        reason:
          'Normalized email is the primary phase-1 deduplication key and can be used for direct lead upsert.',
        reviewSummary:
          'Use normalized email as the primary merge key. This intake can usually continue as an upsert candidate.',
      };
    }

    if (normalizedPhone) {
      return {
        strategy: 'phone',
        score: 0.8,
        confidence: 'medium',
        recommendedAction: 'review_before_merge',
        inputProfile,
        matchedOn: [
          {
            field: 'phone',
            normalizedValue: normalizedPhone,
          },
        ],
        reason:
          'Normalized phone is the fallback phase-1 deduplication key; it is strong enough to surface a merge candidate but should still be reviewed.',
        reviewSummary:
          'Phone matched as a fallback key. Keep this in the manual review path before merging or overwriting ownership.',
      };
    }

    if (normalizedCompanyContact) {
      return {
        strategy: 'company-contact',
        score: 0.55,
        confidence: 'low',
        recommendedAction: 'review_before_merge',
        inputProfile,
        matchedOn: [
          {
            field: 'company-contact',
            normalizedValue: normalizedCompanyContact,
          },
        ],
        reason:
          'Normalized company plus contact name is only a weak fallback signal and should be treated as a manual review candidate.',
        reviewSummary:
          'Company plus contact name is only a weak collision signal. Do not auto-merge; keep this as a review candidate.',
      };
    }

    return {
      strategy: 'none',
      score: 0,
      confidence: 'none',
      recommendedAction: 'create_new',
      inputProfile,
      matchedOn: [],
      reason:
        'No reliable phase-1 deduplication key was provided, so the intake path should treat this record as a new lead candidate.',
      reviewSummary:
        'No stable deduplication key was found. Treat this intake as a new lead candidate unless later checks provide stronger evidence.',
    };
  }

  private buildInputProfile({
    normalizedEmail,
    normalizedPhone,
    normalizedCompanyContact,
  }: {
    normalizedEmail: string | null;
    normalizedPhone: string | null;
    normalizedCompanyContact: string | null;
  }) {
    return {
      hasEmail: normalizedEmail !== null,
      hasPhone: normalizedPhone !== null,
      hasCompanyContact: normalizedCompanyContact !== null,
      primaryKey:
        normalizedEmail !== null
          ? 'email'
          : normalizedPhone !== null
            ? 'phone'
            : normalizedCompanyContact !== null
              ? 'company-contact'
              : 'none',
    } as const;
  }

  private normalizeEmail(value?: string) {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toLowerCase();

    return normalized.length > 0 ? normalized : null;
  }

  private normalizePhone(value?: string) {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.replace(/[^\d+]/g, '').trim();

    return normalized.length > 0 ? normalized : null;
  }

  private normalizeCompanyContact(companyName?: string, contactName?: string) {
    const normalizedCompany = this.normalizeFreeText(companyName);
    const normalizedContact = this.normalizeFreeText(contactName);

    if (!normalizedCompany || !normalizedContact) {
      return null;
    }

    return `${normalizedCompany}::${normalizedContact}`;
  }

  private normalizeFreeText(value?: string) {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ');

    return normalized.length > 0 ? normalized : null;
  }
}
