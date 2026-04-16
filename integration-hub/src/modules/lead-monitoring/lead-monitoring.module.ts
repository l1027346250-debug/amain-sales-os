import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LeadMonitoringController } from 'src/modules/lead-monitoring/lead-monitoring.controller';
import { LeadMonitoringService } from 'src/modules/lead-monitoring/lead-monitoring.service';
import { TwentyClientModule } from 'src/modules/twenty-client/twenty-client.module';

@Module({
  imports: [ConfigModule, TwentyClientModule],
  controllers: [LeadMonitoringController],
  providers: [LeadMonitoringService],
  exports: [LeadMonitoringService],
})
export class LeadMonitoringModule {}
