'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const artifactsDir = path.join(repoRoot, 'tmp', 'trade-crm-trial-run');
const jsonOutputPath = path.join(artifactsDir, 'phase1-trial-run-state.json');
const markdownOutputPath = path.join(artifactsDir, 'phase1-trial-run-state.md');

const sourceArtifacts = {
  smoke: path.join(repoRoot, 'tmp', 'trade-crm-smoke', 'last-smoke-summary.json'),
  convergence: path.join(
    repoRoot,
    'tmp',
    'trade-crm-convergence',
    'phase1-convergence-summary.json',
  ),
  uatDemo: path.join(repoRoot, 'tmp', 'trade-crm-uat', 'phase1-uat-demo-script.json'),
  handoff: path.join(repoRoot, 'tmp', 'trade-crm-handoff', 'phase1-handoff-package.json'),
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

const buildGate = ({ id, name, expectedStatus, actualStatus, path: artifactPath }) => {
  const expectedStatuses = Array.isArray(expectedStatus)
    ? expectedStatus
    : [expectedStatus];

  return {
    id,
    name,
    status: expectedStatuses.includes(actualStatus) ? 'passed' : 'failed',
    expectedStatus: expectedStatuses,
    actualStatus: actualStatus ?? 'missing',
    artifactPath,
  };
};

const evaluate = () => {
  const smoke = readJsonIfExists(sourceArtifacts.smoke);
  const convergence = readJsonIfExists(sourceArtifacts.convergence);
  const uatDemo = readJsonIfExists(sourceArtifacts.uatDemo);
  const handoff = readJsonIfExists(sourceArtifacts.handoff);
  const trialPackReview = readJsonIfExists(sourceArtifacts.trialPackReview);
  const activationReadiness = readJsonIfExists(sourceArtifacts.activationReadiness);

  const gates = [
    buildGate({
      id: 'trial-run.1',
      name: 'Smoke path',
      expectedStatus: 'ok',
      actualStatus: smoke?.status,
      path: sourceArtifacts.smoke,
    }),
    buildGate({
      id: 'trial-run.2',
      name: 'Phase-1 convergence',
      expectedStatus: 'passed',
      actualStatus: convergence?.status,
      path: sourceArtifacts.convergence,
    }),
    buildGate({
      id: 'trial-run.3',
      name: 'Dual-view UAT demo',
      expectedStatus: 'ready_for_demo',
      actualStatus: uatDemo?.status,
      path: sourceArtifacts.uatDemo,
    }),
    buildGate({
      id: 'trial-run.4',
      name: 'Handoff package',
      expectedStatus: 'ready_for_handoff',
      actualStatus: handoff?.status,
      path: sourceArtifacts.handoff,
    }),
    buildGate({
      id: 'trial-run.5',
      name: 'Business trial pack review',
      expectedStatus: 'ready_for_real_data_trial',
      actualStatus: trialPackReview?.status,
      path: sourceArtifacts.trialPackReview,
    }),
    buildGate({
      id: 'trial-run.6',
      name: 'Runtime assignment activation readiness',
      expectedStatus: 'ok',
      actualStatus: activationReadiness?.status,
      path: sourceArtifacts.activationReadiness,
    }),
  ];
  const failedGates = gates.filter((gate) => gate.status !== 'passed');
  const status = failedGates.length === 0 ? 'trial_run_active' : 'blocked';
  const smokeWarnings =
    typeof smoke?.warningCount === 'number' && smoke.warningCount > 0
      ? [
          {
            id: 'R-001',
            severity: 'low',
            title: 'Smoke warning present',
            detail: `warningCount=${smoke.warningCount}, warningCodes=${JSON.stringify(
              smoke.warningCodes ?? [],
            )}`,
          },
        ]
      : [];

  return {
    status,
    generatedAt: new Date().toISOString(),
    sourceArtifacts,
    gates,
    failedGateIds: failedGates.map((gate) => gate.id),
    knownRisks: smokeWarnings,
    trialRunScope: {
      phase: 'phase1',
      mode: 'controlled_business_trial',
      allowedWork: [
        'seller and manager UAT execution',
        'controlled real-data trial batches recorded in the import register',
        'phase-1 lead/customer/opportunity/task operating paths',
      ],
      blockedWork: [
        'phase-2 objects or processes',
        'ERP full-process integration',
        'AI mutation of key CRM business status',
        'permission-system rewrite',
      ],
    },
    nextActions:
      status === 'trial_run_active'
        ? [
            'Run seller and manager UAT using tmp/trade-crm-uat/phase1-uat-demo-script.md.',
            'Record each real-data trial batch in tmp/trade-crm-trial/business-trial-pack/import-register.csv.',
            'Refresh npm run verify:trade-crm-phase1-closeout:local after each trial batch.',
          ]
        : [
            'Resolve failed trial-run gates and rerun npm run enter:trade-crm-phase1-trial-run.',
          ],
  };
};

const toMarkdown = (summary) => {
  const lines = [
    '# Trade CRM Phase 1 Trial Run State',
    '',
    `Generated at: ${summary.generatedAt}`,
    `Status: ${summary.status.toUpperCase()}`,
    '',
    '## Gates',
    '',
    ...summary.gates.map(
      (gate) =>
        `- ${gate.id} ${gate.name}: ${gate.status.toUpperCase()} (actual: ${gate.actualStatus})`,
    ),
    '',
    '## Scope',
    '',
    `- phase: ${summary.trialRunScope.phase}`,
    `- mode: ${summary.trialRunScope.mode}`,
    '',
    '## Allowed Work',
    '',
    ...summary.trialRunScope.allowedWork.map((item) => `- ${item}`),
    '',
    '## Blocked Work',
    '',
    ...summary.trialRunScope.blockedWork.map((item) => `- ${item}`),
    '',
    '## Known Risks',
    '',
    ...(summary.knownRisks.length === 0
      ? ['- none']
      : summary.knownRisks.map(
          (risk) => `- ${risk.id} [${risk.severity}] ${risk.title}: ${risk.detail}`,
        )),
    '',
    '## Next Actions',
    '',
    ...summary.nextActions.map((item) => `- ${item}`),
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
        failedGateIds: summary.failedGateIds,
      },
      null,
      2,
    ),
  );

  if (summary.status !== 'trial_run_active') {
    process.exit(1);
  }
};

main();
