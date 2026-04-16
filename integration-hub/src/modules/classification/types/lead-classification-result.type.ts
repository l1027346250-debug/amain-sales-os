import { LeadIntakeDto } from 'src/modules/lead-intake/dto/lead-intake.dto';

export type LeadClassificationResult = {
  strategy: 'pass_through' | 'normalize_and_fallback';
  normalizedPayload: LeadIntakeDto;
  normalizedSource: string;
  normalizedCountry: string;
  normalizedProductCategory: string;
  reason: string;
};
