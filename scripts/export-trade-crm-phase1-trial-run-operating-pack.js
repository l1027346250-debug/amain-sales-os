'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const artifactsDir = path.join(repoRoot, 'tmp', 'trade-crm-trial-run');
const jsonOutputPath = path.join(
  artifactsDir,
  'phase1-trial-run-operating-pack.json',
);
const markdownOutputPath = path.join(
  artifactsDir,
  'phase1-trial-run-operating-pack.md',
);

const sourceArtifacts = {
  trialRunState: path.join(artifactsDir, 'phase1-trial-run-state.json'),
  uatDemo: path.join(repoRoot, 'tmp', 'trade-crm-uat', 'phase1-uat-demo-script.json'),
  handoff: path.join(repoRoot, 'tmp', 'trade-crm-handoff', 'phase1-handoff-package.json'),
  trialPackReview: path.join(
    repoRoot,
    'tmp',
    'trade-crm-trial',
    'business-trial-pack',
    'phase1-business-trial-pack-review.json',
  ),
  liveInputCheck: path.join(
    repoRoot,
    'tmp',
    'trade-crm-trial',
    'business-trial-pack',
    'phase1-business-trial-live-input-check.json',
  ),
  importRegister: path.join(
    repoRoot,
    'tmp',
    'trade-crm-trial',
    'business-trial-pack',
    'import-register.csv',
  ),
  sellerSignoff: path.join(
    repoRoot,
    'tmp',
    'trade-crm-trial',
    'business-trial-pack',
    'seller-signoff.csv',
  ),
  managerSignoff: path.join(
    repoRoot,
    'tmp',
    'trade-crm-trial',
    'business-trial-pack',
    'manager-signoff.csv',
  ),
};

const readJsonIfExists = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');

  return JSON.parse(raw);
};

const countDataRows = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return 0;
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line, index) => index > 0 && line.trim().length > 0).length;
};

