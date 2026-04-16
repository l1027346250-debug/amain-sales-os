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
  const normalizedCsv = csvContent.replace(/^\uFEFF/, '');
  const lines = normalizedCsv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error(
      'Pool staff-level template CSV must include a header row and at least one data row',
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

const summarizePoolStaffLevelTemplate = ({
  inputFile = defaultInputFile,
} = {}) => {
  const resolvedInputFile = resolveFilePath(inputFile);

  if (!resolvedInputFile) {
    throw new Error(`Pool staff-level template file not found: ${inputFile}`);
  }

  const rawCsv = fs.readFileSync(resolvedInputFile, 'utf8');
  const rows = parseCsv(rawCsv);

  let enabledRowCount = 0;
  let filledLevelKeyCount = 0;
  let filledLevelNameCount = 0;
  let filledSortOrderCount = 0;
  let defaultLevelCount = 0;
  const poolStrategies = new Set();
  const actionItems = [];

  rows.forEach((row, index) => {
    const enabled = parseBoolean(row.enabled);
    const isDefaultLevel = row.isDefaultLevel?.trim()
      ? parseBoolean(row.isDefaultLevel)
      : false;
    const blockers = [];

    if (enabled) {
      enabledRowCount += 1;
    } else {
      blockers.push('disabled');
    }

    if (row.poolStrategy?.trim()) {
      poolStrategies.add(row.poolStrategy.trim());
    }

    if (row.levelKey?.trim()) {
      filledLevelKeyCount += 1;
    } else {
      blockers.push('missing_level_key');
    }

    if (row.levelName?.trim()) {
      filledLevelNameCount += 1;
    } else {
      blockers.push('missing_level_name');
    }

    if (row.sortOrder?.trim()) {
      filledSortOrderCount += 1;
    } else {
      blockers.push('missing_sort_order');
    }

    if (isDefaultLevel) {
      defaultLevelCount += 1;
    } else {
      blockers.push('missing_default_level');
    }

    if (blockers.length > 0) {
      actionItems.push({
        rowNumber: index + 2,
        targetPool: row.targetPool?.trim() || '',
        poolStrategy: row.poolStrategy?.trim() || '',
        productCategories: row.productCategories?.trim() || '',
        blockers,
      });
    }
  });

  return {
    status: 'ok',
    inputFile: resolvedInputFile,
    rowCount: rows.length,
    enabledRowCount,
    filledLevelKeyCount,
    filledLevelNameCount,
    filledSortOrderCount,
    defaultLevelCount,
    poolStrategyCount: poolStrategies.size,
    poolStrategies: Array.from(poolStrategies),
    actionItems,
  };
};

module.exports = {
  parseBoolean,
  parseCsv,
  splitCsvLine,
  summarizePoolStaffLevelTemplate,
};

if (require.main === module) {
  try {
    const result = summarizePoolStaffLevelTemplate();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
