const fs = require('node:fs');
const path = require('node:path');

const defaultInputFile =
  process.env.TRADE_CRM_POST_LAUNCH_RUNTIME_ASSIGNMENT_CONFIG_DRAFT_FILE ||
  'trade-crm-post-launch-runtime-assignment-config.draft.json';
const repoRootPath = path.resolve(__dirname, '..', '..', '..');

const resolveFilePath = (filePath) => {
  const candidatePaths = [
    filePath,
    path.resolve(process.cwd(), filePath),
    path.resolve(process.cwd(), '..', '..', filePath),
    path.resolve(repoRootPath, filePath),
  ];

  return candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));
};

const reviewPostLaunchRuntimeAssignmentConfigDraft = ({
  inputFile = defaultInputFile,
} = {}) => {
  const resolvedInputFile = resolveFilePath(inputFile);

  if (!resolvedInputFile) {
    throw new Error(
      `Post-launch runtime assignment config draft not found: ${inputFile}`,
    );
  }

  const draft = JSON.parse(fs.readFileSync(resolvedInputFile, 'utf8'));
  const pools = Array.isArray(draft.pools) ? draft.pools : [];

  const actionItems = pools.flatMap((pool) => {
    const blockers = [];
    const members = Array.isArray(pool.members) ? pool.members : [];
    const levels = Array.isArray(pool.levels) ? pool.levels : [];
    const defaultLevelCount = levels.filter((level) => level?.isDefaultLevel).length;

    if (members.length === 0) {
      blockers.push('missing_members');
    }

    if (levels.length === 0) {
      blockers.push('missing_levels');
    }

    if (levels.length > 0 && defaultLevelCount === 0) {
      blockers.push('missing_default_level');
    }

    if (levels.length > 0 && defaultLevelCount > 1) {
      blockers.push('multiple_default_levels');
    }

    if (blockers.length === 0) {
      return [];
    }

    return [
      {
        targetPool: pool.targetPool ?? '',
        poolStrategy: pool.poolStrategy ?? null,
        productCategories: Array.isArray(pool.productCategories)
          ? pool.productCategories
          : [],
        blockers,
      },
    ];
  });

  const readyPoolCount = pools.length - actionItems.length;
  const readinessStatus =
    pools.length === 0
      ? 'no_pools_in_draft'
      : readyPoolCount === pools.length
        ? 'runtime_draft_ready'
        : readyPoolCount === 0
          ? 'runtime_draft_waiting_for_staffing_and_levels'
          : 'runtime_draft_partially_ready';

  return {
    status: 'ok',
    inputFile: resolvedInputFile,
    readinessStatus,
    poolStrategy: pools[0]?.poolStrategy ?? null,
    summary: {
      poolCount: pools.length,
      readyPoolCount,
      blockedPoolCount: actionItems.length,
    },
    actionItems,
  };
};

module.exports = {
  reviewPostLaunchRuntimeAssignmentConfigDraft,
};

if (require.main === module) {
  try {
    const result = reviewPostLaunchRuntimeAssignmentConfigDraft();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
