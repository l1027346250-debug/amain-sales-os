'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const artifactsDir = path.join(repoRoot, 'tmp', 'trade-crm-uat');
const jsonOutputPath = path.join(artifactsDir, 'phase1-uat-demo-script.json');
const markdownOutputPath = path.join(artifactsDir, 'phase1-uat-demo-script.md');

const sourceArtifacts = {
  smoke: path.join(repoRoot, 'tmp', 'trade-crm-smoke', 'last-smoke-summary.json'),
  trialPackManifest: path.join(
    repoRoot,
    'tmp',
    'trade-crm-trial',
    'business-trial-pack',
    'phase1-business-trial-pack-manifest.json',
  ),
  trialPackReview: path.join(
    repoRoot,
    'tmp',
    'trade-crm-trial',
    'business-trial-pack',
    'phase1-business-trial-pack-review.json',
  ),
  activationReadiness: path.join(
    repoRoot,
    'tmp',
    'trade-crm-post-launch-runtime-assignment-activation-report',
    'post-launch-runtime-assignment-activation-readiness.json',
  ),
};

const readJsonIfExists = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');

  return JSON.parse(raw);
};

const smokeCheckMap = (smokeSummary) => {
  const checks = Array.isArray(smokeSummary?.checks) ? smokeSummary.checks : [];

  return new Map(
    checks
      .filter((entry) => typeof entry?.name === 'string')
      .map((entry) => [entry.name, entry]),
  );
};

const isTrialReviewReady = (trialPackReviewStatus) =>
  ['ready_for_real_data_trial', 'accepted', 'passed'].includes(
    trialPackReviewStatus ?? '',
  );

const evaluate = () => {
  const smoke = readJsonIfExists(sourceArtifacts.smoke);
  const trialPackManifest = readJsonIfExists(sourceArtifacts.trialPackManifest);
  const trialPackReview = readJsonIfExists(sourceArtifacts.trialPackReview);
  const activationReadiness = readJsonIfExists(sourceArtifacts.activationReadiness);

  const smokeChecks = smokeCheckMap(smoke);
  const requiredSmokeChecks = [
    'trade-crm-lead-assignment-register',
    'trade-crm-automations',
    'alibaba-lead-sync',
    'first-response-flow',
    'twenty-webhook-flow',
  ];
  const missingSmokeChecks = requiredSmokeChecks.filter(
    (checkName) => smokeChecks.get(checkName)?.status !== 'ok',
  );

  const preflight = [
    {
      id: '5.2.1.P1',
      name: 'Smoke checks for demo path',
      status: missingSmokeChecks.length === 0 ? 'passed' : 'failed',
      evidence: {
        requiredSmokeChecks,
        missingSmokeChecks,
        smokeSummaryPath: sourceArtifacts.smoke,
      },
      action:
        missingSmokeChecks.length === 0
          ? null
          : 'Run `npm run verify:trade-crm-smoke:local -- --Quiet` before demo.',
    },
    {
      id: '5.2.1.P2',
      name: 'Business trial pack prepared',
      status: trialPackManifest?.status === 'prepared' ? 'passed' : 'failed',
      evidence: {
        trialPackManifestStatus: trialPackManifest?.status ?? 'missing',
        trialPackManifestPath: sourceArtifacts.trialPackManifest,
      },
      action:
        trialPackManifest?.status === 'prepared'
          ? null
          : 'Run `npm run prepare:trade-crm-phase1-business-trial-pack` before demo.',
    },
    {
      id: '5.2.1.P3',
      name: 'Business sign-off sheet review ready',
      status: isTrialReviewReady(trialPackReview?.status) ? 'passed' : 'failed',
      evidence: {
        trialPackReviewStatus: trialPackReview?.status ?? 'missing',
        trialPackReviewPath: sourceArtifacts.trialPackReview,
      },
      action: isTrialReviewReady(trialPackReview?.status)
        ? null
        : 'Run `npm run review:trade-crm-phase1-business-trial-pack` and clear blocking rows.',
    },
    {
      id: '5.2.1.P4',
      name: 'Runtime assignment activation readiness exported',
      status: activationReadiness?.status === 'ok' ? 'passed' : 'failed',
      evidence: {
        activationReportStatus: activationReadiness?.status ?? 'missing',
        activationStatus: activationReadiness?.activationStatus ?? 'missing',
        activationReadinessPath: sourceArtifacts.activationReadiness,
      },
      action:
        activationReadiness?.status === 'ok'
          ? null
          : 'Run `npm --workspace packages/twenty-server run export:trade-crm-post-launch-runtime-assignment-activation-report`.',
    },
  ];

  const failedPreflight = preflight.filter((entry) => entry.status !== 'passed');
  const status = failedPreflight.length === 0 ? 'ready_for_demo' : 'blocked';

  const sellerSteps = [
    {
      id: '5.2.1.S1',
      title: 'Open seller workbench route',
      route: '/trade-crm/workbench',
      expected: 'Workbench cards are visible and load without blocking error.',
      evidenceReference: sourceArtifacts.smoke,
    },
    {
      id: '5.2.1.S2',
      title: 'Walk through new lead to first-response task chain',
      expected:
        'From Today New Leads to first-response task and overdue reminder context, steps are reproducible.',
      evidenceReference: 'check:first-response-flow',
    },
    {
      id: '5.2.1.S3',
      title: 'Verify lead assignment and owner routing',
      expected:
        'Assigned owner matches active assignment rule set for the lead source/category.',
      evidenceReference: 'check:trade-crm-lead-assignment-register',
    },
    {
      id: '5.2.1.S4',
      title: 'Verify opportunity follow-up and stalled marker path',
      expected:
        'Quotation follow-up and stalled logic can be explained against live queue states.',
      evidenceReference: 'check:trade-crm-automations',
    },
  ];

  const managerSteps = [
    {
      id: '5.2.1.M1',
      title: 'Review team-level queue and risk view',
      route: '/trade-crm/analytics',
      expected:
        'Manager can identify first-response risk, overdue tasks, and stalled opportunities.',
      evidenceReference: sourceArtifacts.smoke,
    },
    {
      id: '5.2.1.M2',
      title: 'Cross-check seller actions with sign-off pack',
      expected:
        'Manager sign-off sheet aligns with demonstrated actions and acceptance checklist rows.',
      evidenceReference: sourceArtifacts.trialPackReview,
    },
    {
      id: '5.2.1.M3',
      title: 'Confirm staffing/activation context for go-live',
      expected:
        'Runtime assignment activation readiness and execution evidence are available for audit.',
      evidenceReference: sourceArtifacts.activationReadiness,
    },
  ];

  return {
    status,
    generatedAt: new Date().toISOString(),
    sourceArtifacts,
    preflight,
    failedPreflightIds: failedPreflight.map((entry) => entry.id),
    demoPaths: {
      sellerView: sellerSteps,
      managerView: managerSteps,
    },
    operatorCommands: [
      'npm run verify:trade-crm-smoke:local -- --Quiet',
      'npm run verify:trade-crm-phase1-convergence',
      'npm run review:trade-crm-phase1-business-trial-pack',
    ],
  };
};

