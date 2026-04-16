#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(repoRoot, '..');
const outputDir = path.join(repoRoot, 'tmp', 'trade-crm-trial');
const jsonOutputPath = path.join(outputDir, 'phase1-business-trial-readiness.json');
const markdownOutputPath = path.join(
  outputDir,
  'phase1-business-trial-readiness.md',
);

const checks = [
  {
    id: '9.4.1',
    label: 'sales-daily-sop',
    description: 'Sales daily operating checklist document is available',
    path: path.join(workspaceRoot, '销售每日使用动作清单（系统操作版）.md'),
  },
  {
    id: '9.4.2',
    label: 'manager-daily-sop',
    description: 'Manager daily SOP and weekly review template is available',
    path: path.join(workspaceRoot, '主管每日检查版SOP与周复盘模板.md'),
  },
  {
    id: '9.4.3',
    label: 'sales-usage-policy',
    description: 'Sales usage rules for phase-1 go-live are available',
    path: path.join(workspaceRoot, '一期上线后的销售使用规范与管理规则.md'),
  },
  {
    id: '9.4.4',
    label: 'field-config-sheet',
    description: 'Phase-1 field configuration sheet is available',
    path: path.join(
      workspaceRoot,
      '一期字段配置表（后台版_导入模板版_示例数据版）.md',
    ),
  },
  {
    id: '9.4.5',
    label: 'dictionary-sheet',
    description: 'Phase-1 standard dictionary sheet is available',
    path: path.join(workspaceRoot, '一期标准字典清单.md'),
  },
  {
    id: '9.4.6',
    label: 'assignment-approval-draft',
    description: 'Assignment approval draft is available for business review',
    path: path.join(
      repoRoot,
      'trade-crm-lead-assignment-rules.phase1-approval-draft.md',
    ),
  },
  {
    id: '9.4.7',
    label: 'category-confirmation-sheet',
    description: 'Product-category confirmation sheet is available',
    path: path.join(
      repoRoot,
      'trade-crm-lead-assignment-rules.phase1-product-category-confirmation.csv',
    ),
  },
  {
    id: '9.4.8',
    label: 'pool-staffing-template',
    description: 'Pool staffing template is available for post-launch owner assignment',
    path: path.join(
      repoRoot,
      'trade-crm-lead-assignment.phase1-pool-staffing-template.csv',
    ),
  },
  {
    id: '9.4.9',
    label: 'pool-staff-level-template',
    description: 'Pool staff-level template is available for employee grading',
    path: path.join(
      repoRoot,
      'trade-crm-lead-assignment.phase1-pool-staff-level-template.csv',
    ),
  },
  {
    id: '9.4.10',
    label: 'runtime-assignment-approval-template',
    description: 'Post-launch runtime assignment activation approval template is available',
    path: path.join(
      repoRoot,
      'trade-crm-post-launch-runtime-assignment-activation.approval.template.json',
    ),
  },
  {
    id: '9.4.11',
    label: 'trial-run-playbook',
    description: 'Phase-1 trial-run playbook is available',
    path: path.join(repoRoot, 'docs', 'trade-crm-phase1-trial-run-playbook.md'),
  },
  {
    id: '9.4.12',
    label: 'runtime-walkthrough-evidence',
    description: 'Latest local sales-workbench runtime walkthrough evidence is available',
    path: path.join(repoRoot, 'tmp', 'sales-workbench-runtime-walkthrough-v2.json'),
  },
];

function normalizePathForMarkdown(targetPath) {
  return targetPath.replaceAll('\\', '/');
}

function runChecks() {
  return checks.map((check) => {
    const exists = fs.existsSync(check.path);
    return {
      ...check,
      exists,
      status: exists ? 'passed' : 'failed',
    };
  });
}

function writeArtifacts(results) {
  fs.mkdirSync(outputDir, { recursive: true });

  const failedItems = results.filter((result) => result.status !== 'passed');
  const summary = {
    status: failedItems.length === 0 ? 'passed' : 'failed',
    generatedAt: new Date().toISOString(),
    outputDir,
    failedItemIds: failedItems.map((item) => item.id),
    checks: results,
  };

  fs.writeFileSync(jsonOutputPath, JSON.stringify(summary, null, 2));

  const markdownLines = [
    '# Trade CRM Phase 1 Business Trial Readiness',
    '',
    `Status: ${summary.status.toUpperCase()}`,
    '',
    '## Checks',
    ...results.map(
      (result) =>
        `- ${result.id} ${result.label}: ${result.status.toUpperCase()} - ${result.description} (${normalizePathForMarkdown(result.path)})`,
    ),
    '',
    '## Failed Items',
    ...(failedItems.length === 0
      ? ['- none']
      : failedItems.map(
          (item) =>
            `- ${item.id} ${item.label} (${normalizePathForMarkdown(item.path)})`,
        )),
  ];

  fs.writeFileSync(markdownOutputPath, markdownLines.join('\n'));

  return summary;
}

const results = runChecks();
const summary = writeArtifacts(results);

console.log(
  JSON.stringify(
    {
      status: summary.status,
      jsonOutputPath,
      markdownOutputPath,
      failedItemIds: summary.failedItemIds,
    },
    null,
    2,
  ),
);

if (summary.status !== 'passed') {
  process.exit(1);
}
