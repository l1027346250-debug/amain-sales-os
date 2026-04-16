'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const artifactsDir = path.join(repoRoot, 'tmp', 'trade-crm-weekly');
const jsonOutputPath = path.join(artifactsDir, 'phase1-weekly-report.json');
const markdownOutputPath = path.join(artifactsDir, 'phase1-weekly-report.md');

const sourceArtifacts = {
  smoke: path.join(repoRoot, 'tmp', 'trade-crm-smoke', 'last-smoke-summary.json'),
  convergence: path.join(
    repoRoot,
    'tmp',
    'trade-crm-convergence',
    'phase1-convergence-summary.json',
  ),
  handoff: path.join(repoRoot, 'tmp', 'trade-crm-handoff', 'phase1-handoff-package.json'),
};

const readJsonIfExists = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');

  return JSON.parse(raw);
};

const buildWeekly = () => {
  const smoke = readJsonIfExists(sourceArtifacts.smoke);
  const convergence = readJsonIfExists(sourceArtifacts.convergence);
  const handoff = readJsonIfExists(sourceArtifacts.handoff);

  const completed = [];
  const inProgress = [];
  const newIssues = [];
  const blockers = [];
  const tomorrowPlan = [];

  if (smoke?.status === 'ok') {
    completed.push({
      id: '2.1.1',
      text: 'Sales main-path smoke checks passed',
      evidence: `smoke=${sourceArtifacts.smoke}`,
    });
  } else {
    inProgress.push({
      id: '2.1.1',
      text: 'Sales main-path smoke checks',
      status: smoke?.status ?? 'missing',
    });
  }

  if (convergence?.status === 'passed') {
    completed.push({
      id: '6.1.1',
      text: 'Phase-1 convergence checklist passed',
      evidence: `convergence=${sourceArtifacts.convergence}`,
    });
  } else {
    inProgress.push({
      id: '6.1.1',
      text: 'Phase-1 convergence checklist',
      status: convergence?.status ?? 'missing',
    });
  }

  if (handoff?.status === 'ready_for_handoff') {
    completed.push({
      id: '6.2.1',
      text: 'Handoff package status reached ready_for_handoff',
      evidence: `handoff=${sourceArtifacts.handoff}`,
    });
  } else {
    inProgress.push({
      id: '6.2.1',
      text: 'Handoff package closure',
      status: handoff?.status ?? 'missing',
    });
  }

  if ((smoke?.warningCount ?? 0) > 0) {
    newIssues.push({
      id: 'ISSUE-001',
      text: `Smoke warnings detected: ${JSON.stringify(smoke.warningCodes ?? [])}`,
      impact: 'low',
    });
  }

  if ((convergence?.failedItemIds ?? []).length > 0) {
    blockers.push({
      id: 'BLOCKER-001',
      text: `Convergence failed items: ${convergence.failedItemIds.join(', ')}`,
      ownerInput: 'Engineering',
    });
  }

  if ((handoff?.missingArtifacts ?? []).length > 0) {
    blockers.push({
      id: 'BLOCKER-002',
      text: `Handoff missing artifacts: ${handoff.missingArtifacts
        .map((item) => item.artifactId)
        .join(', ')}`,
      ownerInput: 'Engineering + QA',
    });
  }

  tomorrowPlan.push(
    {
      id: '5.2.1',
      text: 'Run dual-view UAT demo path and collect sign-off',
      expectedOutput: 'Updated trial sign-off CSV and review JSON',
    },
    {
      id: '6.1.1',
      text: 'Refresh handoff package after UAT evidence update',
      expectedOutput: 'Updated handoff JSON/MD bundle',
    },
  );

  const openItems = [
    ...(convergence?.pendingItemIds ?? []).map((id) => ({
      id,
      status: 'pending',
    })),
    ...(convergence?.failedItemIds ?? []).map((id) => ({
      id,
      status: 'failed',
    })),
  ];

  const runnableFeatures = Array.isArray(smoke?.checks)
    ? smoke.checks.map((check) => ({
        name: check.name,
        status: check.status,
      }))
    : [];

  const summary = {
    generatedAt: new Date().toISOString(),
    sourceArtifacts,
    todayProgress: {
      completed,
      inProgress,
      newIssues,
      blockers,
      tomorrowPlan,
    },
    weeklyReport: {
      completed: completed.map((item) => item.id),
      runnableFeatures,
      openItems,
      blockers,
      risks: newIssues,
      decisionsNeeded: [
        {
          id: 'D-001',
          text: 'Confirm UAT sign-off window and owner list for final handoff.',
          defaultSuggestion: 'Lock a fixed UAT window within this week.',
        },
      ],
      nextWeekPlan: tomorrowPlan.map((item) => ({
        id: item.id,
        text: item.text,
      })),
    },
  };

  return summary;
};

