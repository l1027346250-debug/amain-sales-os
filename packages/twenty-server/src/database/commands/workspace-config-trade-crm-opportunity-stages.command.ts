import { Logger } from '@nestjs/common';

import { Command, CommandRunner, Option } from 'nest-commander';

import { TradeCrmOpportunityStageConfiguratorService } from 'src/engine/workspace-manager/trade-crm-init/services/trade-crm-opportunity-stage-configurator.service';

type WorkspaceConfigTradeCrmOpportunityStagesOptions = {
  workspaceId: string;
};

@Command({
  name: 'workspace:config:trade-crm:opportunity-stages',
  description:
    'Configure Opportunity.stage options for Trade CRM (per-workspace, does not touch global defaults)',
})
export class WorkspaceConfigTradeCrmOpportunityStagesCommand extends CommandRunner {
  private readonly logger = new Logger(
    WorkspaceConfigTradeCrmOpportunityStagesCommand.name,
  );

  constructor(
    private readonly configurator: TradeCrmOpportunityStageConfiguratorService,
  ) {
    super();
  }

  @Option({
    flags: '--workspace-id <workspaceId>',
    description: 'Workspace UUID to configure',
    required: true,
  })
  parseWorkspaceId(value: string): string {
    return value;
  }

  async run(
    _passedParams: string[],
    options: WorkspaceConfigTradeCrmOpportunityStagesOptions,
  ): Promise<void> {
    try {
      await this.configurator.configureOpportunityStageOptions(options.workspaceId);
      this.logger.log(
        `Trade CRM opportunity stages configured for workspace ${options.workspaceId}`,
      );
    } catch (error) {
      this.logger.error(
        `Stage configuration failed for workspace ${options.workspaceId}`,
        error,
      );
      throw error;
    }
  }
}

