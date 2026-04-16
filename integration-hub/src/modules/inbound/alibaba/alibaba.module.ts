import { Module } from '@nestjs/common';

import { LeadIntakeModule } from 'src/modules/lead-intake/lead-intake.module';
import { AlibabaLeadIntakeMapperService } from 'src/modules/inbound/alibaba/alibaba-lead-intake-mapper.service';
import { AlibabaController } from 'src/modules/inbound/alibaba/alibaba.controller';
import { AlibabaService } from 'src/modules/inbound/alibaba/alibaba.service';

@Module({
  imports: [LeadIntakeModule],
  controllers: [AlibabaController],
  providers: [AlibabaLeadIntakeMapperService, AlibabaService],
})
export class AlibabaModule {}
