const fs = require('node:fs');
const path = require('node:path');
const {
  APPROVED_STATUSES,
  normalizeDecisionStatus,
  parseBoolean,
  parseCsv,
} = require('./convert-trade-crm-lead-assignment-business-confirmation.js');

const defaultInputFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_BUSINESS_CONFIRMATION_FILE ||
  'trade-crm-lead-assignment-rules.phase1-business-confirmation.csv';
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

const toActionItem = (row, index) => {
  const status = normalizeDecisionStatus(row.decisionStatus);
  const enabled = parseBoolean(row.enabled);
  const ownerEmail = row.ownerEmail?.trim();
  const blockers = [];

  if (!enabled) {
    blockers.push('disabled');
  }

  if (!APPROVED_STATUSES.has(status)) {
    blockers.push(`status=${status}`);
  }

  if (APPROVED_STATUSES.has(status) && !ownerEmail) {
    blockers.push('missing ownerEmail');
  }

  if (blockers.length === 0) {
    return null;
  }

  return {
    rowNumber: index + 2,
    source: row.source?.trim() || '',
    country: row.country?.trim() || '',
    ownerRole: row.ownerRole?.trim() || '',
    blockers,
  };
};

const summarizeBusinessConfirmation = ({
  inputFile = defaultInputFile,
} = {}) => {
  const resolvedInputFile = resolveFilePath(inputFile);

  if (!resolvedInputFile) {
    throw new Error(
      `Lead assignment business confirmation file not found: ${inputFile}`,
    );
  }

  const rawCsv = fs.readFileSync(resolvedInputFile, 'utf8');
  const rows = parseCsv(rawCsv);

  let enabledRowCount = 0;
  let disabledRowCount = 0;
  let approvedRowCount = 0;
  let pendingRowCount = 0;
  let missingOwnerEmailCount = 0;

  const actionItems = rows
    .map((row, index) => {
      const enabled = parseBoolean(row.enabled);
      const status = normalizeDecisionStatus(row.decisionStatus);
      const ownerEmail = row.ownerEmail?.trim();

      if (enabled) {
        enabledRowCount += 1;
      } else {
        disabledRowCount += 1;
      }

      if (APPROVED_STATUSES.has(status)) {
        approvedRowCount += 1;

        if (!ownerEmail) {
          missingOwnerEmailCount += 1;
        }
      } else {
        pendingRowCount += 1;
      }

      return toActionItem(row, index);
    })
    .filter((item) => item !== null);

  return {
    status: 'ok',
    inputFile: resolvedInputFile,
    rowCount: rows.length,
    enabledRowCount,
    disabledRowCount,
    approvedRowCount,
    pendingRowCount,
    missingOwnerEmailCount,
    readyForConversionRowCount: approvedRowCount - missingOwnerEmailCount,
    actionItems,
  };
};

module.exports = {
  summarizeBusinessConfirmation,
};

if (require.main === module) {
  try {
    const result = summarizeBusinessConfirmation();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
