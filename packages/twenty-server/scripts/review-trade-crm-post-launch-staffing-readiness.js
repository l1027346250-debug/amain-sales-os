const {
  reviewPoolStaffingTemplate,
} = require('./review-trade-crm-pool-staffing-template.js');
const {
  reviewPoolStaffLevelTemplate,
} = require('./review-trade-crm-pool-staff-level-template.js');

const deriveReadinessStatus = ({
  staffingReviewStatus,
  levelReviewStatus,
}) => {
  if (
    staffingReviewStatus === 'staffing_template_ready' &&
    levelReviewStatus === 'staff_level_template_ready'
  ) {
    return 'ready_for_runtime_configuration';
  }

  if (
    staffingReviewStatus === 'waiting_for_staffing_members' &&
    levelReviewStatus === 'waiting_for_staff_levels'
  ) {
    return 'waiting_for_staffing_and_levels';
  }

  if (staffingReviewStatus === 'waiting_for_staffing_members') {
    return 'waiting_for_staffing_members';
  }

  if (levelReviewStatus === 'waiting_for_staff_levels') {
    return 'waiting_for_staff_levels';
  }

  if (
    staffingReviewStatus === 'partially_staffed' ||
    levelReviewStatus === 'partially_configured_levels'
  ) {
    return 'partially_ready';
  }

  return 'mixed_or_unresolved';
};

const reviewPostLaunchStaffingReadiness = () => {
  const staffingReview = reviewPoolStaffingTemplate();
  const levelReview = reviewPoolStaffLevelTemplate();
  const readinessStatus = deriveReadinessStatus({
    staffingReviewStatus: staffingReview.reviewStatus,
    levelReviewStatus: levelReview.reviewStatus,
  });

  return {
    status: 'ok',
    readinessStatus,
    poolStrategy:
      staffingReview.summary.poolStrategies?.[0] ??
      levelReview.summary.poolStrategies?.[0] ??
      null,
    staffing: {
      reviewStatus: staffingReview.reviewStatus,
      file: staffingReview.poolStaffingTemplateFile,
      summary: staffingReview.summary,
      blockerCount: staffingReview.actionItems.length,
    },
    levels: {
      reviewStatus: levelReview.reviewStatus,
      file: levelReview.poolStaffLevelTemplateFile,
      summary: levelReview.summary,
      blockerCount: levelReview.actionItems.length,
    },
    blockerSummary: {
      staffingBlockerPools: staffingReview.actionItems.map(
        (item) => item.targetPool,
      ),
      levelBlockerPools: levelReview.actionItems.map((item) => item.targetPool),
    },
  };
};

module.exports = {
  reviewPostLaunchStaffingReadiness,
};

if (require.main === module) {
  try {
    const result = reviewPostLaunchStaffingReadiness();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
