'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(repoRoot, '..');

const artifactsDir = path.join(repoRoot, 'tmp', 'trade-crm-convergence');
const jsonOutputPath = path.join(artifactsDir, 'phase1-convergence-summary.json');
const markdownOutputPath = path.join(
  artifactsDir,
  'phase1-convergence-summary.md',
);

const convergenceBaselineDocPath = path.join(
  repoRoot,
  'docs',
  'trade-crm-phase1-convergence-baseline-2026-04-15.md',
);
const progressTemplatePath = path.join(
  repoRoot,
  'docs',
  'trade-crm-phase1-progress-weekly-template.md',
);

const readinessSummaryPath = path.join(
  repoRoot,
  'tmp',
  'trade-crm-readiness',
  'phase1-readiness-summary.json',
);
const smokeSummaryPath = path.join(
  repoRoot,
  'tmp',
  'trade-crm-smoke',
  'last-smoke-summary.json',
);
const trialReadinessPath = path.join(
  repoRoot,
  'tmp',
  'trade-crm-trial',
  'phase1-business-trial-readiness.json',
);
const trialPackManifestPath = path.join(
  repoRoot,
  'tmp',
  'trade-crm-trial',
  'business-trial-pack',
  'phase1-business-trial-pack-manifest.json',
);
const trialPackReviewPath = path.join(
  repoRoot,
  'tmp',
  'trade-crm-trial',
  'business-trial-pack',
  'phase1-business-trial-pack-review.json',
);
const uatDemoScriptPath = path.join(
  repoRoot,
  'tmp',
  'trade-crm-uat',
  'phase1-uat-demo-script.json',
);
const assignmentStackReportPath = path.join(
  repoRoot,
  'tmp',
  'trade-crm-smoke',
  'post-launch-assignment-stack-report',
  'post-launch-assignment-stack-report.json',
);

const coverageReferenceFiles = [
  path.join(workspaceRoot, 'task_plan.md'),
  path.join(workspaceRoot, 'progress.md'),
  path.join(workspaceRoot, 'findings.md'),
];

const coverageMarker = '[C_LAYER_COVERED_2026-04-15]';

const readJsonIfExists = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');

  return JSON.parse(raw);
};

const readUtf8IfExists = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, 'utf8');
};

const normalizeStatus = (status) => {
  if (status !== 'passed' && status !== 'pending' && status !== 'failed') {
    return 'failed';
  }

  return status;
};

const buildItem = (id, title, status, evidence, action = null) => ({
  id,
  title,
  status: normalizeStatus(status),
  evidence,
  action,
});

const smokeCheckMap = (smokeSummary) => {
  const entries = (smokeSummary?.checks ?? [])
    .filter((check) => typeof check?.name === 'string')
    .map((check) => [check.name, check]);

  return new Map(entries);
};

const hasCoverageMarker = (filePath) => {
  const content = readUtf8IfExists(filePath);

  return Boolean(content && content.includes(coverageMarker));
};

