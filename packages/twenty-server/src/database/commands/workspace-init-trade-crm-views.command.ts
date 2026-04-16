import { Logger } from '@nestjs/common';

import { Command, CommandRunner, Option } from 'nest-commander';

import { TradeCrmViewsInitializerService } from 'src/engine/workspace-manager/trade-crm-init/services/trade-crm-views-initializer.service';

type WorkspaceInitTradeCrmViewsCommandOptions = {
  workspaceId: string;
};

@Command({
  name: 'workspace:init:trade-crm:views',
  description: 'Create minimal Trade CRM views for a workspace',
})
export class WorkspaceInitTradeCrmViewsCommand extends CommandRunner {
  private readonly logger = new Logger(WorkspaceInitTradeCrmViewsCommand.name);

  constructor(private readonly viewsInitializer: TradeCrmViewsInitializerService) {
    super();
  }

  @Option({
    flags: '--workspace-id <workspaceId>',
    description: 'Workspace UUID to initialize views for',
    required: true,
  })
  parseWorkspaceId(value: string): string {
    return value;
  }

  async run(
    _passedParams: string[],
    options: WorkspaceInitTradeCrmViewsCommandOptions,
  ): Promise<void> {
    try {
      await this.viewsInitializer.initializeViews(options.workspaceId);
      this.logger.log(`Trade CRM views initialized for workspace ${options.workspaceId}`);
    } catch (error) {
      this.logger.error(
        `Trade CRM views init failed for workspace ${options.workspaceId}`,
        error,
      );
      throw error;
    }
  }
}

