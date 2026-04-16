const fs = require('node:fs');
const path = require('node:path');

const defaultInputFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_REGISTER_FILE ||
  'trade-crm-lead-assignment-rules.phase1-register.csv';
const defaultOutputFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_RULES_OUTPUT_FILE ||
  'trade-crm-lead-assignment-rules.phase1-from-register.json';
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
    throw new Error('Register CSV must include a header row and at least one data row');
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

const toRule = (row, index) => {
  const priority = Number.parseInt(row.priority, 10);

  if (!Number.isFinite(priority)) {
    throw new Error(`Row ${index + 2} is missing a valid priority`);
  }

  const userEmail = row.userEmail?.trim().toLowerCase();
  const workspaceMemberId = row.workspaceMemberId?.trim();

  if (!userEmail && !workspaceMemberId) {
    throw new Error(
      `Row ${index + 2} must provide userEmail or workspaceMemberId`,
    );
  }

  const rule = { priority };

  if (row.source?.trim()) {
    rule.source = row.source.trim();
  }

  if (row.country?.trim()) {
    rule.country = row.country.trim();
  }

  if (row.productCategory?.trim()) {
    rule.productCategory = row.productCategory.trim();
  }

  if (userEmail) {
    rule.userEmail = userEmail;
  }

  if (workspaceMemberId) {
    rule.workspaceMemberId = workspaceMemberId;
  }

  return rule;
};

const convertRegisterCsvToRules = ({
  inputFile = defaultInputFile,
  outputFile = defaultOutputFile,
} = {}) => {
  const resolvedInputFile = resolveFilePath(inputFile);

  if (!resolvedInputFile) {
    throw new Error(`Lead assignment register file not found: ${inputFile}`);
  }

  const rawCsv = fs.readFileSync(resolvedInputFile, 'utf8');
  const rows = parseCsv(rawCsv);
  const enabledRows = rows.filter((row, index) => {
    try {
      return parseBoolean(row.enabled);
    } catch (error) {
      throw new Error(`Row ${index + 2}: ${error.message}`);
    }
  });
  const rules = enabledRows.map(toRule);
  const resolvedOutputFile = resolveOutputFilePath(outputFile);

  fs.writeFileSync(resolvedOutputFile, `${JSON.stringify(rules, null, 2)}\n`, 'utf8');

  return {
    status: 'ok',
    inputFile: resolvedInputFile,
    outputFile: resolvedOutputFile,
    rowCount: rows.length,
    enabledRowCount: enabledRows.length,
    ruleCount: rules.length,
  };
};

module.exports = {
  convertRegisterCsvToRules,
  parseBoolean,
  parseCsv,
  resolveFilePath,
  splitCsvLine,
  toRule,
};

if (require.main === module) {
  try {
    const result = convertRegisterCsvToRules();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
