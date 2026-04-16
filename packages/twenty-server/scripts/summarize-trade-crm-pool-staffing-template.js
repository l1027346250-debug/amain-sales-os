const fs = require('node:fs');
const path = require('node:path');

const defaultInputFile =
  process.env.TRADE_CRM_POOL_STAFFING_TEMPLATE_FILE ||
  'trade-crm-lead-assignment.phase1-pool-staffing-template.csv';
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
      'Pool staffing template CSV must include a header row and at least one data row',
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

const summarizePoolStaffingTemplate = ({
  inputFile = defaultInputFile,
} = {}) => {
  const resolvedInputFile = resolveFilePath(inputFile);

  if (!resolvedInputFile) {
    throw new Error(`Pool staffing template file not found: ${inputFile}`);
  }

  const rawCsv = fs.readFileSync(resolvedInputFile, 'utf8');
  const rows = parseCsv(rawCsv);

  let enabledRowCount = 0;
  let filledStaffLevelCount = 0;
  let filledMemberEmailCount = 0;
  let filledMemberNameCount = 0;
  const poolStrategies = new Set();
  const actionItems = [];

  rows.forEach((row, index) => {
    const enabled = parseBoolean(row.enabled);
    const blockers = [];

    if (enabled) {
      enabledRowCount += 1;
    } else {
      blockers.push('disabled');
    }

    if (row.poolStrategy?.trim()) {
      poolStrategies.add(row.poolStrategy.trim());
    }

    if (row.staffLevel?.trim()) {
      filledStaffLevelCount += 1;
    } else {
      blockers.push('missing_staff_level');
    }

    if (row.memberEmail?.trim()) {
      filledMemberEmailCount += 1;
    } else {
      blockers.push('missing_member_email');
    }

    if (row.memberName?.trim()) {
      filledMemberNameCount += 1;
    } else {
      blockers.push('missing_member_name');
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
    filledStaffLevelCount,
    filledMemberNameCount,
    filledMemberEmailCount,
    poolStrategyCount: poolStrategies.size,
    poolStrategies: Array.from(poolStrategies),
    actionItems,
  };
};

module.exports = {
  parseBoolean,
  parseCsv,
  splitCsvLine,
  summarizePoolStaffingTemplate,
};

if (require.main === module) {
  try {
    const result = summarizePoolStaffingTemplate();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
