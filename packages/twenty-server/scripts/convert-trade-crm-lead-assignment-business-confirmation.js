const fs = require('node:fs');
const path = require('node:path');

const defaultInputFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_BUSINESS_CONFIRMATION_FILE ||
  'trade-crm-lead-assignment-rules.phase1-business-confirmation.csv';
const defaultOutputFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_REGISTER_OUTPUT_FILE ||
  'trade-crm-lead-assignment-rules.phase1-from-business-confirmation.csv';
const repoRootPath = path.resolve(__dirname, '..', '..', '..');

const APPROVED_STATUSES = new Set(['approved', 'confirmed', 'done']);

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

  throw new Error(`Unsupported enabled flag: ${value}`);
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
      'Business confirmation CSV must include a header row and at least one data row',
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

const normalizeDecisionStatus = (value) => {
  if (!value) {
    return 'pending';
  }

  return value.trim().toLowerCase();
};

const escapeCsvValue = (value) => {
  const normalizedValue = value ?? '';

  if (/[",\r\n]/.test(normalizedValue)) {
    return `"${normalizedValue.replace(/"/g, '""')}"`;
  }

  return normalizedValue;
};

const toRegisterRow = (row, index) => {
  const priority = Number.parseInt(row.priority, 10);

  if (!Number.isFinite(priority)) {
    throw new Error(`Row ${index + 2} is missing a valid priority`);
  }

  if (!parseBoolean(row.enabled)) {
    return null;
  }

  const decisionStatus = normalizeDecisionStatus(row.decisionStatus);

  if (!APPROVED_STATUSES.has(decisionStatus)) {
    return null;
  }

  const ownerEmail = row.ownerEmail?.trim().toLowerCase();

  if (!ownerEmail) {
    throw new Error(`Row ${index + 2} is approved but missing ownerEmail`);
  }

  const notesParts = [];

  if (row.ownerRole?.trim()) {
    notesParts.push(`角色=${row.ownerRole.trim()}`);
  }

  if (row.businessNotes?.trim()) {
    notesParts.push(row.businessNotes.trim());
  }

  return {
    priority: String(priority),
    source: row.source?.trim() || '',
    country: row.country?.trim() || '',
    productCategory: row.productCategory?.trim() || '',
    userEmail: ownerEmail,
    workspaceMemberId: '',
    enabled: 'true',
    notes: notesParts.join('；'),
  };
};

const serializeRegisterCsv = (rows) => {
  const headers = [
    'priority',
    'source',
    'country',
    'productCategory',
    'userEmail',
    'workspaceMemberId',
    'enabled',
    'notes',
  ];

  const lines = [headers.join(',')];

  rows.forEach((row) => {
    lines.push(
      headers.map((header) => escapeCsvValue(row[header] || '')).join(','),
    );
  });

  return `${lines.join('\n')}\n`;
};

const convertBusinessConfirmationToRegister = ({
  inputFile = defaultInputFile,
  outputFile = defaultOutputFile,
} = {}) => {
  const resolvedInputFile = resolveFilePath(inputFile);

  if (!resolvedInputFile) {
    throw new Error(
      `Lead assignment business confirmation file not found: ${inputFile}`,
    );
  }

  const rawCsv = fs.readFileSync(resolvedInputFile, 'utf8');
  const rows = parseCsv(rawCsv);
  const registerRows = rows.map(toRegisterRow).filter((row) => row !== null);
  const resolvedOutputFile = resolveOutputFilePath(outputFile);
  const outputCsv = serializeRegisterCsv(registerRows);

  fs.writeFileSync(resolvedOutputFile, outputCsv, 'utf8');

  return {
    status: 'ok',
    inputFile: resolvedInputFile,
    outputFile: resolvedOutputFile,
    rowCount: rows.length,
    approvedRowCount: registerRows.length,
  };
};

module.exports = {
  APPROVED_STATUSES,
  convertBusinessConfirmationToRegister,
  parseBoolean,
  normalizeDecisionStatus,
  parseCsv,
  splitCsvLine,
};

if (require.main === module) {
  try {
    const result = convertBusinessConfirmationToRegister();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
