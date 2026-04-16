import { Logger } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { Command, CommandRunner, Option } from 'nest-commander';

import {
  TradeCrmAutomationsInitializerService,
  type TradeCrmLeadAssignmentRuleInput,
} from 'src/engine/workspace-manager/trade-crm-init/services/trade-crm-automations-initializer.service';

type WorkspaceInitTradeCrmAutomationsCommandOptions = {
  workspaceId: string;
  defaultWorkspaceMemberId?: string;
  defaultUserEmail?: string;
  leadAssignmentRulesJson?: TradeCrmLeadAssignmentRuleInput[];
  leadAssignmentRulesFile?: string;
};

@Command({
  name: 'workspace:init:trade-crm:automations',
  description: 'Create the first batch of Trade CRM workflow automations',
})
export class WorkspaceInitTradeCrmAutomationsCommand extends CommandRunner {
  private readonly logger = new Logger(
    WorkspaceInitTradeCrmAutomationsCommand.name,
  );

  constructor(
    private readonly automationsInitializer: TradeCrmAutomationsInitializerService,
  ) {
    super();
  }

  @Option({
    flags: '--workspace-id <workspaceId>',
    description: 'Workspace UUID to initialize automations for',
    required: true,
  })
  parseWorkspaceId(value: string): string {
    return value;
  }

  @Option({
    flags: '--default-workspace-member-id <workspaceMemberId>',
    description:
      'Optional explicit workspace member ID for multi-member lead assignment automations',
    required: false,
  })
  parseDefaultWorkspaceMemberId(value: string): string {
    return value;
  }

  @Option({
    flags: '--default-user-email <userEmail>',
    description:
      'Optional explicit workspace member user email for multi-member lead assignment automations',
    required: false,
  })
  parseDefaultUserEmail(value: string): string {
    return value;
  }

  @Option({
    flags: '--lead-assignment-rules-json <rulesJson>',
    description:
      'Optional JSON array of lead assignment rules for multi-member workspaces',
    required: false,
  })
  parseLeadAssignmentRulesJson(
    value: string,
  ): TradeCrmLeadAssignmentRuleInput[] {
    const parsedValue = JSON.parse(value);

    if (!Array.isArray(parsedValue)) {
      throw new Error('lead assignment rules JSON must be an array');
    }

    return parsedValue as TradeCrmLeadAssignmentRuleInput[];
  }

  @Option({
    flags: '--lead-assignment-rules-file <rulesFilePath>',
    description:
      'Optional file path to a JSON array of lead assignment rules for multi-member workspaces',
    required: false,
  })
  parseLeadAssignmentRulesFile(value: string): string {
    return value;
  }

  async run(
    _passedParams: string[],
    options: WorkspaceInitTradeCrmAutomationsCommandOptions,
  ): Promise<void> {
    try {
      await this.automationsInitializer.initializeAutomations(
        options.workspaceId,
        {
          defaultWorkspaceMemberId:
            options.defaultWorkspaceMemberId ??
            process.env.TRADE_CRM_DEFAULT_ASSIGNEE_WORKSPACE_MEMBER_ID,
          defaultUserEmail:
            options.defaultUserEmail ??
            process.env.TRADE_CRM_DEFAULT_ASSIGNEE_USER_EMAIL,
          leadAssignmentRules:
            options.leadAssignmentRulesJson ??
            this.parseLeadAssignmentRulesFromFile(
              options.leadAssignmentRulesFile ??
                process.env.TRADE_CRM_LEAD_ASSIGNMENT_RULES_FILE,
            ) ??
            this.parseLeadAssignmentRulesFromEnvironment(),
        },
      );
      this.logger.log(
        `Trade CRM automations initialized for workspace ${options.workspaceId}`,
      );
    } catch (error) {
      process.exitCode = 1;
      this.logger.error(
        `Trade CRM automations init failed for workspace ${options.workspaceId}`,
        error,
      );
      throw error;
    }
  }

  private parseLeadAssignmentRulesFromEnvironment():
    | TradeCrmLeadAssignmentRuleInput[]
    | undefined {
    const rulesJson = process.env.TRADE_CRM_LEAD_ASSIGNMENT_RULES_JSON;

    if (!rulesJson?.trim()) {
      return undefined;
    }

    return this.parseLeadAssignmentRulesJson(rulesJson);
  }

  private parseLeadAssignmentRulesFromFile(
    rulesFilePath?: string,
  ): TradeCrmLeadAssignmentRuleInput[] | undefined {
    if (!rulesFilePath?.trim()) {
      return undefined;
    }

    const resolvedRulesFilePath = this.resolveLeadAssignmentRulesFilePath(
      rulesFilePath,
    );
    const rulesJson = readFileSync(resolvedRulesFilePath, 'utf8');

    return this.parseLeadAssignmentRulesJson(rulesJson);
  }

  private resolveLeadAssignmentRulesFilePath(rulesFilePath: string): string {
    const candidatePaths = [
      rulesFilePath,
      resolve(process.cwd(), rulesFilePath),
      resolve(process.cwd(), '..', '..', rulesFilePath),
    ];

    const resolvedPath = candidatePaths.find((candidatePath) =>
      existsSync(candidatePath),
    );

    if (!resolvedPath) {
      throw new Error(
        `Lead assignment rules file not found: ${rulesFilePath}`,
      );
    }

    return resolvedPath;
  }
}
