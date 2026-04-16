const fs = require('node:fs');
const path = require('node:path');
const {
  reviewPostLaunchRuntimeAssignmentActivationReadiness,
} = require('./review-trade-crm-post-launch-runtime-assignment-activation-readiness.js');

const repoRootPath = path.resolve(__dirname, '..', '..', '..');
const defaultOutputDir =
  process.env.TRADE_CRM_POST_LAUNCH_RUNTIME_ASSIGNMENT_ACTIVATION_REPORT_DIR ||
  path.resolve(
    repoRootPath,
    'tmp',
    'trade-crm-post-launch-runtime-assignment-activation-report',
  );
const bundleSourceFiles = [
  'trade-crm-post-launch-runtime-assignment-config.draft.json',
  'trade-crm-post-launch-runtime-assignment-activation.approval.template.json',
  'trade-crm-post-launch-runtime-assignment-activation.approval.json',
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
    '# Trade CRM Runtime Assignment Activation Readiness Report',
    '',
    `- Activation Status: ${report.activationStatus}`,
    `- Stack Status: ${report.stackStatus}`,
    `- Approval Status: ${report.approvalStatus}`,
    `- Pool Strategy: ${report.poolStrategy ?? 'n/a'}`,
    '',
    '## Summary',
    '',
    `- Ready for activation: ${report.summary.readyForActivation}`,
    `- Blocked by stack: ${report.summary.blockedByStack}`,
    `- Blocked by approval: ${report.summary.blockedByApproval}`,
    `- Stack blocked pools: ${report.summary.stackBlockedPoolCount}`,
    `- Approval blocker count: ${report.summary.approvalBlockerCount}`,
    '',
    '## Stack Blocker Pools',
    '',
  ];

  if (report.blockers.stackBlockerPools.length === 0) {
    lines.push('- None');
  } else {
    report.blockers.stackBlockerPools.forEach((pool) => {
      lines.push(`- ${pool}`);
    });
  }

  lines.push('', '## Approval Blockers', '');

  if (report.blockers.approvalBlockers.length === 0) {
    lines.push('- None');
  } else {
    report.blockers.approvalBlockers.forEach((blocker) => {
      lines.push(`- ${blocker}`);
    });
  }

  lines.push('', '## Next Actions', '');

  if (report.actionItems.length === 0) {
    lines.push('- None');
  } else {
    report.actionItems.forEach((item) => {
      lines.push(`- ${item}`);
    });
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
};

const exportPostLaunchRuntimeAssignmentActivationReport = ({
  outputDir = defaultOutputDir,
} = {}) => {
  const report = reviewPostLaunchRuntimeAssignmentActivationReadiness();
  const resolvedOutputDir = path.resolve(outputDir);
  const jsonPath = path.join(
    resolvedOutputDir,
    'post-launch-runtime-assignment-activation-readiness.json',
  );
  const markdownPath = path.join(
    resolvedOutputDir,
    'post-launch-runtime-assignment-activation-readiness.md',
  );
  const manifestPath = path.join(
    resolvedOutputDir,
    'post-launch-runtime-assignment-activation-bundle.manifest.json',
  );

  ensureDirectory(resolvedOutputDir);
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(markdownPath, toMarkdown(report), 'utf8');

  const bundledSources = copyBundleSources(resolvedOutputDir);
  const manifest = {
    status: 'ok',
    outputDir: resolvedOutputDir,
    activationStatus: report.activationStatus,
    stackStatus: report.stackStatus,
    approvalStatus: report.approvalStatus,
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
    activationStatus: report.activationStatus,
    stackStatus: report.stackStatus,
    approvalStatus: report.approvalStatus,
  };
};

module.exports = {
  exportPostLaunchRuntimeAssignmentActivationReport,
};

if (require.main === module) {
  try {
    const result = exportPostLaunchRuntimeAssignmentActivationReport();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