const evaluate = () => {
  const readinessSummary = readJsonIfExists(readinessSummaryPath);
  const smokeSummary = readJsonIfExists(smokeSummaryPath);
  const trialPackManifest = readJsonIfExists(trialPackManifestPath);
  const trialPackReview = readJsonIfExists(trialPackReviewPath);
  const uatDemoScript = readJsonIfExists(uatDemoScriptPath);
  const convergenceBaselineDoc = readUtf8IfExists(convergenceBaselineDocPath);
  const progressTemplate = readUtf8IfExists(progressTemplatePath);
  const aiAssistantService = readUtf8IfExists(
    path.join(
      repoRoot,
      'integration-hub',
      'src',
      'modules',
      'ai-assistant',
      'ai-assistant.service.ts',
    ),
  );
  const integrationEnv = readUtf8IfExists(
    path.join(repoRoot, 'integration-hub', 'src', 'config', 'env.ts'),
  );

  const smokeChecks = smokeCheckMap(smokeSummary);
  const getSmokeCheckStatus = (name) => smokeChecks.get(name)?.status === 'ok';

  const coverageStatuses = coverageReferenceFiles.map((filePath) => ({
    filePath,
    covered: hasCoverageMarker(filePath),
  }));
  const coverageMissingFiles = coverageStatuses
    .filter((entry) => !entry.covered)
    .map((entry) => entry.filePath);

  const opsArtifacts = [
    path.join(repoRoot, 'tmp', 'trade-crm-smoke', 'ops-state.json'),
    path.join(repoRoot, 'tmp', 'trade-crm-smoke', 'ops-exceptions.json'),
    path.join(repoRoot, 'tmp', 'trade-crm-smoke', 'ops-report.md'),
    path.join(repoRoot, 'tmp', 'trade-crm-smoke', 'ops-weekly-summary.md'),
  ];
  const missingOpsArtifacts = opsArtifacts.filter(
    (artifactPath) => !fs.existsSync(artifactPath),
  );

  const deliveryPackageArtifacts = [
    readinessSummaryPath,
    smokeSummaryPath,
    trialReadinessPath,
    trialPackManifestPath,
    trialPackReviewPath,
    uatDemoScriptPath,
    assignmentStackReportPath,
  ];
  const missingDeliveryArtifacts = deliveryPackageArtifacts.filter(
    (artifactPath) => !fs.existsSync(artifactPath),
  );

  const postLaunchStackStatus =
    smokeSummary?.postLaunchAssignmentStackStatus ?? null;
  const isStaffingReady =
    postLaunchStackStatus === 'stack_ready_for_runtime_wiring';

  const items = [
    buildItem(
      '1.1.1',
      'Mainline baseline freeze',
      readinessSummary?.status === 'passed' && convergenceBaselineDoc
        ? 'passed'
        : 'failed',
      {
        readinessStatus: readinessSummary?.status ?? null,
        baselineDoc: convergenceBaselineDocPath,
      },
      readinessSummary?.status === 'passed'
        ? null
        : 'Run readiness and refresh the baseline document before delivery.',
    ),
    buildItem(
      '1.2.1',
      'Reference document override markers',
      coverageMissingFiles.length === 0 ? 'passed' : 'failed',
      {
        coverageMarker,
        coverageReferenceFiles,
        coverageMissingFiles,
      },
      coverageMissingFiles.length === 0
        ? null
        : 'Add the coverage marker to each reference file to avoid outdated constraints.',
    ),
    buildItem(
      '2.1.1',
      'Sales workbench primary path',
      getSmokeCheckStatus('alibaba-lead-sync') &&
      getSmokeCheckStatus('first-response-flow') &&
      getSmokeCheckStatus('twenty-webhook-flow')
        ? 'passed'
        : 'failed',
      {
        alibabaLeadSync: smokeChecks.get('alibaba-lead-sync')?.status ?? null,
        firstResponseFlow: smokeChecks.get('first-response-flow')?.status ?? null,
        twentyWebhookFlow:
          smokeChecks.get('twenty-webhook-flow')?.status ?? null,
      },
      null,
    ),
    buildItem(
      '2.2.1',
      'Lead workspace validation',
      getSmokeCheckStatus('trade-crm-lead-assignment-register') &&
      getSmokeCheckStatus('trade-crm-automations')
        ? 'passed'
        : 'failed',
      {
        leadAssignmentRegister:
          smokeChecks.get('trade-crm-lead-assignment-register')?.status ?? null,
        automations: smokeChecks.get('trade-crm-automations')?.status ?? null,
      },
      null,
    ),
    buildItem(
      '2.3.1',
      'Customer and opportunity validation',
      getSmokeCheckStatus('trade-crm-automations') &&
      Boolean(postLaunchStackStatus)
        ? 'passed'
        : 'failed',
      {
        automations: smokeChecks.get('trade-crm-automations')?.status ?? null,
        postLaunchAssignmentStackStatus: postLaunchStackStatus,
      },
      null,
    ),
    buildItem(
      '3.1.1',
      'Phase-1 automation convergence',
      getSmokeCheckStatus('trade-crm-automations') &&
      Boolean(convergenceBaselineDoc?.includes('3.1.1'))
        ? 'passed'
        : 'failed',
      {
        automations: smokeChecks.get('trade-crm-automations')?.status ?? null,
        baselineDocSectionPresent: Boolean(
          convergenceBaselineDoc?.includes('3.1.1'),
        ),
      },
      null,
    ),
    buildItem(
      '3.2.1',
      'Automation safety boundaries',
      Boolean(aiAssistantService?.includes('stateMutationAllowed: false'))
        ? 'passed'
        : 'failed',
      {
        boundarySignalPresent: Boolean(
          aiAssistantService?.includes('stateMutationAllowed: false'),
        ),
      },
      null,
    ),
    buildItem(
      '4.1.1',
      'integration-hub phase-1 baseline',
      getSmokeCheckStatus('state-persistence-flow') &&
      Boolean(integrationEnv?.includes('INTEGRATION_HUB_STATE_BACKEND'))
        ? 'passed'
        : 'failed',
      {
        statePersistenceFlow:
          smokeChecks.get('state-persistence-flow')?.status ?? null,
        envBackbonePresent: Boolean(
          integrationEnv?.includes('INTEGRATION_HUB_STATE_BACKEND'),
        ),
      },
      null,
    ),
    buildItem(
      '4.2.1',
      'Operationalized failure paths',
      missingOpsArtifacts.length === 0 ? 'passed' : 'failed',
      {
        opsArtifacts,
        missingOpsArtifacts,
      },
      missingOpsArtifacts.length === 0
        ? null
        : 'Re-run local smoke to regenerate missing ops artifacts.',
    ),
    buildItem(
      '5.1.1',
      'Pre-launch staffing closure',
      isStaffingReady ? 'passed' : 'pending',
      {
        postLaunchAssignmentStackStatus: postLaunchStackStatus,
        trialPackReviewStatus: trialPackReview?.status ?? null,
      },
      isStaffingReady
        ? null
        : 'Fill staffing/level templates and complete runtime activation approval before go-live.',
    ),
    buildItem(
      '5.2.1',
      'Dual-view UAT script',
      Boolean(convergenceBaselineDoc?.includes('5.2.1')) &&
      trialPackManifest?.status === 'prepared' &&
      uatDemoScript?.status === 'ready_for_demo'
        ? 'passed'
        : 'failed',
      {
        baselineDocSectionPresent: Boolean(
          convergenceBaselineDoc?.includes('5.2.1'),
        ),
        trialPackManifestStatus: trialPackManifest?.status ?? null,
        uatDemoScriptStatus: uatDemoScript?.status ?? null,
        uatDemoScriptPath,
      },
      uatDemoScript?.status === 'ready_for_demo'
        ? null
        : 'Run `npm run export:trade-crm-phase1-uat-demo-script` and clear preflight blockers.',
    ),
    buildItem(
      '6.1.1',
      'Stage acceptance package',
      missingDeliveryArtifacts.length === 0 ? 'passed' : 'failed',
      {
        requiredArtifacts: deliveryPackageArtifacts,
        missingArtifacts: missingDeliveryArtifacts,
      },
      missingDeliveryArtifacts.length === 0
        ? null
        : 'Regenerate missing artifacts before handing off the phase-1 package.',
    ),
    buildItem(
      '6.2.1',
      'Weekly/progress standardization',
      Boolean(progressTemplate)
        ? 'passed'
        : 'failed',
      {
        progressTemplatePath,
      },
      progressTemplate ? null : 'Add and maintain the standard weekly/progress template.',
    ),
  ];

  const failedItems = items.filter((item) => item.status === 'failed');
  const pendingItems = items.filter((item) => item.status === 'pending');

  const status =
    failedItems.length > 0
      ? 'failed'
      : pendingItems.length > 0
        ? 'pending'
        : 'passed';

  return {
    status,
    generatedAt: new Date().toISOString(),
    summaryPaths: {
      jsonOutputPath,
      markdownOutputPath,
    },
    sourceArtifacts: {
      readinessSummaryPath,
      smokeSummaryPath,
      trialReadinessPath,
      trialPackManifestPath,
      trialPackReviewPath,
      uatDemoScriptPath,
      assignmentStackReportPath,
    },
    failedItemIds: failedItems.map((item) => item.id),
    pendingItemIds: pendingItems.map((item) => item.id),
    items,
  };
};

