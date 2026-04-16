import { Injectable } from '@nestjs/common';

import { LeadClassificationResult } from 'src/modules/classification/types/lead-classification-result.type';
import { LeadIntakeDto } from 'src/modules/lead-intake/dto/lead-intake.dto';

@Injectable()
export class ClassificationService {
  classifyLead(payload: LeadIntakeDto): LeadClassificationResult {
    const normalizedSource = this.normalizeToken(payload.source) ?? 'OTHER';
    const normalizedCountry = this.normalizeToken(payload.country) ?? 'OTHER';
    const normalizedProductCategory =
      this.normalizeToken(payload.productCategory) ??
      this.normalizeToken(payload.interestedProduct) ??
      'OTHER';

    return {
      strategy:
        normalizedCountry === 'OTHER' || normalizedProductCategory === 'OTHER'
          ? 'normalize_and_fallback'
          : 'pass_through',
      normalizedPayload: {
        ...payload,
        source: normalizedSource,
        country: normalizedCountry,
        productCategory: normalizedProductCategory,
      },
      normalizedSource,
      normalizedCountry,
      normalizedProductCategory,
      reason:
        normalizedCountry === 'OTHER' || normalizedProductCategory === 'OTHER'
          ? 'Normalized intake values and applied phase-one fallback buckets where source data was incomplete.'
          : 'Normalized intake values without needing fallback buckets.',
    };
  }

  private normalizeToken(value?: string | null) {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return null;
    }

    return trimmed.toUpperCase().replace(/\s+/g, '_');
  }
}
