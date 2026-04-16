'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const artifactsDir = path.join(repoRoot, 'tmp', 'trade-crm-trial-run');
const jsonOutputPath = path.join(artifactsDir, 'phase1-trial-run-daily-report.json');
const markdownOutputPath = path.join(artifactsDir, 'phase1-trial-run-daily-report.md');
const historyOutputPath = path.join(
  artifactsDir,
  'phase1-trial-run-daily-history.jsonl',
);
const archiveDir = path.join(artifactsDir, 'daily-archive');

const sourceArtifacts = {
  trialRunState: path.join(artifactsDir, 'phase1-trial-run-state.json'),
  operatingPack: path.join(artifactsDir, 'phase1-trial-run-operating-pack.json'),
  smoke: path.join(repoRoot, 'tmp', 'trade-crm-smoke', 'last-smoke-summary.json'),
  convergence: path.join(
    repoRoot,
    'tmp',
    'trade-crm-convergence',
    'phase1-convergence-summary.json',
  ),
  handoff: path.join(repoRoot, 'tmp', 'trade-crm-handoff', 'phase1-handoff-package.json'),
  trialPackReview: path.join(
    repoRoot,
    'tmp',
    'trade-crm-trial',
    'business-trial-pack',
    'phase1-business-trial-pack-review.json',
  ),
};

const readJsonIfExists = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');

  return JSON.parse(raw);
};

const buildStatusItem = ({ id, text, status, evidence }) => ({
  id,
  text,
  status,
  evidence,
});

const toSafeTimestamp = (timestamp) =>
  timestamp.replace(/[:.]/g, '-').replace('T', '_').replace('Z', 'Z');

const buildHistoryEntry = ({ summary, archiveJsonPath, archiveMarkdownPath }) => ({
  generatedAt: summary.generatedAt,
  status: summary.status,
  completedIds: summary.todayProgress.completed.map((item) => item.id),
  inProgressIds: summary.todayProgress.inProgress.map((item) => item.id),
  issueIds: summary.todayProgress.newIssues.map((item) => item.id),
  blockerIds: summary.todayProgress.blockers.map((item) => item.id),
  currentJsonPath: jsonOutputPath,
  currentMarkdownPath: markdownOutputPath,
  archiveJsonPath,
  archiveMarkdownPath,
});

const buildDailyReport = () => {
  const trialRunState = readJsonIfExists(sourceArtifacts.trialRunState);
  const operatingPack = readJsonIfExists(sourceArtifacts.operatingPack);
  const smoke = readJsonIfExists(sourceArtifacts.smoke);
  const convergence = readJsonIfExists(sourceArtifacts.convergence);
  const handoff = readJsonIfExists(sourceArtifacts.handoff);
  const trialPackReview = readJsonIfExists(sourceArtifacts.trialPackReview);

  const completed = [];
  const inProgress = [];
  const newIssues = [];
  const blockers = [];

  const checks = [
    {
      id: '7.1.1',
      text: 'Trial run state is active',
      passed: trialRunState?.status === 'trial_run_active',
      status: trialRunState?.status ?? 'missing',
      evidence: sourceArtifacts.trialRunState,
    },
    {
      id: '7.2.1',
      text: 'Day-1 operating pack is ready',
      passed: operatingPack?.status === 'ready_for_day1_execution',
      status: operatingPack?.status ?? 'missing',
      evidence: sourceArtifacts.operatingPack,
    },
    {
      id: '7.3.1',
      text: 'Smoke path remains green',
      passed: smoke?.status === 'ok',
      status: smoke?.status ?? 'missing',
      evidence: sourceArtifacts.smoke,
    },
    {
      id: '7.4.1',
      text: 'Phase-1 convergence remains passed',
      passed: convergence?.status === 'passed',
      status: convergence?.status ?? 'missing',
      evidence: sourceArtifacts.convergence,
    },
    {
      id: '7.5.1',
      text: 'Business trial pack remains ready for real data',
      passed: trialPackReview?.status === 'ready_for_real_data_trial',
      status: trialPackReview?.status ?? 'missing',
      evidence: sourceArtifacts.trialPackReview,
    },
    {
      id: '7.6.1',
      text: 'Handoff package remains ready',
      passed: handoff?.status === 'ready_for_handoff',
      status: handoff?.status ?? 'missing',
      evidence: sourceArtifacts.handoff,
    },
  ];

  for (const check of checks) {
    const item = buildStatusItem(check);
    if (check.passed) {
      completed.push(item);
    } else {
      inProgress.push(item);
      blockers.push({
        id: `BLOCKER-${check.id}`,
        text: `${check.text} is not green`,
        status: check.status,
        evidence: check.evidence,
      });
    }
  }

  if ((smoke?.warningCount ?? 0) > 0) {
    newIssues.push({
      id: 'ISSUE-001',
      text: `Smoke warnings detected: ${JSON.stringify(smoke.warningCodes ?? [])}`,
      severity: 'low',
      evidence: sourceArtifacts.smoke,
    });
  }

  const operatingPackFailedGateIds = operatingPack?.failedGateIds ?? [];
  const operatingPackFailedFileCheckIds = operatingPack?.failedFileCheckIds ?? [];

  if (operatingPackFailedGateIds.length > 0) {
    blockers.push({
      id: 'BLOCKER-OPERATING-GATES',
      text: `Operating-pack failed gates: ${operatingPackFailedGateIds.join(', ')}`,
      status: 'failed',
      evidence: sourceArtifacts.operatingPack,
    });
  }

  if (operatingPackFailedFileCheckIds.length > 0) {
    blockers.push({
      id: 'BLOCKER-OPERATING-FILES',
      text: `Operating-pack failed file checks: ${operatingPackFailedFileCheckIds.join(', ')}`,
      status: 'failed',
      evidence: sourceArtifacts.operatingPack,
    });
  }

  const status = blockers.length === 0 ? 'trial_day_green' : 'blocked';

  return {
    status,
    generatedAt: new Date().toISOString(),
    sourceArtifacts,
    todayProgress: {
      completed,
      inProgress,
      newIssues,
      blockers,
      tomorrowPlan: [
        {
          id: '7.7.1',
          text: 'Execute the next seller and manager trial session from the operating pack.',
          expectedOutput: 'Updated seller and manager sign-off rows, if any new trial round is run.',
        },
        {
          id: '7.8.1',
          text: 'Record each approved real-data batch in the import register before and after execution.',
          expectedOutput: 'Updated import-register.csv and refreshed operating pack.',
        },
        {
          id: '7.9.1',
          text: 'Run daily closeout after each trial batch.',
          expectedOutput: 'Green closeout and refreshed daily report.',
        },
      ],
    },
    runbook: {
      startCommand: 'npm run enter:trade-crm-phase1-trial-run:local',
      refreshDailyReportCommand: 'npm run export:trade-crm-phase1-trial-run-daily-report',
      closeoutCommand: 'npm run verify:trade-crm-phase1-closeout:local',
      stopRule:
        'Stop trial operation if status is not trial_day_green or any blocker appears.',
    },
  };
};