const toMarkdown = (summary) => {
  const lines = [
    '# Trade CRM Phase 1 Convergence Summary',
    '',
    `Generated at: ${summary.generatedAt}`,
    `Status: ${summary.status.toUpperCase()}`,
    '',
    '## Checklist',
    '',
  ];

  for (const item of summary.items) {
    lines.push(
      `- ${item.id} ${item.title}: ${item.status.toUpperCase()}`,
    );
    lines.push(
      `  - evidence: ${JSON.stringify(item.evidence)}`,
    );
    if (item.action) {
      lines.push(`  - action: ${item.action}`);
    }
  }

  lines.push('');
  lines.push('## Failed Items');
  lines.push(
    ...(summary.failedItemIds.length > 0
      ? summary.failedItemIds.map((id) => `- ${id}`)
      : ['- none']),
  );
  lines.push('');
  lines.push('## Pending Items');
  lines.push(
    ...(summary.pendingItemIds.length > 0
      ? summary.pendingItemIds.map((id) => `- ${id}`)
      : ['- none']),
  );
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
        failedItemIds: summary.failedItemIds,
        pendingItemIds: summary.pendingItemIds,
      },
      null,
      2,
    ),
  );

  if (summary.status === 'failed') {
    process.exit(1);
  }
};

main();
