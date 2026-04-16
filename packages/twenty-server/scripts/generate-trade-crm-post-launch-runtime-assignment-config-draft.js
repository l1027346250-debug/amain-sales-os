const fs = require('node:fs');
const path = require('node:path');
const {
  parseBoolean: parseStaffingBoolean,
  parseCsv: parseStaffingCsv,
} = require('./summarize-trade-crm-pool-staffing-template.js');
const {
  parseBoolean: parseLevelBoolean,
  parseCsv: parseLevelCsv,
} = require('./summarize-trade-crm-pool-staff-level-template.js');

const defaultStaffingFile =
  process.env.TRADE_CRM_POOL_STAFFING_TEMPLATE_FILE ||
  'trade-crm-lead-assignment.phase1-pool-staffing-template.csv';
const defaultLevelFile =
  process.env.TRADE_CRM_POOL_STAFF_LEVEL_TEMPLATE_FILE ||
  'trade-crm-lead-assignment.phase1-pool-staff-level-template.csv';
const defaultOutputFile =
  process.env.TRADE_CRM_POST_LAUNCH_RUNTIME_ASSIGNMENT_CONFIG_DRAFT_OUTPUT_FILE ||
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

const resolveOutputFilePath = (filePath) => {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.resolve(repoRootPath, filePath);
};

const generatePostLaunchRuntimeAssignmentConfigDraft = ({
  staffingFile = defaultStaffingFile,
  levelFile = defaultLevelFile,
  outputFile = defaultOutputFile,
} = {}) => {
  const resolvedStaffingFile = resolveFilePath(staffingFile);
  const resolvedLevelFile = resolveFilePath(levelFile);

  if (!resolvedStaffingFile) {
    throw new Error(`Pool staffing template file not found: ${staffingFile}`);
  }

  if (!resolvedLevelFile) {
    throw new Error(`Pool staff-level template file not found: ${levelFile}`);
  }

  const staffingRows = parseStaffingCsv(
    fs.readFileSync(resolvedStaffingFile, 'utf8'),
  );
  const levelRows = parseLevelCsv(fs.readFileSync(resolvedLevelFile, 'utf8'));
  const pools = new Map();

  const ensurePool = (targetPool, seed = {}) => {
    const existing = pools.get(targetPool) || {
      targetPool,
      poolStrategy: seed.poolStrategy || null,
      productCategories: [],
      members: [],
      levels: [],
    };

    if (seed.poolStrategy && !existing.poolStrategy) {
      existing.poolStrategy = seed.poolStrategy;
    }

    if (seed.productCategories) {
      seed.productCategories
        .split('|')
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach((category) => {
          if (!existing.productCategories.includes(category)) {
            existing.productCategories.push(category);
          }
        });
    }

    pools.set(targetPool, existing);

    return existing;
  };

  staffingRows.forEach((row) => {
    if (!parseStaffingBoolean(row.enabled)) {
      return;
    }

    const targetPool = row.targetPool?.trim() || '';

    if (!targetPool) {
      return;
    }

    const pool = ensurePool(targetPool, {
      poolStrategy: row.poolStrategy?.trim() || null,
      productCategories: row.productCategories?.trim() || '',
    });

    const staffLevel = row.staffLevel?.trim() || '';
    const memberName = row.memberName?.trim() || '';
    const memberEmail = row.memberEmail?.trim() || '';

    if (!staffLevel && !memberName && !memberEmail) {
      return;
    }

    pool.members.push({
      staffLevel: staffLevel || null,
      memberName: memberName || null,
      memberEmail: memberEmail || null,
    });
  });

  levelRows.forEach((row) => {
    if (!parseLevelBoolean(row.enabled)) {
      return;
    }

    const targetPool = row.targetPool?.trim() || '';

    if (!targetPool) {
      return;
    }

    const pool = ensurePool(targetPool, {
      poolStrategy: row.poolStrategy?.trim() || null,
      productCategories: row.productCategories?.trim() || '',
    });

    const levelKey = row.levelKey?.trim() || '';
    const levelName = row.levelName?.trim() || '';
    const sortOrder = row.sortOrder?.trim() || '';
    const hasDefaultMarker = row.isDefaultLevel?.trim();
    const isDefaultLevel = hasDefaultMarker
      ? parseLevelBoolean(row.isDefaultLevel)
      : false;

    if (!levelKey && !levelName && !sortOrder && !hasDefaultMarker) {
      return;
    }

    pool.levels.push({
      levelKey: levelKey || null,
      levelName: levelName || null,
      sortOrder: sortOrder || null,
      isDefaultLevel,
    });
  });

  const poolList = Array.from(pools.values()).sort((leftPool, rightPool) =>
    leftPool.targetPool.localeCompare(rightPool.targetPool),
  );
  const output = {
    status: 'ok',
    source: 'trade-crm-post-launch-staffing-templates',
    generatedAt: new Date().toISOString(),
    staffingFile: resolvedStaffingFile,
    levelFile: resolvedLevelFile,
    poolCount: poolList.length,
    pools: poolList,
  };
  const resolvedOutputFile = resolveOutputFilePath(outputFile);

  fs.writeFileSync(
    resolvedOutputFile,
    `${JSON.stringify(output, null, 2)}\n`,
    'utf8',
  );

  return {
    status: 'ok',
    outputFile: resolvedOutputFile,
    staffingFile: resolvedStaffingFile,
    levelFile: resolvedLevelFile,
    poolCount: poolList.length,
    poolsWithMembersCount: poolList.filter((pool) => pool.members.length > 0)
      .length,
    poolsWithLevelsCount: poolList.filter((pool) => pool.levels.length > 0).length,
  };
};

module.exports = {
  generatePostLaunchRuntimeAssignmentConfigDraft,
};

if (require.main === module) {
  try {
    const result = generatePostLaunchRuntimeAssignmentConfigDraft();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
