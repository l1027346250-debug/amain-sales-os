import { Logger } from '@nestjs/common';

import { Command, CommandRunner, Option } from 'nest-commander';

import { TradeCrmWorkspaceInitializerService } from 'src/engine/workspace-manager/trade-crm-init/services/trade-crm-workspace-initializer.service';

type WorkspaceInitTradeCrmCommandOptions = {
  workspaceId: string;
};

@Command({
  name: 'workspace:init:trade-crm',
  description:
    'Initialize Trade CRM metadata (Lead + first-phase custom fields) for a workspace',
})
export class WorkspaceInitTradeCrmCommand extends CommandRunner {
  private readonly logger = new Logger(WorkspaceInitTradeCrmCommand.name);

  constructor(
    private readonly tradeCrmWorkspaceInitializerService: TradeCrmWorkspaceInitializerService,
  ) {
    super();
  }

  @Option({
    flags: '--workspace-id <workspaceId>',
    description: 'Workspace UUID to initialize',
    required: true,
  })
  parseWorkspaceId(value: string): string {
    return value;
  }

  async run(
    _passedParams: string[],
    options: WorkspaceInitTradeCrmCommandOptions,
  ): Promise<void> {
    try {
      await this.tradeCrmWorkspaceInitializerService.initializeWorkspace(
        options.workspaceId,
      );

      this.logger.log(
        `Trade CRM initialization complete for workspace ${options.workspaceId}`,
      );
    } catch (error) {
      this.logger.error(
        `Trade CRM initialization failed for workspace ${options.workspaceId}`,
        error,
      );
      throw error;
    }
  }
}