const toMarkdown = (summary) => {
  const lines = [
    '# Trade CRM Phase 1 Trial Run Daily Report',
    '',
    `Generated at: ${summary.generatedAt}`,
    `Status: ${summary.status.toUpperCase()}`,
    '',
    '## Today Progress',
    '',
    '### Completed',
    ...(summary.todayProgress.completed.length === 0
      ? ['- none']
      : summary.todayProgress.completed.map(
          (item) =>
            `- [${item.id}] ${item.text} | status: ${item.status} | evidence: ${item.evidence}`,
        )),
    '',
    '### In Progress',
    ...(summary.todayProgress.inProgress.length === 0
      ? ['- none']
      : summary.todayProgress.inProgress.map(
          (item) =>
            `- [${item.id}] ${item.text} | status: ${item.status} | evidence: ${item.evidence}`,
        )),
    '',
    '### New Issues',
    ...(summary.todayProgress.newIssues.length === 0
      ? ['- none']
      : summary.todayProgress.newIssues.map(
          (item) =>
            `- [${item.id}] ${item.text} | severity: ${item.severity} | evidence: ${item.evidence}`,
        )),
    '',
    '### Blockers',
    ...(summary.todayProgress.blockers.length === 0
      ? ['- none']
      : summary.todayProgress.blockers.map(
          (item) =>
            `- [${item.id}] ${item.text} | status: ${item.status} | evidence: ${item.evidence}`,
        )),
    '',
    '### Tomorrow Plan',
    ...summary.todayProgress.tomorrowPlan.map(
      (item) => `- [${item.id}] ${item.text} | output: ${item.expectedOutput}`,
    ),
    '',
    '## Runbook',
    '',
    `- start: \`${summary.runbook.startCommand}\``,
    `- refresh daily report: \`${summary.runbook.refreshDailyReportCommand}\``,
    `- closeout: \`${summary.runbook.closeoutCommand}\``,
    `- stop rule: ${summary.runbook.stopRule}`,
    '',
  ];

  return `${lines.join('\n')}\n`;
};

const main = () => {
  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.mkdirSync(archiveDir, { recursive: true });

  const summary = buildDailyReport();
  const archiveBaseName = `phase1-trial-run-daily-report-${toSafeTimestamp(
    summary.generatedAt,
  )}`;
  const archiveJsonPath = path.join(archiveDir, `${archiveBaseName}.json`);
  const archiveMarkdownPath = path.join(archiveDir, `${archiveBaseName}.md`);
  const markdown = toMarkdown(summary);

  fs.writeFileSync(jsonOutputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  fs.writeFileSync(markdownOutputPath, markdown, 'utf8');
  fs.writeFileSync(archiveJsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  fs.writeFileSync(archiveMarkdownPath, markdown, 'utf8');
  fs.appendFileSync(
    historyOutputPath,
    `${JSON.stringify(
      buildHistoryEntry({ summary, archiveJsonPath, archiveMarkdownPath }),
    )}\n`,
    'utf8',
  );

  console.log(
    JSON.stringify(
      {
        status: summary.status,
        jsonOutputPath,
        markdownOutputPath,
        historyOutputPath,
        archiveJsonPath,
        archiveMarkdownPath,
        blockerCount: summary.todayProgress.blockers.length,
      },
      null,
      2,
    ),
  );

  if (summary.status !== 'trial_day_green') {
    process.exit(1);
  }
};

main();
