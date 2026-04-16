import { Module } from '@nestjs/common';

import { TwentyClientService } from 'src/modules/twenty-client/twenty-client.service';

@Module({
  providers: [TwentyClientService],
  exports: [TwentyClientService],
})
export class TwentyClientModule {}
