'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const serverDir = path.join(repoRoot, 'packages', 'twenty-server');
const integrationHubDir = path.join(repoRoot, 'integration-hub');
const smokeArtifactsDir = path.join(repoRoot, 'tmp', 'trade-crm-smoke');
const smokeSummaryPath = path.join(smokeArtifactsDir, 'last-smoke-summary.json');
const opsArtifacts = {
  state: path.join(smokeArtifactsDir, 'ops-state.json'),
  exceptions: path.join(smokeArtifactsDir, 'ops-exceptions.json'),
  markdown: path.join(smokeArtifactsDir, 'ops-report.md'),
  weeklySummary: path.join(smokeArtifactsDir, 'ops-weekly-summary.md'),
};
const assignmentStackArtifacts = {
  dir: path.join(smokeArtifactsDir, 'post-launch-assignment-stack-report'),
  json: path.join(
    smokeArtifactsDir,
    'post-launch-assignment-stack-report',
    'post-launch-assignment-stack-report.json',
  ),
  markdown: path.join(
    smokeArtifactsDir,
    'post-launch-assignment-stack-report',
    'post-launch-assignment-stack-report.md',
  ),
  manifest: path.join(
    smokeArtifactsDir,
    'post-launch-assignment-stack-report',
    'post-launch-assignment-stack-bundle.manifest.json',
  ),
};
const quietMode =
  process.argv.includes('--quiet') ||
  process.env.TRADE_CRM_SMOKE_QUIET === '1';
const failOnWarnings =
  process.argv.includes('--fail-on-warnings') ||
  process.env.TRADE_CRM_SMOKE_FAIL_ON_WARNINGS === '1';
const includePgStateChecks =
  process.argv.includes('--include-pg-state') ||
  process.env.TRADE_CRM_SMOKE_INCLUDE_PG_STATE === '1';

const sharedEnv = {
  ...process.env,
  PG_DATABASE_URL:
    process.env.PG_DATABASE_URL ||
    'postgres://postgres:postgres@127.0.0.1:5432/postgres',
  REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  APP_SECRET: process.env.APP_SECRET || 'trade-crm-dev-secret',
  TRADE_CRM_DEFAULT_ASSIGNEE_USER_EMAIL:
    process.env.TRADE_CRM_DEFAULT_ASSIGNEE_USER_EMAIL || 'tim@apple.dev',
  TRADE_CRM_LEAD_ASSIGNMENT_RULES_JSON:
    process.env.TRADE_CRM_LEAD_ASSIGNMENT_RULES_JSON || '',
  TRADE_CRM_LEAD_ASSIGNMENT_RULES_FILE:
    process.env.TRADE_CRM_LEAD_ASSIGNMENT_RULES_FILE || '',
};

const parseLeadAssignmentRules = () => {
  const rulesFilePath =
    sharedEnv.TRADE_CRM_LEAD_ASSIGNMENT_RULES_FILE?.trim() || '';

  if (rulesFilePath) {
    try {
      const resolvedRulesPath = path.resolve(repoRoot, rulesFilePath);
      const parsedRules = JSON.parse(
        fs.readFileSync(resolvedRulesPath, 'utf8'),
      );

      return Array.isArray(parsedRules) ? parsedRules : [];
    } catch {
      return [];
    }
  }

  const rulesJson = sharedEnv.TRADE_CRM_LEAD_ASSIGNMENT_RULES_JSON?.trim();

  if (!rulesJson) {
    return [];
  }

  try {
    const parsedRules = JSON.parse(rulesJson);

    return Array.isArray(parsedRules) ? parsedRules : [];
  } catch {
    return [];
  }
};

const resolveSpawnSpec = (command, args) => {
  if (process.platform !== 'win32') {
    return { command, args };
  }

  if (command === 'node') {
    return {
      command: process.execPath,
      args,
    };
  }

  if (command === 'npm') {
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', 'npm.cmd', ...args],
    };
  }

  return { command, args };
};

const checks = [];
const deprecationPattern = /\[([A-Z0-9]+)\]\s+DeprecationWarning:/g;

