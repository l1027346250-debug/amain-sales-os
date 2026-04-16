const {
  reviewPostLaunchRuntimeAssignmentActivationReadiness,
} = require('./review-trade-crm-post-launch-runtime-assignment-activation-readiness.js');

const verifyPostLaunchRuntimeAssignmentActivationReadiness = () => {
  const review = reviewPostLaunchRuntimeAssignmentActivationReadiness();

  if (review.activationStatus !== 'ready_for_manual_activation') {
    const blockerParts = [
      `activationStatus=${review.activationStatus}`,
      `stackStatus=${review.stackStatus}`,
      `approvalStatus=${review.approvalStatus}`,
      `stackBlockedPoolCount=${review.summary.stackBlockedPoolCount}`,
      `approvalBlockerCount=${review.summary.approvalBlockerCount}`,
    ];

    throw new Error(
      `Runtime assignment activation is not ready: ${blockerParts.join(', ')}`,
    );
  }

  return {
    status: 'ok',
    verificationStatus: 'activation_ready',
    activationStatus: review.activationStatus,
    poolStrategy: review.poolStrategy,
    summary: review.summary,
  };
};

module.exports = {
  verifyPostLaunchRuntimeAssignmentActivationReadiness,
};

if (require.main === module) {
  try {
    const result = verifyPostLaunchRuntimeAssignmentActivationReadiness();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
