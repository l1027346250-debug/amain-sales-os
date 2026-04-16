import { Body, Controller, Get, Post } from '@nestjs/common';

import { AiAssistantService } from 'src/modules/ai-assistant/ai-assistant.service';

type AiSuggestionRequest = {
  context?: string | null;
  workspaceContext?: {
    workspace?: string;
    entityType?: string;
    entityId?: string;
    ownerId?: string;
    channel?: string;
    stage?: string;
    pathname?: string;
    summaryText?: string;
  } | null;
};

type AiGenerateRequest = {
  type?: 'summary' | 'next_action' | 'draft' | 'lead_score';
  text?: string;
  prompt?: string;
  metadata?: Record<string, unknown>;
  workspaceContext?: {
    workspace?: string;
    entityType?: string;
    entityId?: string;
    ownerId?: string;
    channel?: string;
    stage?: string;
    pathname?: string;
    summaryText?: string;
  } | null;
};

@Controller('ai-assistant')
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Get('capabilities')
  getCapabilities() {
    return this.aiAssistantService.getCapabilities();
  }

  @Post('suggestions')
  getSuggestions(@Body() payload: AiSuggestionRequest) {
    return this.aiAssistantService.buildSuggestions(payload ?? {});
  }

  @Post('generate')
  generate(@Body() payload: AiGenerateRequest) {
    return this.aiAssistantService.generate(payload ?? {});
  }
}