const collectWarnings = (output) => {
  const warnings = [];
  const lines = output.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = deprecationPattern.exec(line);

    deprecationPattern.lastIndex = 0;

    if (!match) {
      continue;
    }

    const warning = {
      code: match[1],
      message: line.trim(),
      source: null,
      trace: [],
    };

    for (
      let sourceIndex = index + 1;
      sourceIndex < Math.min(index + 12, lines.length);
      sourceIndex += 1
    ) {
      const sourceLine = lines[sourceIndex].trim();

      if (!sourceLine.startsWith('at ')) {
        continue;
      }

      warning.trace.push(sourceLine);

      if (
        warning.source === null &&
        !sourceLine.includes('(node:') &&
        !sourceLine.includes('node:internal') &&
        !sourceLine.includes('(node:url:')
      ) {
        warning.source = sourceLine;
      }
    }

    if (warning.source === null) {
      warning.source = warning.trace[0] ?? null;
    }

    warnings.push(warning);
  }

  return warnings;
};

const extractJsonObjectsFromOutput = (output) => {
  const jsonObjects = [];
  let depth = 0;
  let startIndex = -1;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < output.length; index += 1) {
    const character = output[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === '\\') {
      escaped = true;
      continue;
    }

    if (character === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (character === '{') {
      if (depth === 0) {
        startIndex = index;
      }

      depth += 1;
      continue;
    }

    if (character === '}') {
      depth -= 1;

      if (depth === 0 && startIndex !== -1) {
        const jsonText = output.slice(startIndex, index + 1);

        try {
          jsonObjects.push(JSON.parse(jsonText));
        } catch {
          // Ignore non-JSON brace blocks from mixed command output.
        }

        startIndex = -1;
      }
    }
  }

  return jsonObjects;
};

const mergeNodeOptions = (baseNodeOptions, extraNodeOptions) => {
  const base = (baseNodeOptions ?? '').trim();
  const extra = (extraNodeOptions ?? '').trim();

  if (!extra) {
    return base;
  }

  if (!base) {
    return extra;
  }

  return `${base} ${extra}`;
};

const readJsonIfExists = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const formatProcessedOutboxConsumers = (processedByConsumer) => {
  const entries = Object.entries(processedByConsumer ?? {});

  if (entries.length === 0) {
    return [];
  }

  return entries
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([consumerName, count]) => `${consumerName}=${count}`);
};

const formatProcessedOutboxConsumersHeadlineToken = (processedConsumers) => {
  if (!Array.isArray(processedConsumers) || processedConsumers.length === 0) {
    return null;
  }

  const maxVisibleConsumers = 3;
  const visibleConsumers = processedConsumers.slice(0, maxVisibleConsumers);
  const remainingCount = processedConsumers.length - visibleConsumers.length;

  if (remainingCount <= 0) {
    return visibleConsumers.join('|');
  }

  return `${visibleConsumers.join('|')}|+${remainingCount}_more`;
};

const formatProcessedOutboxConsumerAuditSignal = (processedConsumers) => {
  if (!Array.isArray(processedConsumers) || processedConsumers.length === 0) {
    return '0:none';
  }

  return `${processedConsumers.length}:${formatProcessedOutboxConsumersHeadlineToken(processedConsumers)}`;
};

const buildProcessedOutboxConsumerAuditNarrative = (processedConsumers) => {
  if (!Array.isArray(processedConsumers) || processedConsumers.length === 0) {
    return 'No named downstream consumer acknowledgements were recorded in the current snapshot.';
  }

  const details = processedConsumers
    .map((entry) => entry.replace('=', ' (') + ')')
    .join(', ');

  if (processedConsumers.length === 1) {
    return `1 downstream consumer acknowledged processed outbox events: ${details}.`;
  }

  return `${processedConsumers.length} downstream consumers acknowledged processed outbox events: ${details}.`;
};

const buildProcessedOutboxConsumerAuditNarrativeZh = (processedConsumers) => {
  if (!Array.isArray(processedConsumers) || processedConsumers.length === 0) {
    return '当前快照中没有记录到已命名的下游消费方确认。';
  }

  const details = processedConsumers
    .map((entry) => entry.replace('=', '（') + '）')
    .join('，');

  if (processedConsumers.length === 1) {
    return `当前有 1 个下游消费方已确认 processed outbox 事件：${details}。`;
  }

  return `当前有 ${processedConsumers.length} 个下游消费方已确认 processed outbox 事件：${details}。`;
};

