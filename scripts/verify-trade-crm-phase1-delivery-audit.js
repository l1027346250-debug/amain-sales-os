'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const artifactsDir = path.join(repoRoot, 'tmp', 'trade-crm-delivery');
const summaryPath = path.join(artifactsDir, 'phase1-delivery-audit.json');
const markdownPath = path.join(artifactsDir, 'phase1-delivery-audit.md');

const rootPackageJson = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
);
const integrationHubPackageJson = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'integration-hub', 'package.json'), 'utf8'),
);

const fileExists = (relativePath) =>
  fs.existsSync(path.join(repoRoot, relativePath));

const scriptExists = (packageJson, scriptName) =>
  typeof packageJson.scripts?.[scriptName] === 'string';

const buildFileEvidence = (relativePath) => ({
  kind: 'file',
  target: relativePath,
  exists: fileExists(relativePath),
});

const buildScriptEvidence = ({ packageName, packageJson, scriptName }) => ({
  kind: 'script',
  target: `${packageName}:${scriptName}`,
  exists: scriptExists(packageJson, scriptName),
});

const auditItems = [
  {
    id: '1.1.1',
    title: 'Trade CRM navigation and route shell',
    scope: 'Execution framework',
    evidence: [
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/navigation/tradeCrmRouteMap.ts',
      ),
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/navigation/tradeCrmMenuConfig.ts',
      ),
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/navigation/TradeCrmNavigationSection.tsx',
      ),
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/navigation/tradeCrmVisibility.ts',
      ),
    ],
  },
  {
    id: '1.2.1',
    title: 'Shared workspace layout templates',
    scope: 'Execution framework',
    evidence: [
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/shared/layouts/QueueWorkspaceLayout.tsx',
      ),
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/shared/layouts/EntityWorkspaceLayout.tsx',
      ),
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/shared/layouts/PipelineWorkspaceLayout.tsx',
      ),
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/shared/layouts/AdminWorkspaceLayout.tsx',
      ),
    ],
  },
  {
    id: '1.3.1',
    title: 'Trade CRM AI context contract',
    scope: 'Execution framework',
    evidence: [
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/shared/TradeWorkspaceContext.ts',
      ),
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/shared/components/TradeCrmAiDock.tsx',
      ),
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/shared/hooks/useTradeCrmAiAssistant.ts',
      ),
    ],
  },
  {
    id: '2.1.1',
    title: 'Sales workbench page',
    scope: 'Primary work surfaces',
    evidence: [
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/workbench/pages/TradeCrmWorkbenchPage.tsx',
      ),
      buildFileEvidence(
        'docs/trade-crm-sales-workbench-phase1-acceptance-checklist.md',
      ),
      buildFileEvidence(
        'docs/trade-crm-runtime-verification-notes.md',
      ),
    ],
  },
  {
    id: '2.2.1',
    title: 'Lead workspace page',
    scope: 'Primary work surfaces',
    evidence: [
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/prospecting/pages/TradeCrmProspectingPage.tsx',
      ),
    ],
  },
  {
    id: '2.3.1',
    title: 'Customer workspace page',
    scope: 'Primary work surfaces',
    evidence: [
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/customers/pages/TradeCrmCustomersPage.tsx',
      ),
    ],
  },
  {
    id: '2.4.1',
    title: 'Opportunity workspace page',
    scope: 'Primary work surfaces',
    evidence: [
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/opportunities/pages/TradeCrmOpportunitiesPage.tsx',
      ),
    ],
  },
  {
    id: '2.5.1',
    title: 'Manager review page',
    scope: 'Primary work surfaces',
    evidence: [
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/analytics/pages/TradeCrmAnalyticsPage.tsx',
      ),
    ],
  },
  {
    id: '3.1.1',
    title: 'CRM core rollout baseline artifacts',
    scope: 'CRM core',
    evidence: [
      buildFileEvidence('../Twenty实施版对象创建与配置顺序.md'),
      buildFileEvidence('../一期字段配置表（后台版_导入模板版_示例数据版）.md'),
      buildFileEvidence('../一期标准字典清单.md'),
      buildFileEvidence(
        'trade-crm-lead-assignment.phase1-pool-routing.from-category-confirmation.json',
      ),
    ],
  },
  {
    id: '4.1.1',
    title: 'Trade CRM record shell',
    scope: 'Detail shell and aggregation',
    evidence: [
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/record-show/components/TradeCrmRecordShowShell.tsx',
      ),
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/shared/getTradeCrmRecordShowPath.ts',
      ),
    ],
  },
  {
    id: '5.1.1',
    title: 'Integration-hub phase-1 module skeleton',
    scope: 'integration-hub',
    evidence: [
      buildFileEvidence('integration-hub/src/modules/lead-intake'),
      buildFileEvidence('integration-hub/src/modules/deduplication'),
      buildFileEvidence('integration-hub/src/modules/routing'),
      buildFileEvidence('integration-hub/src/modules/classification'),
      buildFileEvidence('integration-hub/src/modules/twenty-client'),
      buildFileEvidence('integration-hub/src/modules/webhooks'),
      buildFileEvidence('integration-hub/src/modules/scheduler'),
      buildFileEvidence('integration-hub/src/modules/lead-monitoring'),
      buildFileEvidence('integration-hub/src/modules/opportunity-monitoring'),
      buildFileEvidence('integration-hub/src/modules/ai-assistant'),
      buildFileEvidence('integration-hub/src/modules/outbox'),
      buildFileEvidence('integration-hub/src/modules/sync-jobs'),
      buildFileEvidence('integration-hub/README.md'),
    ],
  },
  {
    id: '6.1.1',
    title: 'Automation and reminder verification flows',
    scope: 'Automation closure',
    evidence: [
      buildScriptEvidence({
        packageName: 'integration-hub',
        packageJson: integrationHubPackageJson,
        scriptName: 'verify:first-response-flow',
      }),
      buildScriptEvidence({
        packageName: 'integration-hub',
        packageJson: integrationHubPackageJson,
        scriptName: 'verify:first-response-escalation-flow',
      }),
      buildScriptEvidence({
        packageName: 'integration-hub',
        packageJson: integrationHubPackageJson,
        scriptName: 'verify:quotation-followup-flow',
      }),
      buildScriptEvidence({
        packageName: 'integration-hub',
        packageJson: integrationHubPackageJson,
        scriptName: 'verify:stalled-opportunity-flow',
      }),
      buildScriptEvidence({
        packageName: 'integration-hub',
        packageJson: integrationHubPackageJson,
        scriptName: 'verify:retry-sweep-flow',
      }),
    ],
  },
  {
    id: '7.1.1',
    title: 'AI entry and suggestion layer',
    scope: 'AI enhancement',
    evidence: [
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/shared/components/AiAssistantFab.tsx',
      ),
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/shared/components/AiSuggestionDrawer.tsx',
      ),
      buildFileEvidence(
        'docs/trade-crm-ai-assistant-floating-entry.md',
      ),
    ],
  },
  {
    id: '8.1.1',
    title: 'Analytics and settings consolidation',
    scope: 'Governance and team data',
    evidence: [
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/settings/pages/TradeCrmSettingsPage.tsx',
      ),
      buildFileEvidence(
        'packages/twenty-front/src/modules/trade-crm/analytics/pages/TradeCrmAnalyticsPage.tsx',
      ),
    ],
  },
  {
    id: '9.1.1',
    title: 'Phase-1 readiness and smoke commands',
    scope: 'Delivery close-out',
    evidence: [
      buildScriptEvidence({
        packageName: 'root',
        packageJson: rootPackageJson,
        scriptName: 'verify:trade-crm-smoke',
      }),
      buildScriptEvidence({
        packageName: 'root',
        packageJson: rootPackageJson,
        scriptName: 'verify:trade-crm-phase1-readiness',
      }),
      buildScriptEvidence({
        packageName: 'root',
        packageJson: rootPackageJson,
        scriptName: 'verify:trade-crm-phase1-readiness:full',
      }),
      buildScriptEvidence({
        packageName: 'root',
        packageJson: rootPackageJson,
        scriptName: 'verify:trade-crm-phase1-readiness:full:bootstrap',
      }),
      buildFileEvidence('docs/trade-crm-phase1-readiness-checklist.md'),
      buildFileEvidence('docs/trade-crm-phase1-delivery-acceptance-2026-04-13.md'),
    ],
  },
];

