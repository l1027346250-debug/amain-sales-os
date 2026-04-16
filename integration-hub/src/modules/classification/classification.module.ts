import { Module } from '@nestjs/common';

import { ClassificationService } from 'src/modules/classification/classification.service';

@Module({
  providers: [ClassificationService],
  exports: [ClassificationService],
})
export class ClassificationModule {}