const buildAssignmentStackAuditSignal = ({
  stackStatus,
  bundledSourceCount,
  copiedBundledSourceCount,
  missingBundledSourceCount,
}) => {
  return `${stackStatus ?? 'unknown'}:${bundledSourceCount ?? 0}/${copiedBundledSourceCount ?? 0}/${missingBundledSourceCount ?? 0}`;
};

const buildOpsSnapshotSummary = () => {
  const opsState = readJsonIfExists(opsArtifacts.state);
  const opsExceptions = readJsonIfExists(opsArtifacts.exceptions);

  if (!opsState || !opsExceptions) {
    return null;
  }

  const pendingSyncJobs = opsExceptions.syncJobs?.pendingCount ?? 0;
  const failedSyncJobs = opsExceptions.syncJobs?.failedCount ?? 0;
  const failedWebhookEvents = opsExceptions.webhookEvents?.failedCount ?? 0;
  const ignoredWebhookEvents = opsExceptions.webhookEvents?.ignoredCount ?? 0;
  const processedWebhookEvents = opsState.webhookEvents?.summary?.processed ?? 0;
  const readyOutboxEvents = opsState.outbox?.summary?.ready ?? 0;
  const processedOutboxEvents = opsState.outbox?.summary?.processed ?? 0;
  const processedOutboxConsumers = formatProcessedOutboxConsumers(
    opsState.outbox?.summary?.processedByConsumer,
  );
  const processedOutboxConsumerCount = processedOutboxConsumers.length;
  const processedOutboxConsumerAuditSignal =
    formatProcessedOutboxConsumerAuditSignal(processedOutboxConsumers);
  const processedOutboxConsumerAuditNarrative =
    buildProcessedOutboxConsumerAuditNarrative(processedOutboxConsumers);
  const processedOutboxConsumerAuditNarrativeZh =
    buildProcessedOutboxConsumerAuditNarrativeZh(processedOutboxConsumers);
  const appliedFirstResponseTasks =
    opsState.leadMonitoring?.summary?.appliedTaskCount ?? 0;
  const duplicateApplyBlocked =
    opsState.leadMonitoring?.summary?.duplicateApplyBlockedCount ?? 0;
  const topSyncError =
    opsExceptions.syncJobs?.recentSyncErrors?.[0]?.message ?? null;

  const headlineParts = [
    `pending_sync_jobs=${pendingSyncJobs}`,
    `failed_sync_jobs=${failedSyncJobs}`,
    `processed_webhooks=${processedWebhookEvents}`,
    `ready_outbox_events=${readyOutboxEvents}`,
    `processed_outbox_events=${processedOutboxEvents}`,
  ];

  if (failedWebhookEvents > 0) {
    headlineParts.push(`failed_webhooks=${failedWebhookEvents}`);
  }

  if (ignoredWebhookEvents > 0) {
    headlineParts.push(`ignored_webhooks=${ignoredWebhookEvents}`);
  }

  if (appliedFirstResponseTasks > 0) {
    headlineParts.push(`applied_first_response_tasks=${appliedFirstResponseTasks}`);
  }

  if (duplicateApplyBlocked > 0) {
    headlineParts.push(`duplicate_apply_blocked=${duplicateApplyBlocked}`);
  }

  if (processedOutboxConsumers.length > 0) {
    headlineParts.push(
      `processed_outbox_consumer_audit=${processedOutboxConsumerAuditSignal}`,
    );
  }

  return {
    headline: headlineParts.join(', '),
    stateBackend: opsState.stateBackend ?? null,
    pendingSyncJobs,
    failedSyncJobs,
    failedWebhookEvents,
    ignoredWebhookEvents,
    processedWebhookEvents,
    readyOutboxEvents,
    processedOutboxEvents,
    processedOutboxConsumerCount,
    processedOutboxConsumers,
    processedOutboxConsumerAuditSignal,
    processedOutboxConsumerAuditNarrative,
    processedOutboxConsumerAuditNarrativeZh,
    appliedFirstResponseTasks,
    duplicateApplyBlocked,
    topSyncError,
  };
};

