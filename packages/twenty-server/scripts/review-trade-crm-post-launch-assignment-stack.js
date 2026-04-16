const {
  reviewProductCategoryConfirmation,
} = require('./review-trade-crm-lead-assignment-product-category-confirmation.js');
const {
  reviewPostLaunchStaffingReadiness,
} = require('./review-trade-crm-post-launch-staffing-readiness.js');
const {
  reviewPostLaunchRuntimeAssignmentConfigDraft,
} = require('./review-trade-crm-post-launch-runtime-assignment-config-draft.js');

const deriveStackStatus = ({
  categoryReviewStatus,
  staffingReadinessStatus,
  runtimeDraftStatus,
}) => {
  if (
    categoryReviewStatus === 'category_strategy_ready_for_implementation' &&
    staffingReadinessStatus === 'ready_for_runtime_configuration' &&
    runtimeDraftStatus === 'runtime_draft_ready'
  ) {
    return 'stack_ready_for_runtime_wiring';
  }

  if (categoryReviewStatus === 'waiting_for_category_confirmation') {
    return 'waiting_for_category_confirmation';
  }

  if (runtimeDraftStatus === 'runtime_draft_waiting_for_staffing_and_levels') {
    return 'waiting_for_staffing_and_levels';
  }

  if (staffingReadinessStatus === 'waiting_for_staffing_members') {
    return 'waiting_for_staffing_members';
  }

  if (staffingReadinessStatus === 'waiting_for_staff_levels') {
    return 'waiting_for_staff_levels';
  }

  return 'partially_ready_or_mixed';
};

const reviewPostLaunchAssignmentStack = () => {
  const categoryReview = reviewProductCategoryConfirmation();
  const staffingReview = reviewPostLaunchStaffingReadiness();
  const runtimeDraftReview = reviewPostLaunchRuntimeAssignmentConfigDraft();

  const stackStatus = deriveStackStatus({
    categoryReviewStatus: categoryReview.reviewStatus,
    staffingReadinessStatus: staffingReview.readinessStatus,
    runtimeDraftStatus: runtimeDraftReview.readinessStatus,
  });

  return {
    status: 'ok',
    stackStatus,
    poolStrategy:
      categoryReview.summary.poolStrategy ??
      staffingReview.poolStrategy ??
      runtimeDraftReview.poolStrategy ??
      null,
    categoryConfirmation: {
      reviewStatus: categoryReview.reviewStatus,
      blockerCount: categoryReview.actionItems.length,
      summary: categoryReview.summary,
    },
    staffingReadiness: {
      readinessStatus: staffingReview.readinessStatus,
      staffingReviewStatus: staffingReview.staffing.reviewStatus,
      levelReviewStatus: staffingReview.levels.reviewStatus,
      staffingBlockerCount: staffingReview.staffing.blockerCount,
      levelBlockerCount: staffingReview.levels.blockerCount,
    },
    runtimeDraft: {
      readinessStatus: runtimeDraftReview.readinessStatus,
      blockedPoolCount: runtimeDraftReview.summary.blockedPoolCount,
      readyPoolCount: runtimeDraftReview.summary.readyPoolCount,
    },
    blockerSummary: {
      categoryBlockers: categoryReview.actionItems.map(
        (item) => item.productCategory,
      ),
      staffingBlockerPools:
        staffingReview.blockerSummary.staffingBlockerPools ?? [],
      levelBlockerPools: staffingReview.blockerSummary.levelBlockerPools ?? [],
      runtimeDraftBlockerPools: runtimeDraftReview.actionItems.map(
        (item) => item.targetPool,
      ),
    },
  };
};

module.exports = {
  reviewPostLaunchAssignmentStack,
};

if (require.main === module) {
  try {
    const result = reviewPostLaunchAssignmentStack();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
