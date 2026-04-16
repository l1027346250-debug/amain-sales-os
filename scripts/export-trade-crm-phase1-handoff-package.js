'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const artifactsDir = path.join(repoRoot, 'tmp', 'trade-crm-handoff');
const jsonOutputPath = path.join(artifactsDir, 'phase1-handoff-package.json');
const markdownOutputPath = path.join(artifactsDir, 'phase1-handoff-package.md');

const sourceArtifacts = {
  readiness: path.join(
    repoRoot,
    'tmp',
    'trade-crm-readiness',
    'phase1-readiness-summary.json',
  ),
  smoke: path.join(repoRoot, 'tmp', 'trade-crm-smoke', 'last-smoke-summary.json'),
  convergence: path.join(
    repoRoot,
    'tmp',
    'trade-crm-convergence',
    'phase1-convergence-summary.json',
  ),
  trialReadiness: path.join(
    repoRoot,
    'tmp',
    'trade-crm-trial',
    'phase1-business-trial-readiness.json',
  ),
  trialPackReview: path.join(
    repoRoot,
    'tmp',
    'trade-crm-trial',
    'business-trial-pack',
    'phase1-business-trial-pack-review.json',
  ),
  uatDemoScript: path.join(
    repoRoot,
    'tmp',
    'trade-crm-uat',
    'phase1-uat-demo-script.json',
  ),
  assignmentStackReport: path.join(
    repoRoot,
    'tmp',
    'trade-crm-smoke',
    'post-launch-assignment-stack-report',
    'post-launch-assignment-stack-report.json',
  ),
  runtimeActivationReadinessReport: path.join(
    repoRoot,
    'tmp',
    'trade-crm-post-launch-runtime-assignment-activation-report',
    'post-launch-runtime-assignment-activation-readiness.json',
  ),
  runtimeActivationExecution: path.join(
    repoRoot,
    'tmp',
    'trade-crm-post-launch-runtime-assignment-activation-execution',
    'post-launch-runtime-assignment-activation-execution.json',
  ),
};

const baselineCommands = [
  'npm run verify:trade-crm-phase1-readiness',
  'npm run verify:trade-crm-phase1-readiness:full',
  'npm run verify:trade-crm-smoke:local',
  'npm run verify:trade-crm-phase1-convergence',
];

const readJsonIfExists = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');

  return JSON.parse(raw);
};

const fileExists = (filePath) => fs.existsSync(filePath);

const buildVerificationSummary = ({
  readiness,
  smoke,
  convergence,
  trialReadiness,
  trialPackReview,
  uatDemoScript,
  assignmentStackReport,
  runtimeActivationReadinessReport,
}) => {
  const checks = [
    {
      id: 'readiness',
      status: readiness?.status ?? 'missing',
      path: sourceArtifacts.readiness,
    },
    {
      id: 'smoke',
      status: smoke?.status ?? 'missing',
      path: sourceArtifacts.smoke,
    },
    {
      id: 'convergence',
      status: convergence?.status ?? 'missing',
      path: sourceArtifacts.convergence,
    },
    {
      id: 'trial_readiness',
      status: trialReadiness?.status ?? 'missing',
      path: sourceArtifacts.trialReadiness,
    },
    {
      id: 'trial_pack_review',
      status: trialPackReview?.status ?? 'missing',
      path: sourceArtifacts.trialPackReview,
    },
    {
      id: 'uat_demo_script',
      status: uatDemoScript?.status ?? 'missing',
      path: sourceArtifacts.uatDemoScript,
    },
    {
      id: 'assignment_stack_report',
      status: assignmentStackReport?.status ?? 'missing',
      path: sourceArtifacts.assignmentStackReport,
    },
    {
      id: 'runtime_activation_readiness_report',
      status: runtimeActivationReadinessReport?.status ?? 'missing',
      path: sourceArtifacts.runtimeActivationReadinessReport,
    },
  ];

  const blockingChecks = checks.filter(
    (check) =>
      ![
        'passed',
        'ok',
        'accepted',
        'prepared',
        'ready_for_manual_activation',
        'ready_for_real_data_trial',
        'ready_for_demo',
      ].includes(check.status),
  );

  return {
    checks,
    blockingChecks,
    allChecksPass: blockingChecks.length === 0,
  };
};

