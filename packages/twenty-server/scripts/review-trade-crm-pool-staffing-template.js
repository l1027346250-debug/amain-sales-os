const path = require('node:path');
const {
  summarizePoolStaffingTemplate,
} = require('./summarize-trade-crm-pool-staffing-template.js');

const repoRootPath = path.resolve(__dirname, '..', '..', '..');
const defaultInputFile =
  process.env.TRADE_CRM_POOL_STAFFING_TEMPLATE_FILE ||
  'trade-crm-lead-assignment.phase1-pool-staffing-template.csv';

const reviewPoolStaffingTemplate = ({
  inputFile = defaultInputFile,
} = {}) => {
  const summary = summarizePoolStaffingTemplate({ inputFile });

  const reviewStatus =
    summary.enabledRowCount === 0
      ? 'no_enabled_pool_rows'
      : summary.filledMemberEmailCount === 0
        ? 'waiting_for_staffing_members'
        : summary.actionItems.length > 0
          ? 'partially_staffed'
          : 'staffing_template_ready';

  return {
    status: 'ok',
    reviewStatus,
    poolStaffingTemplateFile: path.resolve(repoRootPath, inputFile),
    summary: {
      rowCount: summary.rowCount,
      enabledRowCount: summary.enabledRowCount,
      filledStaffLevelCount: summary.filledStaffLevelCount,
      filledMemberNameCount: summary.filledMemberNameCount,
      filledMemberEmailCount: summary.filledMemberEmailCount,
      poolStrategyCount: summary.poolStrategyCount,
      poolStrategies: summary.poolStrategies,
      blockerCount: summary.actionItems.length,
    },
    actionItems: summary.actionItems,
  };
};

module.exports = {
  reviewPoolStaffingTemplate,
};

if (require.main === module) {
  try {
    const result = reviewPoolStaffingTemplate();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