const main = () => {
  fs.mkdirSync(artifactsDir, { recursive: true });

  const results = auditItems.map((item) => {
    const missingEvidence = item.evidence.filter((entry) => !entry.exists);

    return {
      ...item,
      status: missingEvidence.length === 0 ? 'passed' : 'failed',
      missingEvidence,
    };
  });

  const failedItems = results.filter((item) => item.status === 'failed');
  const passedItems = results.filter((item) => item.status === 'passed');
  const summary = {
    status: failedItems.length === 0 ? 'passed' : 'failed',
    generatedAt: new Date().toISOString(),
    scopeNote:
      'This is a file-and-script-level delivery audit. It does not validate live Twenty workspace metadata or browser runtime behavior.',
    counts: {
      total: results.length,
      passed: passedItems.length,
      failed: failedItems.length,
    },
    failedItemIds: failedItems.map((item) => item.id),
    items: results,
    artifacts: {
      summaryPath,
      markdownPath,
    },
  };

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  const markdownLines = [
    '# Trade CRM Phase 1 Delivery Audit',
    '',
    `Status: ${summary.status.toUpperCase()}`,
    '',
    `Generated at: ${summary.generatedAt}`,
    '',
    `Scope note: ${summary.scopeNote}`,
    '',
    '## Overview',
    '',
    '| ID | Scope | Item | Status | Missing |',
    '| --- | --- | --- | --- | --- |',
    ...results.map((item) => {
      const missing =
        item.missingEvidence.length === 0
          ? 'none'
          : item.missingEvidence
              .map((entry) => `\`${entry.target}\``)
              .join('<br />');

      return `| ${item.id} | ${item.scope} | ${item.title} | ${item.status.toUpperCase()} | ${missing} |`;
    }),
    '',
    '## Failed Items',
    '',
    ...(failedItems.length === 0
      ? ['- none']
      : failedItems.map(
          (item) =>
            `- ${item.id} ${item.title}: ${item.missingEvidence
              .map((entry) => entry.target)
              .join(', ')}`,
        )),
  ];

  fs.writeFileSync(markdownPath, `${markdownLines.join('\n')}\n`);

  console.log(
    JSON.stringify(
      {
        status: summary.status,
        summaryPath,
        markdownPath,
        failedItemIds: summary.failedItemIds,
      },
      null,
      2,
    ),
  );

  if (summary.status !== 'passed') {
    process.exit(1);
  }
};

main();
