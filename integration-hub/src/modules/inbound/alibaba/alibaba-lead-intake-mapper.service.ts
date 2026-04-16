import { Injectable } from '@nestjs/common';

import { AlibabaLeadDto } from 'src/modules/inbound/alibaba/dto/alibaba-lead.dto';
import { LeadIntakeDto } from 'src/modules/lead-intake/dto/lead-intake.dto';

@Injectable()
export class AlibabaLeadIntakeMapperService {
  toLeadIntakeDto(payload: AlibabaLeadDto): LeadIntakeDto {
    return {
      externalId: payload.inquiryId,
      source: 'ALIBABA_INQUIRY',
      leadName: payload.leadName,
      contactName: payload.contactName,
      companyName: payload.companyName,
      email: payload.email,
      phone: payload.phone,
      country: payload.country,
      productCategory: payload.productCategory,
      interestedProduct: payload.productCategory,
      message: payload.message,
    };
  }
}
