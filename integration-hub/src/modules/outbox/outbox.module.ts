import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { OutboxController } from 'src/modules/outbox/outbox.controller';
import { OutboxService } from 'src/modules/outbox/outbox.service';

@Module({
  imports: [ConfigModule],
  controllers: [OutboxController],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}