const run = ({
  cwd,
  command,
  args,
  checkName,
  envOverrides,
  retryOnBusy = false,
}) => {
  const { command: resolvedCommand, args: resolvedArgs } = resolveSpawnSpec(
    command,
    args,
  );
  const startedAt = new Date().toISOString();
  const env = {
    ...sharedEnv,
    ...envOverrides,
  };

  if (envOverrides?.NODE_OPTIONS) {
    env.NODE_OPTIONS = mergeNodeOptions(
      sharedEnv.NODE_OPTIONS,
      envOverrides.NODE_OPTIONS,
    );
  }

  if (!quietMode) {
    console.log(
      JSON.stringify(
        {
          step: `${resolvedCommand} ${resolvedArgs.join(' ')}`,
          cwd,
        },
        null,
        2,
      ),
    );
  }

  let result;
  let attempt = 0;
  const maxAttempts = retryOnBusy ? 3 : 1;

  while (attempt < maxAttempts) {
    attempt += 1;

    result = spawnSync(resolvedCommand, resolvedArgs, {
      cwd,
      env,
      encoding: 'utf8',
    });

    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    const busyCopyFileDetected =
      output.includes('Error: EBUSY') && output.includes('copyfile');

    if (!busyCopyFileDetected || attempt >= maxAttempts) {
      break;
    }

    if (!quietMode) {
      console.log(
        JSON.stringify(
          {
            retryingStep: `${resolvedCommand} ${resolvedArgs.join(' ')}`,
            attempt,
            nextAttempt: attempt + 1,
            reason: 'EBUSY copyfile during build',
          },
          null,
          2,
        ),
      );
    }

    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 750);
  }

  if (!quietMode && result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (!quietMode && result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    if (result.stdout) {
      process.stdout.write(result.stdout);
    }

    if (result.stderr) {
      process.stderr.write(result.stderr);
    }

    process.exit(result.status ?? 1);
  }

  if (checkName) {
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    const parsedJsonObjects = extractJsonObjectsFromOutput(output);

    checks.push({
      name: checkName,
      command: resolvedCommand,
      args: resolvedArgs,
      cwd,
      startedAt,
      finishedAt: new Date().toISOString(),
      status: 'ok',
      warnings: collectWarnings(output),
      outputs: parsedJsonObjects,
    });
  }
};

