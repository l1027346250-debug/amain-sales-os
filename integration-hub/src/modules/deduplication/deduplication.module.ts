import { Module } from '@nestjs/common';

import { DeduplicationService } from 'src/modules/deduplication/deduplication.service';

@Module({
  providers: [DeduplicationService],
  exports: [DeduplicationService],
})
export class DeduplicationModule {}
