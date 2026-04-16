'use strict';

const fs = require('node:fs');
const path = require('node:path');

function parseArgs(argv) {
  const options = {
    baseUrl: 'http://127.0.0.1:3020',
    recent: 5,
    outDir: path.resolve(process.cwd(), 'tmp', 'ops-report'),
    format: 'default',
  };

  for (const argument of argv) {
    if (argument.startsWith('--base-url=')) {
      options.baseUrl = argument.slice('--base-url='.length);
      continue;
    }

    if (argument.startsWith('--recent=')) {
      const value = Number(argument.slice('--recent='.length));

      if (!Number.isNaN(value) && value > 0) {
        options.recent = value;
      }

      continue;
    }

    if (argument.startsWith('--out-dir=')) {
      options.outDir = path.resolve(argument.slice('--out-dir='.length));
      continue;
    }

    if (argument.startsWith('--format=')) {
      const value = argument.slice('--format='.length);

      if (value === 'default' || value === 'weekly-summary') {
        options.format = value;
      }
    }
  }

  return options;
}

async function requestJson(url) {
  const response = await fetch(url);
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText} ${text}`,
    );
  }

  return body;
}

function formatList(items, renderItem, emptyLabel) {
  if (!Array.isArray(items) || items.length === 0) {
    return [`- ${emptyLabel}`];
  }

  return items.map((item) => `- ${renderItem(item)}`);
}

function formatProcessedConsumers(processedByConsumer) {
  const entries = Object.entries(processedByConsumer ?? {});

  if (entries.length === 0) {
    return 'none';
  }

  return entries
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([consumerName, count]) => `${consumerName}=${count}`)
    .join(', ');
}

function buildProcessedConsumerAuditNarrative(processedByConsumer) {
  const entries = Object.entries(processedByConsumer ?? {}).sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  );

  if (entries.length === 0) {
    return 'No named downstream consumer acknowledgements were recorded in the current snapshot.';
  }

  const totalConsumers = entries.length;
  const detail = entries
    .map(([consumerName, count]) => `${consumerName} (${count})`)
    .join(', ');

  if (totalConsumers === 1) {
    return `1 downstream consumer acknowledged processed outbox events: ${detail}.`;
  }

  return `${totalConsumers} downstream consumers acknowledged processed outbox events: ${detail}.`;
}

function buildProcessedConsumerAuditNarrativeZh(processedByConsumer) {
  const entries = Object.entries(processedByConsumer ?? {}).sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  );

  if (entries.length === 0) {
    return '当前快照中没有记录到已命名的下游消费方确认。';
  }

  const detail = entries
    .map(([consumerName, count]) => `${consumerName}（${count}）`)
    .join('，');

  if (entries.length === 1) {
    return `当前有 1 个下游消费方已确认 processed outbox 事件：${detail}。`;
  }

  return `当前有 ${entries.length} 个下游消费方已确认 processed outbox 事件：${detail}。`;
}

function buildMarkdownReport(state, exceptions, options) {
  if (options.format === 'weekly-summary') {
    return buildWeeklySummaryReport(state, exceptions, options);
  }

  const lines = [
    '# Trade CRM Integration Hub Ops Report',
    '',
    `- Generated At: ${new Date().toISOString()}`,
    `- Base URL: ${options.baseUrl}`,
    `- Recent Limit: ${options.recent}`,
    `- State Backend: ${state.stateBackend ?? 'unknown'}`,
    `- State Dir: ${state.stateDir ?? 'N/A'}`,
    `- Outbox Audit Snapshot: ready=${state.outbox?.summary?.ready ?? 0}, processed=${state.outbox?.summary?.processed ?? 0}`,
    `- Processed Consumers: ${formatProcessedConsumers(state.outbox?.summary?.processedByConsumer)}`,
    '',
    '## State Summary',
    '',
    `- Ready Outbox Events: ${state.outbox?.summary?.ready ?? 0}`,
    `- Processed Outbox Events: ${state.outbox?.summary?.processed ?? 0}`,
    `- Pending Sync Jobs: ${state.syncJobs?.summary?.pending ?? 0}`,
    `- Failed Sync Jobs: ${state.syncJobs?.summary?.failed ?? 0}`,
    `- Processed Webhook Events: ${state.webhookEvents?.summary?.processed ?? 0}`,
    `- Ignored Webhook Events: ${state.webhookEvents?.summary?.ignored ?? 0}`,
    `- Applied First Response Tasks: ${state.leadMonitoring?.summary?.appliedTaskCount ?? 0}`,
    `- Duplicate Apply Blocked: ${state.leadMonitoring?.summary?.duplicateApplyBlockedCount ?? 0}`,
    '',
    '## Outbox Audit Snapshot',
    '',
    `- Ready Events: ${state.outbox?.summary?.ready ?? 0}`,
    `- Processed Events: ${state.outbox?.summary?.processed ?? 0}`,
    `- Processed Consumers: ${formatProcessedConsumers(state.outbox?.summary?.processedByConsumer)}`,
    `- Lead Events: ${state.outbox?.summary?.byAggregateType?.lead ?? 0}`,
    `- Opportunity Events: ${state.outbox?.summary?.byAggregateType?.opportunity ?? 0}`,
    '',
    '## Recent Sync Jobs',
    '',
    ...formatList(
      state.syncJobs?.recentJobs,
      (job) =>
        `${job.id} | ${job.status} | retry=${job.retryCount}/${job.maxRetries} | updatedAt=${job.updatedAt}`,
      'No recent sync jobs',
    ),
    '',
    '## Recent Outbox Events',
    '',
    ...formatList(
      state.outbox?.recentEvents,
      (event) =>
        `${event.id} | ${event.eventType} | ${event.aggregateType}:${event.aggregateId} | status=${event.status}`,
      'No recent outbox events',
    ),
    '',
    '## Recent Webhook Events',
    '',
    ...formatList(
      state.webhookEvents?.recentEvents,
      (event) =>
        `${event.id} | ${event.event} | ${event.status} | handler=${event.handler}`,
      'No recent webhook events',
    ),
    '',
    '## Recent Applied First Response Tasks',
    '',
    ...formatList(
      state.leadMonitoring?.recentAppliedTaskRecords,
      (record) =>
        `${record.id} | lead=${record.leadId} | task=${record.recordId ?? 'N/A'} | appliedAt=${record.appliedAt}`,
      'No applied first response task records',
    ),
    '',
    '## Exceptions',
    '',
    `- Pending Jobs: ${exceptions.syncJobs?.pendingCount ?? 0}`,
    `- Failed Jobs: ${exceptions.syncJobs?.failedCount ?? 0}`,
    `- Failed Webhook Events: ${exceptions.webhookEvents?.failedCount ?? 0}`,
    `- Ignored Webhook Events: ${exceptions.webhookEvents?.ignoredCount ?? 0}`,
    `- Prepared Tasks Without Assignee: ${exceptions.leadMonitoring?.preparedTaskWithoutAssigneeCount ?? 0}`,
    '',
    '## Recent Sync Errors',
    '',
    ...formatList(
      exceptions.syncJobs?.recentSyncErrors,
      (error) =>
        `${error.jobId} | ${error.status} | ${error.category ?? 'unknown'} | ${error.statusCode ?? 'N/A'} | ${error.message ?? 'N/A'}`,
      'No recent sync errors',
    ),
    '',
    '## Recent Ignored Webhook Events',
    '',
    ...formatList(
      exceptions.webhookEvents?.recentIgnoredEvents,
      (event) =>
        `${event.id} | ${event.event} | ${event.summary}`,
      'No ignored webhook events',
    ),
    '',
  ];

  return lines.join('\n');
}

function buildWeeklySummaryReport(state, exceptions, options) {
  const appliedTasks = state.leadMonitoring?.summary?.appliedTaskCount ?? 0;
  const readyOutboxEvents = state.outbox?.summary?.ready ?? 0;
  const processedOutboxEvents = state.outbox?.summary?.processed ?? 0;
  const processedWebhooks = state.webhookEvents?.summary?.processed ?? 0;
  const pendingJobs = exceptions.syncJobs?.pendingCount ?? 0;
  const failedJobs = exceptions.syncJobs?.failedCount ?? 0;
  const ignoredWebhooks = exceptions.webhookEvents?.ignoredCount ?? 0;
  const duplicateBlocked =
    state.leadMonitoring?.summary?.duplicateApplyBlockedCount ?? 0;
  const unassignedPrepared =
    exceptions.leadMonitoring?.preparedTaskWithoutAssigneeCount ?? 0;
  const recentErrors = exceptions.syncJobs?.recentSyncErrors ?? [];
  const recentIgnored = exceptions.webhookEvents?.recentIgnoredEvents ?? [];
  const outboxAuditStatus = buildOutboxAuditStatus(
    readyOutboxEvents,
    processedOutboxEvents,
  );
  const processedConsumerAuditNarrative =
    buildProcessedConsumerAuditNarrative(
      state.outbox?.summary?.processedByConsumer,
    );
  const processedConsumerAuditNarrativeZh =
    buildProcessedConsumerAuditNarrativeZh(
      state.outbox?.summary?.processedByConsumer,
    );

  const riskLines = [];

  if (failedJobs > 0) {
    riskLines.push(`- Failed sync jobs: ${failedJobs}`);
  }

  if (pendingJobs > 0) {
    riskLines.push(`- Pending sync jobs awaiting retry: ${pendingJobs}`);
  }

  if (unassignedPrepared > 0) {
    riskLines.push(
      `- Prepared first response tasks without assignee: ${unassignedPrepared}`,
    );
  }

  if (riskLines.length === 0) {
    riskLines.push('- No active operational risk detected in current snapshot');
  }

  const blockerLines = [];

  if (recentErrors.length > 0) {
    blockerLines.push(
      ...recentErrors.map(
        (error) =>
          `- ${error.jobId} | ${error.category ?? 'unknown'} | ${error.message ?? 'N/A'}`,
      ),
    );
  } else {
    blockerLines.push('- No current retry blocker in recent sync errors');
  }

  const recoveryLines = [];

  if (appliedTasks > 0) {
    recoveryLines.push(
      `- First response applied task records are persisted and restart-safe: ${appliedTasks}`,
    );
  }

  if (processedWebhooks > 0) {
    recoveryLines.push(`- Processed webhook events persisted: ${processedWebhooks}`);
  }

  if (processedOutboxEvents > 0) {
    recoveryLines.push(
      `- Processed outbox events available for downstream audit: ${processedOutboxEvents}`,
    );
  }

  if (duplicateBlocked > 0) {
    recoveryLines.push(
      `- Duplicate first response task apply requests blocked: ${duplicateBlocked}`,
    );
  }

  if (recoveryLines.length === 0) {
    recoveryLines.push('- No recovered operational state in current snapshot');
  }

  const followUpLines = [];

  if (pendingJobs > 0) {
    followUpLines.push('- Review pending retry jobs and confirm upstream Twenty stability');
  }

  if (ignoredWebhooks > 0 || recentIgnored.length > 0) {
    followUpLines.push('- Review ignored webhook events to confirm they are out of current phase 1 scope');
  }

  if (unassignedPrepared > 0) {
    followUpLines.push('- Confirm assignee routing for prepared first response tasks');
  }

  if (followUpLines.length === 0) {
    followUpLines.push('- Continue monitoring with current smoke and ops export commands');
  }

  return [
    '# Trade CRM Integration Hub Weekly Ops Summary',
    '',
    `- Generated At: ${new Date().toISOString()}`,
    `- Base URL: ${options.baseUrl}`,
    `- Recent Limit: ${options.recent}`,
    `- State Backend: ${state.stateBackend ?? 'unknown'}`,
    '',
    '## Highlights',
    '',
    `- State Backend: ${state.stateBackend ?? 'unknown'}`,
    `- Audit Status: ${outboxAuditStatus}`,
    `- Ready Outbox Events: ${readyOutboxEvents}`,
    `- Processed Outbox Events: ${processedOutboxEvents}`,
    `- Processed Consumers: ${formatProcessedConsumers(state.outbox?.summary?.processedByConsumer)}`,
    `- Processed Consumer Audit Summary: ${processedConsumerAuditNarrative}`,
    `- Processed Consumer Audit Summary (ZH): ${processedConsumerAuditNarrativeZh}`,
    `- Pending Sync Jobs: ${pendingJobs}`,
    `- Failed Sync Jobs: ${failedJobs}`,
    `- Processed Webhook Events: ${processedWebhooks}`,
    `- Applied First Response Tasks: ${appliedTasks}`,
    '',
    '## Risks',
    '',
    ...riskLines,
    '',
    '## Blockers',
    '',
    ...blockerLines,
    '',
    '## Recovered State',
    '',
    ...recoveryLines,
    '',
    '## Follow-up',
    '',
    ...followUpLines,
    '',
  ].join('\n');
}

function buildOutboxAuditStatus(readyOutboxEvents, processedOutboxEvents) {
  if (readyOutboxEvents === 0 && processedOutboxEvents === 0) {
    return 'idle (no outbox audit activity in current snapshot)';
  }

  if (readyOutboxEvents === 0 && processedOutboxEvents > 0) {
    return 'cleared (observed outbox events already processed downstream)';
  }

  if (readyOutboxEvents > 0 && processedOutboxEvents === 0) {
    return 'pending consumption (ready outbox events are waiting for downstream pull)';
  }

  return 'mixed (processed history exists while some outbox events are still waiting)';
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const state = await requestJson(
    `${options.baseUrl}/api/ops/state?recent=${options.recent}`,
  );
  const exceptions = await requestJson(
    `${options.baseUrl}/api/ops/exceptions?recent=${options.recent}`,
  );

  fs.mkdirSync(options.outDir, { recursive: true });

  const statePath = path.join(options.outDir, 'ops-state.json');
  const exceptionsPath = path.join(options.outDir, 'ops-exceptions.json');
  const markdownPath = path.join(options.outDir, 'ops-report.md');
  const weeklySummaryPath = path.join(options.outDir, 'ops-weekly-summary.md');

  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  fs.writeFileSync(exceptionsPath, JSON.stringify(exceptions, null, 2));
  fs.writeFileSync(
    markdownPath,
    buildMarkdownReport(state, exceptions, {
      ...options,
      format: 'default',
    }),
  );
  fs.writeFileSync(
    weeklySummaryPath,
    buildMarkdownReport(state, exceptions, {
      ...options,
      format: 'weekly-summary',
    }),
  );

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        baseUrl: options.baseUrl,
        outDir: options.outDir,
        files: {
          state: statePath,
          exceptions: exceptionsPath,
          markdown: markdownPath,
          weeklySummary: weeklySummaryPath,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
