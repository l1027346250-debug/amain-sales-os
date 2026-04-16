import { Body, Controller, Post } from '@nestjs/common';

import { LeadIntakeDto } from 'src/modules/lead-intake/dto/lead-intake.dto';
import { LeadIntakeService } from 'src/modules/lead-intake/lead-intake.service';

@Controller('ingest')
export class LeadIntakeController {
  constructor(private readonly leadIntakeService: LeadIntakeService) {}

  @Post('leads')
  async ingestLead(@Body() payload: LeadIntakeDto) {
    return this.leadIntakeService.ingestLead(payload);
  }
}