const toMarkdown = (summary) => {
  const lines = [
    '# Trade CRM Phase 1 UAT Demo Script',
    '',
    `Generated at: ${summary.generatedAt}`,
    `Status: ${summary.status.toUpperCase()}`,
    '',
    '## Preflight',
    '',
  ];

  for (const item of summary.preflight) {
    lines.push(`- ${item.id} ${item.name}: ${item.status.toUpperCase()}`);
    lines.push(`  - evidence: ${JSON.stringify(item.evidence)}`);
    if (item.action) {
      lines.push(`  - action: ${item.action}`);
    }
  }

  lines.push('');
  lines.push('## Seller View Demo Path');
  lines.push('');
  for (const step of summary.demoPaths.sellerView) {
    lines.push(`- ${step.id} ${step.title}`);
    if (step.route) {
      lines.push(`  - route: ${step.route}`);
    }
    lines.push(`  - expected: ${step.expected}`);
    lines.push(`  - evidence: ${step.evidenceReference}`);
  }

  lines.push('');
  lines.push('## Manager View Demo Path');
  lines.push('');
  for (const step of summary.demoPaths.managerView) {
    lines.push(`- ${step.id} ${step.title}`);
    if (step.route) {
      lines.push(`  - route: ${step.route}`);
    }
    lines.push(`  - expected: ${step.expected}`);
    lines.push(`  - evidence: ${step.evidenceReference}`);
  }

  lines.push('');
  lines.push('## Operator Commands');
  lines.push('');
  for (const command of summary.operatorCommands) {
    lines.push(`- \`${command}\``);
  }

  lines.push('');

  return `${lines.join('\n')}\n`;
};

const main = () => {
  fs.mkdirSync(artifactsDir, { recursive: true });

  const summary = evaluate();

  fs.writeFileSync(jsonOutputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  fs.writeFileSync(markdownOutputPath, toMarkdown(summary), 'utf8');

  console.log(
    JSON.stringify(
      {
        status: summary.status,
        jsonOutputPath,
        markdownOutputPath,
        failedPreflightIds: summary.failedPreflightIds,
      },
      null,
      2,
    ),
  );

  if (summary.status !== 'ready_for_demo') {
    process.exit(1);
  }
};

main();
