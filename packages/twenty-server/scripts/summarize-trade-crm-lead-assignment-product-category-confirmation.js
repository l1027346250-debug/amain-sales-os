const fs = require('node:fs');
const path = require('node:path');

const defaultInputFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_PRODUCT_CATEGORY_CONFIRMATION_FILE ||
  'trade-crm-lead-assignment-rules.phase1-product-category-confirmation.csv';
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

const splitCsvLine = (line) => {
  const values = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      const nextCharacter = line[index + 1];

      if (insideQuotes && nextCharacter === '"') {
        currentValue += '"';
        index += 1;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === ',' && !insideQuotes) {
      values.push(currentValue);
      currentValue = '';
      continue;
    }

    currentValue += character;
  }

  values.push(currentValue);

  return values.map((value) => value.trim());
};

const parseCsv = (csvContent) => {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error(
      'Product category confirmation CSV must include a header row and at least one data row',
    );
  }

  const headers = splitCsvLine(lines[0]);
  const rows = [];

  for (let index = 1; index < lines.length; index += 1) {
    const values = splitCsvLine(lines[index]);

    if (values.length !== headers.length) {
      throw new Error(
        `CSV row ${index + 1} has ${values.length} columns, expected ${headers.length}`,
      );
    }

    const row = {};

    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex];
    });

    rows.push(row);
  }

  return rows;
};

const parseBoolean = (value) => {
  if (!value) {
    return true;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (['true', '1', 'yes', 'y'].includes(normalizedValue)) {
    return true;
  }

  if (['false', '0', 'no', 'n'].includes(normalizedValue)) {
    return false;
  }

  throw new Error(`Unsupported boolean flag: ${value}`);
};

const normalizeDecisionStatus = (value) => {
  if (!value) {
    return 'pending';
  }

  return value.trim().toLowerCase();
};

const derivePoolStrategy = ({
  enabledCategoryCount,
  distinctPools,
  publicPoolModeCount,
}) => {
  if (enabledCategoryCount === 0 || distinctPools.length === 0) {
    return 'unresolved';
  }

  if (publicPoolModeCount > 0) {
    return distinctPools.length === 1
      ? 'shared_public_pool'
      : 'mixed_or_unresolved';
  }

  return distinctPools.length === 1
    ? 'shared_pool'
    : 'category_specific_pools';
};

const summarizeProductCategoryConfirmation = ({
  inputFile = defaultInputFile,
} = {}) => {
  const resolvedInputFile = resolveFilePath(inputFile);

  if (!resolvedInputFile) {
    throw new Error(
      `Lead assignment product category confirmation file not found: ${inputFile}`,
    );
  }

  const rawCsv = fs.readFileSync(resolvedInputFile, 'utf8');
  const rows = parseCsv(rawCsv);

  let enabledCategoryCount = 0;
  let disabledCategoryCount = 0;
  let approvedCategoryCount = 0;
  let pendingCategoryCount = 0;
  let poolModeCount = 0;
  let publicPoolModeCount = 0;
  let unresolvedStaffLevelCount = 0;
  let postLaunchOwnerConfigCount = 0;
  const distinctPools = new Set();

  const actionItems = [];

  rows.forEach((row, index) => {
    const enabled = parseBoolean(row.categoryEnabled);
    const decisionStatus = normalizeDecisionStatus(row.decisionStatus);
    const assignmentMode = row.assignmentMode?.trim().toUpperCase() || '';
    const targetStaffLevel = row.targetStaffLevel?.trim() || '';
    const postLaunchOwnerConfig = parseBoolean(row.postLaunchOwnerConfig);
    const blockers = [];

    if (enabled) {
      enabledCategoryCount += 1;
    } else {
      disabledCategoryCount += 1;
      blockers.push('disabled');
    }

    if (decisionStatus === 'approved' || decisionStatus === 'confirmed') {
      approvedCategoryCount += 1;
    } else {
      pendingCategoryCount += 1;
      blockers.push(`status=${decisionStatus}`);
    }

    if (assignmentMode === 'POOL') {
      poolModeCount += 1;
    }

    if (assignmentMode === 'PUBLIC_POOL') {
      publicPoolModeCount += 1;
    }

    if (enabled && row.targetPool?.trim()) {
      distinctPools.add(row.targetPool.trim());
    }

    if (!targetStaffLevel) {
      unresolvedStaffLevelCount += 1;
    }

    if (postLaunchOwnerConfig) {
      postLaunchOwnerConfigCount += 1;
    }

    if (blockers.length > 0) {
      actionItems.push({
        rowNumber: index + 2,
        productCategory: row.productCategory?.trim() || '',
        assignmentMode,
        targetPool: row.targetPool?.trim() || '',
        blockers,
      });
    }
  });

  return {
    status: 'ok',
    inputFile: resolvedInputFile,
    rowCount: rows.length,
    enabledCategoryCount,
    disabledCategoryCount,
    approvedCategoryCount,
    pendingCategoryCount,
    poolModeCount,
    publicPoolModeCount,
    distinctPoolCount: distinctPools.size,
    distinctPools: Array.from(distinctPools),
    poolStrategy: derivePoolStrategy({
      enabledCategoryCount,
      distinctPools: Array.from(distinctPools),
      publicPoolModeCount,
    }),
    unresolvedStaffLevelCount,
    postLaunchOwnerConfigCount,
    actionItems,
  };
};

module.exports = {
  normalizeDecisionStatus,
  parseBoolean,
  parseCsv,
  splitCsvLine,
  summarizeProductCategoryConfirmation,
};

if (require.main === module) {
  try {
    const result = summarizeProductCategoryConfirmation();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