const main = () => {
  fs.mkdirSync(smokeArtifactsDir, { recursive: true });
  const leadAssignmentRules = parseLeadAssignmentRules();

  run({
    cwd: serverDir,
    command: 'node',
    args: ['..\\..\\node_modules\\@nestjs\\cli\\bin\\nest.js', 'build', '--path', '.\\tsconfig.build.json'],
    retryOnBusy: true,
  });

  run({
    cwd: serverDir,
    command: 'npm',
    args: ['run', 'verify:trade-crm-lead-assignment-register'],
    checkName: 'trade-crm-lead-assignment-register',
  });

  run({
    cwd: serverDir,
    command: 'npm',
    args: ['run', 'review:trade-crm-post-launch-assignment-stack'],
    checkName: 'trade-crm-post-launch-assignment-stack',
  });

  run({
    cwd: serverDir,
    command: 'npm',
    args: ['run', 'export:trade-crm-post-launch-assignment-stack-report'],
    checkName: 'trade-crm-post-launch-assignment-stack-export',
    envOverrides: {
      TRADE_CRM_POST_LAUNCH_ASSIGNMENT_STACK_REPORT_DIR:
        assignmentStackArtifacts.dir,
    },
  });

  run({
    cwd: serverDir,
    command: 'npm',
    args: ['run', 'verify:trade-crm-post-launch-assignment-stack-report'],
    checkName: 'trade-crm-post-launch-assignment-stack-report',
    envOverrides: {
      TRADE_CRM_POST_LAUNCH_ASSIGNMENT_STACK_REPORT_DIR:
        assignmentStackArtifacts.dir,
    },
  });

  run({
    cwd: serverDir,
    command: 'npm',
    args: ['run', 'verify:trade-crm-automations'],
    checkName: 'trade-crm-automations',
    envOverrides: {
      NODE_OPTIONS: '--trace-deprecation',
    },
  });

  run({
    cwd: integrationHubDir,
    command: 'npm',
    args: ['run', 'build'],
    retryOnBusy: true,
  });

  run({
    cwd: integrationHubDir,
    command: 'npm',
    args: ['run', 'verify:alibaba-lead-sync'],
    checkName: 'alibaba-lead-sync',
  });

  run({
    cwd: integrationHubDir,
    command: 'npm',
    args: ['run', 'verify:first-response-flow'],
    checkName: 'first-response-flow',
  });

  run({
    cwd: integrationHubDir,
    command: 'npm',
    args: ['run', 'verify:twenty-webhook-flow'],
    checkName: 'twenty-webhook-flow',
  });

  run({
    cwd: integrationHubDir,
    command: 'npm',
    args: ['run', 'verify:state-persistence-flow'],
    checkName: 'state-persistence-flow',
    envOverrides: {
      TRADE_CRM_SMOKE_ARTIFACTS_DIR: smokeArtifactsDir,
      INTEGRATION_HUB_VERIFY_STATE_HUB_PORT: '13024',
      INTEGRATION_HUB_VERIFY_STATE_MOCK_TWENTY_PORT: '13304',
    },
  });

  if (includePgStateChecks) {
    run({
      cwd: integrationHubDir,
      command: 'npm',
      args: ['run', 'verify:first-response-pg-flow'],
      checkName: 'first-response-pg-flow',
    });

    run({
      cwd: integrationHubDir,
      command: 'npm',
      args: ['run', 'verify:state-persistence-pg-flow'],
      checkName: 'state-persistence-pg-flow',
      envOverrides: {
        TRADE_CRM_SMOKE_ARTIFACTS_DIR: smokeArtifactsDir,
      },
    });
  }

  const opsSnapshotSummary = buildOpsSnapshotSummary();
  const leadAssignmentRegisterCheck = checks.find(
    (check) => check.name === 'trade-crm-lead-assignment-register',
  );
  const leadAssignmentRegisterSummary =
    leadAssignmentRegisterCheck?.outputs?.[leadAssignmentRegisterCheck.outputs.length - 1] ??
    null;
  const postLaunchAssignmentStackCheck = checks.find(
    (check) => check.name === 'trade-crm-post-launch-assignment-stack',
  );
  const postLaunchAssignmentStackSummary =
    postLaunchAssignmentStackCheck?.outputs?.[
      postLaunchAssignmentStackCheck.outputs.length - 1
    ] ?? null;
  const postLaunchAssignmentStackReportCheck = checks.find(
    (check) => check.name === 'trade-crm-post-launch-assignment-stack-report',
  );
  const postLaunchAssignmentStackReportSummary =
    postLaunchAssignmentStackReportCheck?.outputs?.[
      postLaunchAssignmentStackReportCheck.outputs.length - 1
    ] ?? null;
  const assignmentStackBundledSourceCount =
    postLaunchAssignmentStackReportSummary?.bundledSourceCount ?? null;
  const assignmentStackCopiedBundledSourceCount =
    postLaunchAssignmentStackReportSummary?.copiedBundledSourceCount ?? null;
  const assignmentStackMissingBundledSourceCount =
    postLaunchAssignmentStackReportSummary?.missingBundledSourceCount ?? null;
  const postLaunchAssignmentStackStatus =
    postLaunchAssignmentStackSummary?.stackStatus ?? null;
  const postLaunchAssignmentPoolStrategy =
    postLaunchAssignmentStackSummary?.poolStrategy ?? null;
  const assignmentStackAuditSignal = buildAssignmentStackAuditSignal({
    stackStatus: postLaunchAssignmentStackStatus,
    bundledSourceCount: assignmentStackBundledSourceCount,
    copiedBundledSourceCount: assignmentStackCopiedBundledSourceCount,
    missingBundledSourceCount: assignmentStackMissingBundledSourceCount,
  });

  const summary = {
    status: 'ok',
    checks,
    failedChecks: checks
      .filter((check) => check.status !== 'ok')
      .map((check) => check.name),
    warningCodes: [
      ...new Set(
        checks.flatMap((check) =>
          check.warnings.map((warning) => warning.code),
        ),
      ),
    ],
    warningCount: checks.reduce(
      (count, check) => count + check.warnings.length,
      0,
    ),
    opsArtifacts,
    assignmentStackArtifacts,
    opsSnapshotSummary,
    defaultAssigneeUserEmail:
      sharedEnv.TRADE_CRM_DEFAULT_ASSIGNEE_USER_EMAIL,
    leadAssignmentMode:
      leadAssignmentRules.length > 0 ? 'rules' : 'default_assignee',
    leadAssignmentRuleCount: leadAssignmentRules.length,
    leadAssignmentRulesFile:
      sharedEnv.TRADE_CRM_LEAD_ASSIGNMENT_RULES_FILE || null,
    leadAssignmentRegisterFile:
      leadAssignmentRegisterSummary?.registerFile ?? null,
    leadAssignmentGeneratedRulesFile:
      leadAssignmentRegisterSummary?.generatedRulesFile ?? null,
    leadAssignmentRegisterRuleCount:
      leadAssignmentRegisterSummary?.ruleCount ?? null,
    leadAssignmentRegisterWorkspaceId:
      leadAssignmentRegisterSummary?.workspaceId ?? null,
    postLaunchAssignmentStackStatus,
    postLaunchAssignmentPoolStrategy,
    assignmentStackBundledSourceCount,
    assignmentStackCopiedBundledSourceCount,
    assignmentStackMissingBundledSourceCount,
    assignmentStackAuditSignal,
    includePgStateChecks,
    summaryPath: smokeSummaryPath,
  };

  if (failOnWarnings && summary.warningCount > 0) {
    summary.status = 'warnings_detected';
  }

  fs.writeFileSync(smokeSummaryPath, JSON.stringify(summary, null, 2));

  console.log(
    JSON.stringify(
      quietMode
        ? {
            status: summary.status,
            summaryPath: summary.summaryPath,
            warningCount: summary.warningCount,
            warningCodes: summary.warningCodes,
            failedChecks: summary.failedChecks,
            opsArtifacts: summary.opsArtifacts,
            assignmentStackArtifacts: summary.assignmentStackArtifacts,
            opsSnapshotSummary: summary.opsSnapshotSummary,
            stateBackend: summary.opsSnapshotSummary?.stateBackend ?? null,
            processedOutboxConsumerCount:
              summary.opsSnapshotSummary?.processedOutboxConsumerCount ?? 0,
            processedOutboxConsumers:
              summary.opsSnapshotSummary?.processedOutboxConsumers ?? [],
            processedOutboxConsumerAuditSignal:
              summary.opsSnapshotSummary?.processedOutboxConsumerAuditSignal ??
              '0:none',
            processedOutboxConsumerAuditNarrative:
              summary.opsSnapshotSummary
                ?.processedOutboxConsumerAuditNarrative ??
              'No named downstream consumer acknowledgements were recorded in the current snapshot.',
            processedOutboxConsumerAuditNarrativeZh:
              summary.opsSnapshotSummary
                ?.processedOutboxConsumerAuditNarrativeZh ??
              '当前快照中没有记录到已命名的下游消费方确认。',
            leadAssignmentMode: summary.leadAssignmentMode,
            leadAssignmentRuleCount: summary.leadAssignmentRuleCount,
            leadAssignmentRulesFile: summary.leadAssignmentRulesFile,
            leadAssignmentRegisterFile: summary.leadAssignmentRegisterFile,
            leadAssignmentGeneratedRulesFile:
              summary.leadAssignmentGeneratedRulesFile,
            leadAssignmentRegisterRuleCount:
              summary.leadAssignmentRegisterRuleCount,
            leadAssignmentRegisterWorkspaceId:
              summary.leadAssignmentRegisterWorkspaceId,
            postLaunchAssignmentStackStatus:
              summary.postLaunchAssignmentStackStatus,
            postLaunchAssignmentPoolStrategy:
              summary.postLaunchAssignmentPoolStrategy,
            assignmentStackBundledSourceCount:
              summary.assignmentStackBundledSourceCount,
            assignmentStackCopiedBundledSourceCount:
              summary.assignmentStackCopiedBundledSourceCount,
            assignmentStackMissingBundledSourceCount:
              summary.assignmentStackMissingBundledSourceCount,
            assignmentStackAuditSignal:
              summary.assignmentStackAuditSignal,
            includePgStateChecks: summary.includePgStateChecks,
            checks: summary.checks.map((check) => check.name),
          }
        : summary,
      null,
      2,
    ),
  );

  if (failOnWarnings && summary.warningCount > 0) {
    process.exit(2);
  }
};

main();
