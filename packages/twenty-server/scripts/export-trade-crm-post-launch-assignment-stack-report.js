const fs = require('node:fs');
const path = require('node:path');
const {
  reviewPostLaunchAssignmentStack,
} = require('./review-trade-crm-post-launch-assignment-stack.js');

const defaultOutputDir =
  process.env.TRADE_CRM_POST_LAUNCH_ASSIGNMENT_STACK_REPORT_DIR ||
  path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'tmp',
    'trade-crm-post-launch-assignment-stack-report',
  );
const repoRootPath = path.resolve(__dirname, '..', '..', '..');
const bundleSourceFiles = [
  'trade-crm-lead-assignment-rules.phase1-product-category-confirmation.csv',
  'trade-crm-lead-assignment.phase1-pool-staffing-template.csv',
  'trade-crm-lead-assignment.phase1-pool-staff-level-template.csv',
  'trade-crm-post-launch-runtime-assignment-config.draft.json',
];

const ensureDirectory = (directoryPath) => {
  fs.mkdirSync(directoryPath, { recursive: true });
};

const copyBundleSources = (outputDir) =>
  bundleSourceFiles.map((relativePath) => {
    const sourcePath = path.resolve(repoRootPath, relativePath);

    if (!fs.existsSync(sourcePath)) {
      return {
        relativePath,
        copied: false,
        reason: 'missing_source',
      };
    }

    const targetPath = path.join(outputDir, path.basename(relativePath));
    fs.copyFileSync(sourcePath, targetPath);

    return {
      relativePath,
      copied: true,
      targetPath,
    };
  });

const toMarkdown = (report) => {
  const lines = [
    '# Trade CRM Post-Launch Assignment Stack Report',
    '',
    `- Stack Status: ${report.stackStatus}`,
    `- Pool Strategy: ${report.poolStrategy ?? 'n/a'}`,
    `- Category Review: ${report.categoryConfirmation.reviewStatus}`,
    `- Staffing Readiness: ${report.staffingReadiness.readinessStatus}`,
    `- Runtime Draft: ${report.runtimeDraft.readinessStatus}`,
    '',
    '## Summary',
    '',
    `- Category blockers: ${report.categoryConfirmation.blockerCount}`,
    `- Staffing blockers: ${report.staffingReadiness.staffingBlockerCount}`,
    `- Level blockers: ${report.staffingReadiness.levelBlockerCount}`,
    `- Runtime draft blocked pools: ${report.runtimeDraft.blockedPoolCount}`,
    '',
    '## Category Blockers',
    '',
  ];

  if (report.blockerSummary.categoryBlockers.length === 0) {
    lines.push('- None');
  } else {
    report.blockerSummary.categoryBlockers.forEach((item) => {
      lines.push(`- ${item}`);
    });
  }

  lines.push('', '## Staffing Blocker Pools', '');

  if (report.blockerSummary.staffingBlockerPools.length === 0) {
    lines.push('- None');
  } else {
    report.blockerSummary.staffingBlockerPools.forEach((item) => {
      lines.push(`- ${item}`);
    });
  }

  lines.push('', '## Level Blocker Pools', '');

  if (report.blockerSummary.levelBlockerPools.length === 0) {
    lines.push('- None');
  } else {
    report.blockerSummary.levelBlockerPools.forEach((item) => {
      lines.push(`- ${item}`);
    });
  }

  lines.push('', '## Next Actions', '');

  if (report.categoryConfirmation.reviewStatus === 'waiting_for_category_confirmation') {
    lines.push(
      '- Confirm the five product-category rows in `trade-crm-lead-assignment-rules.phase1-product-category-confirmation.csv`.',
    );
  }

  if (
    report.staffingReadiness.staffingReviewStatus === 'waiting_for_staffing_members'
  ) {
    lines.push(
      '- Fill members in `trade-crm-lead-assignment.phase1-pool-staffing-template.csv`.',
    );
  }

  if (report.staffingReadiness.levelReviewStatus === 'waiting_for_staff_levels') {
    lines.push(
      '- Fill levels in `trade-crm-lead-assignment.phase1-pool-staff-level-template.csv`.',
    );
  }

  lines.push('');

  return `${lines.join('\n')}\n`;
};

const exportPostLaunchAssignmentStackReport = ({
  outputDir = defaultOutputDir,
} = {}) => {
  const report = reviewPostLaunchAssignmentStack();
  const resolvedOutputDir = path.resolve(outputDir);
  const jsonPath = path.join(
    resolvedOutputDir,
    'post-launch-assignment-stack-report.json',
  );
  const markdownPath = path.join(
    resolvedOutputDir,
    'post-launch-assignment-stack-report.md',
  );
  const manifestPath = path.join(
    resolvedOutputDir,
    'post-launch-assignment-stack-bundle.manifest.json',
  );

  ensureDirectory(resolvedOutputDir);
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(markdownPath, toMarkdown(report), 'utf8');
  const bundledSources = copyBundleSources(resolvedOutputDir);
  const manifest = {
    status: 'ok',
    outputDir: resolvedOutputDir,
    stackStatus: report.stackStatus,
    poolStrategy: report.poolStrategy,
    generatedFiles: {
      jsonPath,
      markdownPath,
      manifestPath,
    },
    bundledSources,
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return {
    status: 'ok',
    outputDir: resolvedOutputDir,
    jsonPath,
    markdownPath,
    manifestPath,
    bundledSources,
    stackStatus: report.stackStatus,
    poolStrategy: report.poolStrategy,
  };
};

module.exports = {
  exportPostLaunchAssignmentStackReport,
};

if (require.main === module) {
  try {
    const result = exportPostLaunchAssignmentStackReport();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