const toMarkdown = (summary) => {
  const lines = [
    '# Trade CRM Phase 1 Weekly Report',
    '',
    `Generated at: ${summary.generatedAt}`,
    '',
    '## Today Progress',
    '',
    '### Completed',
    ...(summary.todayProgress.completed.length === 0
      ? ['- none']
      : summary.todayProgress.completed.map(
          (item) => `- [${item.id}] ${item.text} | evidence: ${item.evidence}`,
        )),
    '',
    '### In Progress',
    ...(summary.todayProgress.inProgress.length === 0
      ? ['- none']
      : summary.todayProgress.inProgress.map(
          (item) => `- [${item.id}] ${item.text} | status: ${item.status}`,
        )),
    '',
    '### New Issues',
    ...(summary.todayProgress.newIssues.length === 0
      ? ['- none']
      : summary.todayProgress.newIssues.map(
          (item) => `- [${item.id}] ${item.text} | impact: ${item.impact}`,
        )),
    '',
    '### Blockers',
    ...(summary.todayProgress.blockers.length === 0
      ? ['- none']
      : summary.todayProgress.blockers.map(
          (item) => `- [${item.id}] ${item.text} | need: ${item.ownerInput}`,
        )),
    '',
    '### Tomorrow Plan',
    ...(summary.todayProgress.tomorrowPlan.length === 0
      ? ['- none']
      : summary.todayProgress.tomorrowPlan.map(
          (item) => `- [${item.id}] ${item.text} | output: ${item.expectedOutput}`,
        )),
    '',
    '## Weekly Report',
    '',
    '### This Week Completed',
    ...(summary.weeklyReport.completed.length === 0
      ? ['- none']
      : summary.weeklyReport.completed.map((id) => `- [${id}] completed`)),
    '',
    '### Runnable Features',
    ...(summary.weeklyReport.runnableFeatures.length === 0
      ? ['- none']
      : summary.weeklyReport.runnableFeatures.map(
          (feature) => `- ${feature.name}: ${feature.status}`,
        )),
    '',
    '### Open Items',
    ...(summary.weeklyReport.openItems.length === 0
      ? ['- none']
      : summary.weeklyReport.openItems.map(
          (item) => `- [${item.id}] ${item.status}`,
        )),
    '',
    '### Blockers',
    ...(summary.weeklyReport.blockers.length === 0
      ? ['- none']
      : summary.weeklyReport.blockers.map((item) => `- [${item.id}] ${item.text}`)),
    '',
    '### Risks',
    ...(summary.weeklyReport.risks.length === 0
      ? ['- none']
      : summary.weeklyReport.risks.map((item) => `- [${item.id}] ${item.text}`)),
    '',
    '### Decisions Needed',
    ...summary.weeklyReport.decisionsNeeded.map(
      (item) => `- [${item.id}] ${item.text} | suggestion: ${item.defaultSuggestion}`,
    ),
    '',
    '### Next Week Plan',
    ...summary.weeklyReport.nextWeekPlan.map(
      (item) => `- [${item.id}] ${item.text}`,
    ),
    '',
  ];

  return `${lines.join('\n')}\n`;
};

const main = () => {
  fs.mkdirSync(artifactsDir, { recursive: true });

  const summary = buildWeekly();

  fs.writeFileSync(jsonOutputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  fs.writeFileSync(markdownOutputPath, toMarkdown(summary), 'utf8');

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        jsonOutputPath,
        markdownOutputPath,
      },
      null,
      2,
    ),
  );
};

main();
