const path = require('node:path');
const {
  summarizePoolStaffLevelTemplate,
} = require('./summarize-trade-crm-pool-staff-level-template.js');

const repoRootPath = path.resolve(__dirname, '..', '..', '..');
const defaultInputFile =
  process.env.TRADE_CRM_POOL_STAFF_LEVEL_TEMPLATE_FILE ||
  'trade-crm-lead-assignment.phase1-pool-staff-level-template.csv';

const reviewPoolStaffLevelTemplate = ({
  inputFile = defaultInputFile,
} = {}) => {
  const summary = summarizePoolStaffLevelTemplate({ inputFile });

  const reviewStatus =
    summary.enabledRowCount === 0
      ? 'no_enabled_level_rows'
      : summary.filledLevelKeyCount === 0
        ? 'waiting_for_staff_levels'
        : summary.defaultLevelCount === 0
          ? 'waiting_for_default_level'
          : summary.actionItems.length > 0
            ? 'partially_configured_levels'
            : 'staff_level_template_ready';

  return {
    status: 'ok',
    reviewStatus,
    poolStaffLevelTemplateFile: path.resolve(repoRootPath, inputFile),
    summary: {
      rowCount: summary.rowCount,
      enabledRowCount: summary.enabledRowCount,
      filledLevelKeyCount: summary.filledLevelKeyCount,
      filledLevelNameCount: summary.filledLevelNameCount,
      filledSortOrderCount: summary.filledSortOrderCount,
      defaultLevelCount: summary.defaultLevelCount,
      poolStrategyCount: summary.poolStrategyCount,
      poolStrategies: summary.poolStrategies,
      blockerCount: summary.actionItems.length,
    },
    actionItems: summary.actionItems,
  };
};

module.exports = {
  reviewPoolStaffLevelTemplate,
};

if (require.main === module) {
  try {
    const result = reviewPoolStaffLevelTemplate();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
