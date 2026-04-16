const {
  parseBoolean,
  parseCsv,
  summarizePoolStaffLevelTemplate,
} = require('./summarize-trade-crm-pool-staff-level-template.js');
const fs = require('node:fs');
const path = require('node:path');

const defaultInputFile =
  process.env.TRADE_CRM_POOL_STAFF_LEVEL_TEMPLATE_FILE ||
  'trade-crm-lead-assignment.phase1-pool-staff-level-template.csv';
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

const verifyPoolStaffLevelTemplate = ({
  inputFile = defaultInputFile,
} = {}) => {
  const summary = summarizePoolStaffLevelTemplate({ inputFile });
  const resolvedInputFile = resolveFilePath(inputFile);

  if (!resolvedInputFile) {
    throw new Error(`Pool staff-level template file not found: ${inputFile}`);
  }

  const rows = parseCsv(fs.readFileSync(resolvedInputFile, 'utf8'));
  const byPool = new Map();

  rows.forEach((row, index) => {
    const enabled = parseBoolean(row.enabled);

    if (!enabled) {
      return;
    }

    const targetPool = row.targetPool?.trim() || '';
    const levelKey = row.levelKey?.trim() || '';
    const sortOrder = row.sortOrder?.trim() || '';
    const isDefaultLevel = row.isDefaultLevel?.trim()
      ? parseBoolean(row.isDefaultLevel)
      : false;
    const rowNumber = index + 2;

    const state = byPool.get(targetPool) || {
      levelKeys: new Map(),
      sortOrders: new Map(),
      defaultRows: [],
    };

    if (levelKey) {
      const existing = state.levelKeys.get(levelKey);

      if (existing) {
        throw new Error(
          `Rows ${existing} and ${rowNumber} duplicate levelKey "${levelKey}" in pool ${targetPool}`,
        );
      }

      state.levelKeys.set(levelKey, rowNumber);
    }

    if (sortOrder) {
      const existing = state.sortOrders.get(sortOrder);

      if (existing) {
        throw new Error(
          `Rows ${existing} and ${rowNumber} duplicate sortOrder "${sortOrder}" in pool ${targetPool}`,
        );
      }

      state.sortOrders.set(sortOrder, rowNumber);
    }

    if (isDefaultLevel) {
      state.defaultRows.push(rowNumber);

      if (state.defaultRows.length > 1) {
        throw new Error(
          `Pool ${targetPool} has more than one default level at rows ${state.defaultRows.join(', ')}`,
        );
      }
    }

    byPool.set(targetPool, state);
  });

  return {
    status: 'ok',
    inputFile: resolvedInputFile,
    rowCount: summary.rowCount,
    enabledRowCount: summary.enabledRowCount,
    verifiedPoolCount: byPool.size,
    filledLevelKeyCount: summary.filledLevelKeyCount,
    filledSortOrderCount: summary.filledSortOrderCount,
    defaultLevelCount: summary.defaultLevelCount,
    poolStrategies: summary.poolStrategies,
  };
};

module.exports = {
  verifyPoolStaffLevelTemplate,
};

if (require.main === module) {
  try {
    const result = verifyPoolStaffLevelTemplate();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
