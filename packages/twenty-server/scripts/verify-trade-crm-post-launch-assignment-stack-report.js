const fs = require('node:fs');
const path = require('node:path');
const {
  exportPostLaunchAssignmentStackReport,
} = require('./export-trade-crm-post-launch-assignment-stack-report.js');

const verifyPostLaunchAssignmentStackReport = ({
  outputDir = process.env.TRADE_CRM_POST_LAUNCH_ASSIGNMENT_STACK_REPORT_DIR,
} = {}) => {
  const exportResult = exportPostLaunchAssignmentStackReport({
    outputDir,
  });

  const requiredFiles = [
    exportResult.jsonPath,
    exportResult.markdownPath,
    exportResult.manifestPath,
  ];

  const missingFiles = requiredFiles.filter((filePath) => !fs.existsSync(filePath));

  if (missingFiles.length > 0) {
    throw new Error(
      `Missing post-launch assignment stack bundle files: ${missingFiles.join(', ')}`,
    );
  }

  const manifest = JSON.parse(fs.readFileSync(exportResult.manifestPath, 'utf8'));
  const bundledSources = Array.isArray(manifest.bundledSources)
    ? manifest.bundledSources
    : [];
  const missingBundledSources = bundledSources.filter(
    (source) => source.copied !== true,
  );

  return {
    status: 'ok',
    outputDir: exportResult.outputDir,
    stackStatus: exportResult.stackStatus,
    poolStrategy: exportResult.poolStrategy,
    jsonPath: exportResult.jsonPath,
    markdownPath: exportResult.markdownPath,
    manifestPath: exportResult.manifestPath,
    bundledSourceCount: bundledSources.length,
    copiedBundledSourceCount: bundledSources.filter(
      (source) => source.copied === true,
    ).length,
    missingBundledSourceCount: missingBundledSources.length,
    missingBundledSources: missingBundledSources.map(
      (source) => source.relativePath ?? path.basename(source.targetPath ?? ''),
    ),
  };
};

module.exports = {
  verifyPostLaunchAssignmentStackReport,
};

if (require.main === module) {
  try {
    const result = verifyPostLaunchAssignmentStackReport();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
