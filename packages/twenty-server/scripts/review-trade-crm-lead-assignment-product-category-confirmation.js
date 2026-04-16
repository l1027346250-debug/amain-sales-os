const path = require('node:path');
const {
  summarizeProductCategoryConfirmation,
} = require('./summarize-trade-crm-lead-assignment-product-category-confirmation.js');

const repoRootPath = path.resolve(__dirname, '..', '..', '..');
const defaultInputFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_PRODUCT_CATEGORY_CONFIRMATION_FILE ||
  'trade-crm-lead-assignment-rules.phase1-product-category-confirmation.csv';

const reviewProductCategoryConfirmation = ({
  inputFile = defaultInputFile,
} = {}) => {
  const summary = summarizeProductCategoryConfirmation({ inputFile });

  const reviewStatus =
    summary.pendingCategoryCount > 0
      ? 'waiting_for_category_confirmation'
      : summary.enabledCategoryCount === 0
        ? 'no_enabled_categories'
        : 'category_strategy_ready_for_implementation';

  return {
    status: 'ok',
    reviewStatus,
    productCategoryConfirmationFile: path.resolve(repoRootPath, inputFile),
    summary: {
      rowCount: summary.rowCount,
      enabledCategoryCount: summary.enabledCategoryCount,
      approvedCategoryCount: summary.approvedCategoryCount,
      pendingCategoryCount: summary.pendingCategoryCount,
      poolModeCount: summary.poolModeCount,
      publicPoolModeCount: summary.publicPoolModeCount,
      distinctPoolCount: summary.distinctPoolCount,
      poolStrategy: summary.poolStrategy,
      unresolvedStaffLevelCount: summary.unresolvedStaffLevelCount,
      blockerCount: summary.actionItems.length,
    },
    actionItems: summary.actionItems,
  };
};

module.exports = {
  reviewProductCategoryConfirmation,
};

if (require.main === module) {
  try {
    const result = reviewProductCategoryConfirmation();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
