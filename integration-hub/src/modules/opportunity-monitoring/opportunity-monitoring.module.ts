import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { OpportunityMonitoringController } from 'src/modules/opportunity-monitoring/opportunity-monitoring.controller';
import { OpportunityMonitoringService } from 'src/modules/opportunity-monitoring/opportunity-monitoring.service';
import { TwentyClientModule } from 'src/modules/twenty-client/twenty-client.module';

@Module({
  imports: [ConfigModule, TwentyClientModule],
  controllers: [OpportunityMonitoringController],
  providers: [OpportunityMonitoringService],
  exports: [OpportunityMonitoringService],
})
export class OpportunityMonitoringModule {}
