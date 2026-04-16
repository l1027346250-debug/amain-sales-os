import { Module } from '@nestjs/common';

import { AiAssistantController } from 'src/modules/ai-assistant/ai-assistant.controller';
import { AiAssistantService } from 'src/modules/ai-assistant/ai-assistant.service';

@Module({
  controllers: [AiAssistantController],
  providers: [AiAssistantService],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
