const fs = require('node:fs');
const path = require('node:path');
const {
  reviewPostLaunchAssignmentStack,
} = require('./review-trade-crm-post-launch-assignment-stack.js');

const repoRootPath = path.resolve(__dirname, '..', '..', '..');
const defaultApprovalFile =
  process.env.TRADE_CRM_RUNTIME_ASSIGNMENT_ACTIVATION_APPROVAL_FILE ||
  'trade-crm-post-launch-runtime-assignment-activation.approval.json';

const resolveFilePath = (filePath) => {
  const candidatePaths = [
    filePath,
    path.resolve(process.cwd(), filePath),
    path.resolve(process.cwd(), '..', '..', filePath),
    path.resolve(repoRootPath, filePath),
  ];

  return candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));
};

const loadActivationApproval = ({ approvalFile = defaultApprovalFile } = {}) => {
  const resolvedApprovalFile = resolveFilePath(approvalFile);

  if (!resolvedApprovalFile) {
    return {
      approvalStatus: 'missing_approval_record',
      approvalFile: path.resolve(repoRootPath, approvalFile),
      isApproved: false,
      approvalBlockers: ['approval_file_missing'],
      approvalRecord: null,
    };
  }

  const approvalRecord = JSON.parse(
    fs.readFileSync(resolvedApprovalFile, 'utf8'),
  );

  const approvalBlockers = [];
  const approved = approvalRecord?.approved === true;
  const approvedBy =
    typeof approvalRecord?.approvedBy === 'string'
      ? approvalRecord.approvedBy.trim()
      : '';
  const approvedAtRaw =
    typeof approvalRecord?.approvedAt === 'string'
      ? approvalRecord.approvedAt.trim()
      : '';
  const changeTicket =
    typeof approvalRecord?.changeTicket === 'string'
      ? approvalRecord.changeTicket.trim()
      : '';

  const approvedAtDate = approvedAtRaw ? new Date(approvedAtRaw) : null;
  const approvedAtValid =
    approvedAtDate instanceof Date && !Number.isNaN(approvedAtDate?.valueOf());

  if (!approved) {
    approvalBlockers.push('approval_flag_not_true');
  }
  if (!approvedBy) {
    approvalBlockers.push('approved_by_missing');
  }
  if (!approvedAtValid) {
    approvalBlockers.push('approved_at_missing_or_invalid');
  }
  if (!changeTicket) {
    approvalBlockers.push('change_ticket_missing');
  }

  return {
    approvalStatus:
      approvalBlockers.length === 0
        ? 'approval_record_ready'
        : 'approval_record_incomplete',
    approvalFile: resolvedApprovalFile,
    isApproved: approvalBlockers.length === 0,
    approvalBlockers,
    approvalRecord,
  };
};

const reviewPostLaunchRuntimeAssignmentActivationReadiness = ({
  approvalFile = defaultApprovalFile,
} = {}) => {
  const stackReview = reviewPostLaunchAssignmentStack();
  const approvalReview = loadActivationApproval({ approvalFile });

  const activationStatus =
    stackReview.stackStatus !== 'stack_ready_for_runtime_wiring'
      ? 'waiting_for_staffing_or_levels'
      : !approvalReview.isApproved
        ? 'waiting_for_manual_approval_record'
        : 'ready_for_manual_activation';

  const actionItems = [];

  if (stackReview.stackStatus !== 'stack_ready_for_runtime_wiring') {
    actionItems.push(
      'Complete staffing members and level defaults for all pools before activation.',
    );
  }

  if (!approvalReview.isApproved) {
    actionItems.push(
      'Create and fill trade-crm-post-launch-runtime-assignment-activation.approval.json from the template, then rerun this review.',
    );
  }

  if (activationStatus === 'ready_for_manual_activation') {
    actionItems.push(
      'Proceed with manual activation under change control; do not auto-promote runtime draft.',
    );
  }

  return {
    status: 'ok',
    activationStatus,
    stackStatus: stackReview.stackStatus,
    poolStrategy: stackReview.poolStrategy ?? null,
    approvalStatus: approvalReview.approvalStatus,
    summary: {
      readyForActivation: activationStatus === 'ready_for_manual_activation',
      blockedByStack: stackReview.stackStatus !== 'stack_ready_for_runtime_wiring',
      blockedByApproval: !approvalReview.isApproved,
      stackBlockedPoolCount: stackReview.runtimeDraft.blockedPoolCount,
      stackReadyPoolCount: stackReview.runtimeDraft.readyPoolCount,
      approvalBlockerCount: approvalReview.approvalBlockers.length,
    },
    inputs: {
      runtimeDraftFile:
        process.env.TRADE_CRM_POST_LAUNCH_RUNTIME_ASSIGNMENT_CONFIG_DRAFT_FILE ||
        'trade-crm-post-launch-runtime-assignment-config.draft.json',
      approvalFile: approvalReview.approvalFile,
    },
    blockers: {
      stackBlockerPools: stackReview.blockerSummary.runtimeDraftBlockerPools,
      approvalBlockers: approvalReview.approvalBlockers,
    },
    actionItems,
  };
};

module.exports = {
  reviewPostLaunchRuntimeAssignmentActivationReadiness,
};

if (require.main === module) {
  try {
    const result = reviewPostLaunchRuntimeAssignmentActivationReadiness();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