const evaluate = () => {
  const readiness = readJsonIfExists(sourceArtifacts.readiness);
  const smoke = readJsonIfExists(sourceArtifacts.smoke);
  const convergence = readJsonIfExists(sourceArtifacts.convergence);
  const trialReadiness = readJsonIfExists(sourceArtifacts.trialReadiness);
  const trialPackReview = readJsonIfExists(sourceArtifacts.trialPackReview);
  const uatDemoScript = readJsonIfExists(sourceArtifacts.uatDemoScript);
  const assignmentStackReport = readJsonIfExists(sourceArtifacts.assignmentStackReport);
  const runtimeActivationReadinessReport = readJsonIfExists(
    sourceArtifacts.runtimeActivationReadinessReport,
  );
  const runtimeActivationExecution = readJsonIfExists(
    sourceArtifacts.runtimeActivationExecution,
  );

  const verification = buildVerificationSummary({
    readiness,
    smoke,
    convergence,
    trialReadiness,
    trialPackReview,
    uatDemoScript,
    assignmentStackReport,
    runtimeActivationReadinessReport,
  });

  const knownRisks = [];

  if ((smoke?.warningCount ?? 0) > 0) {
    knownRisks.push({
      id: 'R-001',
      severity: 'low',
      title: 'Smoke warning present',
      detail: `Smoke warningCount=${smoke.warningCount}, warningCodes=${JSON.stringify(
        smoke.warningCodes ?? [],
      )}`,
    });
  }

  if (!fileExists(sourceArtifacts.runtimeActivationExecution)) {
    knownRisks.push({
      id: 'R-002',
      severity: 'medium',
      title: 'Runtime activation execution evidence missing',
      detail:
        'Activation execution JSON is missing; runtime assignment activation cannot be replay-audited.',
    });
  }

  const missingArtifacts = Object.entries(sourceArtifacts)
    .filter(([, filePath]) => !fileExists(filePath))
    .map(([artifactId, filePath]) => ({ artifactId, filePath }));

  const packageStatus =
    verification.allChecksPass && missingArtifacts.length === 0
      ? 'ready_for_handoff'
      : 'blocked';

  return {
    status: packageStatus,
    generatedAt: new Date().toISOString(),
    baselineCommands,
    codeStatus: {
      workspaceType: 'non_git_workspace',
      note:
        'Git metadata unavailable in this workspace; use artifact timestamps and command outputs as delivery evidence.',
    },
    sourceArtifacts,
    missingArtifacts,
    verification,
    knownRisks,
    nextStageEntry:
      packageStatus === 'ready_for_handoff'
        ? {
            gate: 'phase1_handoff_ready',
            recommendation:
              'Run business-side UAT demo script and keep phase-1 scope frozen while collecting sign-off records.',
          }
        : {
            gate: 'phase1_handoff_blocked',
            recommendation:
              'Resolve missing artifacts or blocking verification checks before handoff.',
          },
    runtimeActivationExecution: runtimeActivationExecution
      ? {
          status: runtimeActivationExecution.status ?? null,
          outputRegisterFile:
            runtimeActivationExecution.files?.currentRegisterFile ?? null,
          outputRulesFile:
            runtimeActivationExecution.files?.rulesJsonOutputFile ?? null,
        }
      : null,
  };
};

const toMarkdown = (summary) => {
  const lines = [
    '# Trade CRM Phase 1 Handoff Package',
    '',
    `Generated at: ${summary.generatedAt}`,
    `Status: ${summary.status.toUpperCase()}`,
    '',
    '## Code Status',
    '',
    `- workspaceType: ${summary.codeStatus.workspaceType}`,
    `- note: ${summary.codeStatus.note}`,
    '',
    '## Baseline Commands',
    '',
    ...summary.baselineCommands.map((command) => `- \`${command}\``),
    '',
    '## Verification',
    '',
    ...summary.verification.checks.map(
      (check) => `- ${check.id}: ${check.status} (\`${check.path}\`)`,
    ),
    '',
    '## Missing Artifacts',
    '',
    ...(summary.missingArtifacts.length === 0
      ? ['- none']
      : summary.missingArtifacts.map(
          (artifact) => `- ${artifact.artifactId}: \`${artifact.filePath}\``,
        )),
    '',
    '## Known Risks',
    '',
    ...(summary.knownRisks.length === 0
      ? ['- none']
      : summary.knownRisks.map(
          (risk) => `- ${risk.id} [${risk.severity}] ${risk.title}: ${risk.detail}`,
        )),
    '',
    '## Next Stage Entry',
    '',
    `- gate: ${summary.nextStageEntry.gate}`,
    `- recommendation: ${summary.nextStageEntry.recommendation}`,
    '',
  ];

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
        missingArtifactCount: summary.missingArtifacts.length,
        blockingCheckCount: summary.verification.blockingChecks.length,
      },
      null,
      2,
    ),
  );

  if (summary.status !== 'ready_for_handoff') {
    process.exit(1);
  }
};

main();
