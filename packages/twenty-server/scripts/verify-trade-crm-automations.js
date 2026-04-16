const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const {
  loadWorkspaceSchema,
} = require('./resolve-trade-crm-workspace-schema.js');

const workspaceId =
  process.env.TRADE_CRM_WORKSPACE_ID ||
  process.argv[2] ||
  '20202020-1c25-4d02-bf25-6aeccf7ea419';
const defaultUserEmail =
  process.env.TRADE_CRM_DEFAULT_ASSIGNEE_USER_EMAIL || 'tim@apple.dev';
const pgDatabaseUrl =
  process.env.PG_DATABASE_URL ||
  'postgres://postgres:postgres@127.0.0.1:5432/default';
const leadAssignmentRulesFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_RULES_FILE || '';
const leadAssignmentRulesJson =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_RULES_JSON || '';
const resolveLeadAssignmentRulesFile = (rulesFilePath) => {
  const candidatePaths = [
    rulesFilePath,
    path.resolve(process.cwd(), rulesFilePath),
    path.resolve(process.cwd(), '..', '..', rulesFilePath),
  ];

  return candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));
};
const loadLeadAssignmentRules = () => {
  if (leadAssignmentRulesFile.trim()) {
    const rulesPath = resolveLeadAssignmentRulesFile(leadAssignmentRulesFile);

    if (!rulesPath) {
      throw new Error(
        `Lead assignment rules file not found: ${leadAssignmentRulesFile}`,
      );
    }

    return JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
  }

  if (process.env.TRADE_CRM_LEAD_ASSIGNMENT_RULES_JSON) {
    return JSON.parse(process.env.TRADE_CRM_LEAD_ASSIGNMENT_RULES_JSON);
  }

  return null;
};
const leadAssignmentRules = loadLeadAssignmentRules();
const leadAssignmentRulesProvided =
  Boolean(leadAssignmentRulesFile.trim()) ||
  Boolean(leadAssignmentRulesJson.trim());

const requiredWorkflowNames = [
  'Trade CRM - Lead First Response Task',
  'Trade CRM - Lead Auto Assignment',
  'Trade CRM - Lead 12h First Response Reminder',
  'Trade CRM - Opportunity Quotation 3d Follow-up',
  'Trade CRM - Opportunity 7d Stalled Marker',
];
const skipInitWhenAlreadyActive =
  process.env.TRADE_CRM_AUTOMATIONS_SKIP_INIT_IF_ACTIVE !== '0';

