import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RoutingService } from 'src/modules/routing/routing.service';

@Module({
  imports: [ConfigModule],
  providers: [RoutingService],
  exports: [RoutingService],
})
export class RoutingModule {}
