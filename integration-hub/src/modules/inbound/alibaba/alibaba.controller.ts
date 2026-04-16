import { Body, Controller, Headers, Post } from '@nestjs/common';

import { AlibabaLeadDto } from 'src/modules/inbound/alibaba/dto/alibaba-lead.dto';
import { AlibabaService } from 'src/modules/inbound/alibaba/alibaba.service';

@Controller('ingest/alibaba')
export class AlibabaController {
  constructor(private readonly alibabaService: AlibabaService) {}

  @Post('leads')
  async ingestLead(
    @Body() payload: AlibabaLeadDto,
    @Headers('x-alibaba-signature') signature?: string,
  ) {
    return this.alibabaService.ingestLead(
      {
        ...payload,
        message: payload.message,
      },
      signature,
    );
  }
}