const runCommand = (args) => {
  const result = spawnSync('node', ['dist/command/command.js', ...args], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      PG_DATABASE_URL: pgDatabaseUrl,
      REDIS_URL:
        process.env.REDIS_URL || 'redis://127.0.0.1:6379',
      APP_SECRET: process.env.APP_SECRET || 'trade-crm-dev-secret',
    },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const loadCurrentWorkflowStatuses = async (client) => {
  const workspaceSchema = await loadWorkspaceSchema({
    workspaceId,
    client,
  });
  const workflowResult = await client.query(
    `
      SELECT name, statuses, "lastPublishedVersionId"
      FROM ${workspaceSchema}.workflow
      WHERE name = ANY($1::text[])
      ORDER BY name
    `,
    [requiredWorkflowNames],
  );

  return workflowResult.rows;
};

const loadCurrentStageValues = async (client) => {
  const stageResult = await client.query(
    `
      SELECT fm.options
      FROM core."fieldMetadata" fm
      WHERE fm."workspaceId" = $1
        AND fm.name = 'stage'
        AND fm."objectMetadataId" = (
          SELECT om.id
          FROM core."objectMetadata" om
          WHERE om."workspaceId" = $1
            AND om."nameSingular" = 'opportunity'
          LIMIT 1
        )
      LIMIT 1
    `,
    [workspaceId],
  );

  const stageOptions = stageResult.rows[0]?.options ?? [];

  return stageOptions.map((option) => option.value);
};

const verify = async () => {
  const precheckClient = new Client({ connectionString: pgDatabaseUrl });

  await precheckClient.connect();

  const workspaceSchema = await loadWorkspaceSchema({
    workspaceId,
    client: precheckClient,
  });
  const currentWorkflowRows = await loadCurrentWorkflowStatuses(precheckClient);
  const currentWorkflowStatuses = Object.fromEntries(
    currentWorkflowRows.map((row) => [row.name, row.statuses]),
  );
  const currentStageValues = await loadCurrentStageValues(precheckClient);
  const workflowsAlreadyActive = requiredWorkflowNames.every(
    (workflowName) => currentWorkflowStatuses[workflowName] === '{ACTIVE}',
  );
  const stagesAlreadyConfigured = currentStageValues.includes('STALLED');

  await precheckClient.end();

  if (!skipInitWhenAlreadyActive || !workflowsAlreadyActive || !stagesAlreadyConfigured) {
    runCommand([
      'workspace:config:trade-crm:opportunity-stages',
      '--workspace-id',
      workspaceId,
    ]);
    runCommand([
      'workspace:init:trade-crm:automations',
      '--workspace-id',
      workspaceId,
      '--default-user-email',
      defaultUserEmail,
      ...(leadAssignmentRules
        ? leadAssignmentRulesFile.trim()
          ? [
              '--lead-assignment-rules-file',
              resolveLeadAssignmentRulesFile(leadAssignmentRulesFile),
            ]
          : [
              '--lead-assignment-rules-json',
              JSON.stringify(leadAssignmentRules),
            ]
        : []),
    ]);
  } else if (leadAssignmentRulesProvided) {
    runCommand([
      'workspace:init:trade-crm:automations',
      '--workspace-id',
      workspaceId,
      '--default-user-email',
      defaultUserEmail,
      ...(leadAssignmentRules
        ? leadAssignmentRulesFile.trim()
          ? [
              '--lead-assignment-rules-file',
              resolveLeadAssignmentRulesFile(leadAssignmentRulesFile),
            ]
          : [
              '--lead-assignment-rules-json',
              JSON.stringify(leadAssignmentRules),
            ]
        : []),
    ]);
  }

  const client = new Client({ connectionString: pgDatabaseUrl });

  await client.connect();

  const workflowResult = await client.query(
    `
      SELECT name, statuses, "lastPublishedVersionId"
      FROM ${workspaceSchema}.workflow
      WHERE name = ANY($1::text[])
      ORDER BY name
    `,
    [requiredWorkflowNames],
  );

  const stageResult = await client.query(
    `
      SELECT fm.options
      FROM core."fieldMetadata" fm
      WHERE fm."workspaceId" = $1
        AND fm.name = 'stage'
        AND fm."objectMetadataId" = (
          SELECT om.id
          FROM core."objectMetadata" om
          WHERE om."workspaceId" = $1
            AND om."nameSingular" = 'opportunity'
          LIMIT 1
        )
      LIMIT 1
    `,
    [workspaceId],
  );

  const workflowVersionResult = await client.query(
    `
      SELECT
        w.name,
        v.name AS "versionName",
        v.steps,
        v.trigger
      FROM ${workspaceSchema}.workflow w
      JOIN ${workspaceSchema}."workflowVersion" v
        ON w."lastPublishedVersionId"::text = v.id::text
      WHERE w.name IN (
        'Trade CRM - Lead Auto Assignment',
        'Trade CRM - Lead 12h First Response Reminder'
      )
      ORDER BY w.name
    `,
  );

  await client.end();

  const workflowStatuses = Object.fromEntries(
    workflowResult.rows.map((row) => [row.name, row.statuses]),
  );

  for (const workflowName of requiredWorkflowNames) {
    if (workflowStatuses[workflowName] !== '{ACTIVE}') {
      throw new Error(
        `Expected ${workflowName} to be ACTIVE, received ${workflowStatuses[workflowName] ?? 'missing'}`,
      );
    }
  }

  const stageOptions = stageResult.rows[0]?.options ?? [];
  const stageValues = stageOptions.map((option) => option.value);

  if (!stageValues.includes('STALLED')) {
    throw new Error(
      `Expected opportunity stage options to include STALLED, received ${stageValues.join(', ')}`,
    );
  }

  const workflowVersions = Object.fromEntries(
    workflowVersionResult.rows.map((row) => [row.name, row]),
  );
  const leadAutoAssignmentVersion =
    workflowVersions['Trade CRM - Lead Auto Assignment'];
  const leadReminderVersion =
    workflowVersions['Trade CRM - Lead 12h First Response Reminder'];

  if (!leadAutoAssignmentVersion || !leadReminderVersion) {
    throw new Error('Expected lead automation workflow versions to exist');
  }

  const autoAssignmentStepTypes = leadAutoAssignmentVersion.steps.map(
    (step) => step.type,
  );
  const reminderCreateTaskStep = leadReminderVersion.steps.find(
    (step) => step.type === 'CREATE_RECORD',
  );

  if (!autoAssignmentStepTypes.includes('IF_ELSE')) {
    throw new Error(
      `Expected Lead Auto Assignment published version to include IF_ELSE, received ${autoAssignmentStepTypes.join(', ')}`,
    );
  }

  if (
    reminderCreateTaskStep?.settings?.input?.objectRecord?.assigneeId !==
    '{{a8e038dc-9626-4b7e-bf88-772ef6545dc2.first.assignedToId}}'
  ) {
    throw new Error(
      `Expected Lead 12h reminder task assignee to use dynamic assignedToId, received ${reminderCreateTaskStep?.settings?.input?.objectRecord?.assigneeId ?? 'missing'}`,
    );
  }

  const expectedRuleCount = Array.isArray(leadAssignmentRules)
    ? leadAssignmentRules.length
    : 1;
  const autoAssignmentBranches =
    leadAutoAssignmentVersion.steps[0]?.settings?.input?.branches ?? [];
  const autoAssignmentUpdateSteps = leadAutoAssignmentVersion.steps.filter(
    (step) => step.type === 'UPDATE_RECORD',
  );

  if (autoAssignmentUpdateSteps.length !== expectedRuleCount) {
    throw new Error(
      `Expected ${expectedRuleCount} lead auto assignment update step(s), received ${autoAssignmentUpdateSteps.length}`,
    );
  }

  if (autoAssignmentBranches.length !== expectedRuleCount + 1) {
    throw new Error(
      `Expected ${expectedRuleCount + 1} lead auto assignment branch(es), received ${autoAssignmentBranches.length}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        workspaceId,
        workspaceSchema,
        defaultUserEmail,
        leadAssignmentRulesFile: leadAssignmentRulesFile || null,
        leadAssignmentRules,
        workflows: workflowStatuses,
        stageValues,
        leadAutoAssignmentVersion: {
          versionName: leadAutoAssignmentVersion.versionName,
          stepTypes: autoAssignmentStepTypes,
          branchCount: autoAssignmentBranches.length,
          updateStepCount: autoAssignmentUpdateSteps.length,
          branchMatchers: autoAssignmentBranches
            .filter((branch) => branch.filterGroupId)
            .map((branch) => ({
              branchId: branch.id,
              filterGroupId: branch.filterGroupId,
            })),
        },
        lead12hReminderVersion: {
          versionName: leadReminderVersion.versionName,
          assigneeId:
            reminderCreateTaskStep?.settings?.input?.objectRecord?.assigneeId ??
            null,
        },
        },
      null,
      2,
    ),
  );
};

verify().catch((error) => {
  console.error(error);
  process.exit(1);
});