const buildGate = ({ id, name, expectedStatus, actualStatus, artifactPath }) => {
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
  const trialRunState = readJsonIfExists(sourceArtifacts.trialRunState);
  const uatDemo = readJsonIfExists(sourceArtifacts.uatDemo);
  const handoff = readJsonIfExists(sourceArtifacts.handoff);
  const trialPackReview = readJsonIfExists(sourceArtifacts.trialPackReview);
  const liveInputCheck = readJsonIfExists(sourceArtifacts.liveInputCheck);

  const gates = [
    buildGate({
      id: '7.1.1.G1',
      name: 'Trial run state is active',
      expectedStatus: 'trial_run_active',
      actualStatus: trialRunState?.status,
      artifactPath: sourceArtifacts.trialRunState,
    }),
    buildGate({
      id: '7.1.1.G2',
      name: 'Dual-view UAT demo is ready',
      expectedStatus: 'ready_for_demo',
      actualStatus: uatDemo?.status,
      artifactPath: sourceArtifacts.uatDemo,
    }),
    buildGate({
      id: '7.1.1.G3',
      name: 'Handoff package is ready',
      expectedStatus: 'ready_for_handoff',
      actualStatus: handoff?.status,
      artifactPath: sourceArtifacts.handoff,
    }),
    buildGate({
      id: '7.1.1.G4',
      name: 'Business trial pack is ready for real data',
      expectedStatus: 'ready_for_real_data_trial',
      actualStatus: trialPackReview?.status,
      artifactPath: sourceArtifacts.trialPackReview,
    }),
    buildGate({
      id: '7.1.1.G5',
      name: 'Business-owned input check is clean',
      expectedStatus: 'ready_for_business_owned_input',
      actualStatus: liveInputCheck?.status,
      artifactPath: sourceArtifacts.liveInputCheck,
    }),
  ];

  const fileChecks = [
    {
      id: '7.1.1.F1',
      name: 'Seller sign-off working file',
      path: sourceArtifacts.sellerSignoff,
      rowCount: countDataRows(sourceArtifacts.sellerSignoff),
    },
    {
      id: '7.1.1.F2',
      name: 'Manager sign-off working file',
      path: sourceArtifacts.managerSignoff,
      rowCount: countDataRows(sourceArtifacts.managerSignoff),
    },
    {
      id: '7.1.1.F3',
      name: 'Import register working file',
      path: sourceArtifacts.importRegister,
      rowCount: countDataRows(sourceArtifacts.importRegister),
    },
  ].map((fileCheck) => ({
    ...fileCheck,
    status: fs.existsSync(fileCheck.path) && fileCheck.rowCount > 0 ? 'passed' : 'failed',
  }));

  const failedGates = gates.filter((gate) => gate.status !== 'passed');
  const failedFileChecks = fileChecks.filter((fileCheck) => fileCheck.status !== 'passed');
  const status =
    failedGates.length === 0 && failedFileChecks.length === 0
      ? 'ready_for_day1_execution'
      : 'blocked';

  return {
    status,
    generatedAt: new Date().toISOString(),
    sourceArtifacts,
    gates,
    fileChecks,
    failedGateIds: failedGates.map((gate) => gate.id),
    failedFileCheckIds: failedFileChecks.map((fileCheck) => fileCheck.id),
    summaries: {
      seller: trialPackReview?.sellerSummary ?? null,
      manager: trialPackReview?.managerSummary ?? null,
      import: trialPackReview?.importSummary ?? null,
      knownRisks: trialRunState?.knownRisks ?? [],
    },
    executionPlan: [
      {
        id: '7.2.1',
        owner: 'operator',
        window: 'Before trial session',
        action: 'Run npm run enter:trade-crm-phase1-trial-run:local and confirm this pack is ready_for_day1_execution.',
        evidence: markdownOutputPath,
      },
      {
        id: '7.3.1',
        owner: 'seller',
        window: 'Trial session step 1',
        action: 'Execute seller workbench, lead follow-up, customer follow-up, opportunity next-action, and AI suggestion checks.',
        evidence: sourceArtifacts.sellerSignoff,
      },
      {
        id: '7.4.1',
        owner: 'manager',
        window: 'Trial session step 2',
        action: 'Review new leads, overdue first response, stalled opportunities, and team execution status.',
        evidence: sourceArtifacts.managerSignoff,
      },
      {
        id: '7.5.1',
        owner: 'operator',
        window: 'Controlled data batch',
        action: 'Log each approved Companies, People, Leads, and Opportunities batch in the import register before and after execution.',
        evidence: sourceArtifacts.importRegister,
      },
      {
        id: '7.6.1',
        owner: 'operator',
        window: 'Daily closeout',
        action: 'Run npm run verify:trade-crm-phase1-closeout:local and keep the trial scope frozen until all gates remain green.',
        evidence: sourceArtifacts.trialRunState,
      },
    ],
    stopConditions: [
      'Any trial-run gate fails or failedGateIds is not empty.',
      'Any seller or manager sign-off row is rejected or accepted with incomplete checklist fields.',
      'Any approved import row is missing owner mapping, staff level confirmation, approval, or import date.',
      'Any trial batch requires rollback before the daily closeout command is green again.',
      'Any requested change expands to phase-2 objects, ERP full-process integration, AI key-status mutation, or permission-system rewrite.',
    ],
    commands: [
      'npm run enter:trade-crm-phase1-trial-run:local',
      'npm run export:trade-crm-phase1-trial-run-operating-pack',
      'npm run verify:trade-crm-phase1-closeout:local',
    ],
  };
};

const toMarkdown = (summary) => {
  const lines = [
    '# Trade CRM Phase 1 Trial Run Operating Pack',
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
    '## Working Files',
    '',
    ...summary.fileChecks.map(
      (fileCheck) =>
        `- ${fileCheck.id} ${fileCheck.name}: ${fileCheck.status.toUpperCase()} (${fileCheck.rowCount} rows) ${fileCheck.path}`,
    ),
    '',
    '## Current Summaries',
    '',
    `- seller accepted: ${summary.summaries.seller?.acceptedCount ?? 'n/a'} / ${summary.summaries.seller?.rowCount ?? 'n/a'}`,
    `- manager accepted: ${summary.summaries.manager?.acceptedCount ?? 'n/a'} / ${summary.summaries.manager?.rowCount ?? 'n/a'}`,
    `- approved import batches: ${summary.summaries.import?.approvedCount ?? 'n/a'} / ${summary.summaries.import?.rowCount ?? 'n/a'}`,
    '',
    '## Execution Plan',
    '',
    ...summary.executionPlan.flatMap((step) => [
      `- ${step.id} ${step.window}`,
      `  - owner: ${step.owner}`,
      `  - action: ${step.action}`,
      `  - evidence: ${step.evidence}`,
    ]),
    '',
    '## Stop Conditions',
    '',
    ...summary.stopConditions.map((condition) => `- ${condition}`),
    '',
    '## Commands',
    '',
    ...summary.commands.map((command) => `- \`${command}\``),
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
        failedFileCheckIds: summary.failedFileCheckIds,
      },
      null,
      2,
    ),
  );

  if (summary.status !== 'ready_for_day1_execution') {
    process.exit(1);
  }
};

main();
