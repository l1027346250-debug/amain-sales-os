import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
  UseFilters,
} from '@nestjs/common';

import { RestApiExceptionFilter } from 'src/engine/api/rest/rest-api-exception.filter';
import { ReceiveEnterpriseWebsiteInquiryDto } from 'src/modules/enterprise/independent-station/dtos/receive-enterprise-website-inquiry.dto';
import { EnterpriseIndependentStationService } from 'src/modules/enterprise/independent-station/services/enterprise-independent-station.service';

@Controller('webhooks/independent-station')
@UseFilters(RestApiExceptionFilter)
export class EnterpriseIndependentStationWebhookController {
  constructor(
    private readonly enterpriseIndependentStationService: EnterpriseIndependentStationService,
  ) {}

  @Post(':tenantKey/inquiries')
  async receiveInquiry(
    @Param('tenantKey') tenantKey: string,
    @Body() dto: ReceiveEnterpriseWebsiteInquiryDto,
    @Headers('x-enterprise-webhook-secret') webhookSecret?: string,
  ) {
    return this.enterpriseIndependentStationService.receiveInquiry(
      tenantKey,
      dto,
      webhookSecret,
    );
  }
}