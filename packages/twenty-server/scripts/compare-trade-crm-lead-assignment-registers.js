const fs = require('node:fs');
const path = require('node:path');
const {
  parseCsv,
  resolveFilePath,
} = require('./convert-trade-crm-lead-assignment-rules-register.js');

const repoRootPath = path.resolve(__dirname, '..', '..', '..');
const defaultCurrentRegisterFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_REGISTER_FILE ||
  'trade-crm-lead-assignment-rules.phase1-register.csv';
const defaultCandidateRegisterFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_CANDIDATE_REGISTER_FILE ||
  'trade-crm-lead-assignment-rules.phase1-from-business-confirmation.csv';

const normalizeRow = (row) => ({
  priority: row.priority?.trim() || '',
  source: row.source?.trim() || '',
  country: row.country?.trim() || '',
  productCategory: row.productCategory?.trim() || '',
  userEmail: row.userEmail?.trim().toLowerCase() || '',
  workspaceMemberId: row.workspaceMemberId?.trim() || '',
  enabled: row.enabled?.trim().toLowerCase() || '',
  notes: row.notes?.trim() || '',
});

const toMatcherKey = (row) =>
  [
    row.priority || '',
    row.source || '',
    row.country || '',
    row.productCategory || '',
  ].join('|');

const toComparablePayload = (row) => ({
  userEmail: row.userEmail,
  workspaceMemberId: row.workspaceMemberId,
  enabled: row.enabled,
  notes: row.notes,
});

const loadRegisterMap = (filePath) => {
  const resolvedFile = resolveFilePath(filePath);

  if (!resolvedFile) {
    throw new Error(`Lead assignment register file not found: ${filePath}`);
  }

  const rawCsv = fs.readFileSync(resolvedFile, 'utf8');
  const trimmedCsv = rawCsv.trim();
  const rows =
    trimmedCsv.length === 0
      ? []
      : trimmedCsv.split(/\r?\n/).length === 1
        ? []
        : parseCsv(rawCsv).map(normalizeRow);
  const map = new Map();

  rows.forEach((row, index) => {
    const matcherKey = toMatcherKey(row);

    if (map.has(matcherKey)) {
      throw new Error(
        `Duplicate matcher key found in ${resolvedFile} at row ${index + 2}: ${matcherKey}`,
      );
    }

    map.set(matcherKey, row);
  });

  return {
    resolvedFile,
    rows,
    map,
  };
};

const compareRegisters = ({
  currentRegisterFile = defaultCurrentRegisterFile,
  candidateRegisterFile = defaultCandidateRegisterFile,
} = {}) => {
  const currentRegister = loadRegisterMap(currentRegisterFile);
  const candidateRegister = loadRegisterMap(candidateRegisterFile);

  const added = [];
  const removed = [];
  const changed = [];

  candidateRegister.map.forEach((candidateRow, matcherKey) => {
    const currentRow = currentRegister.map.get(matcherKey);

    if (!currentRow) {
      added.push(candidateRow);
      return;
    }

    const currentPayload = JSON.stringify(toComparablePayload(currentRow));
    const candidatePayload = JSON.stringify(toComparablePayload(candidateRow));

    if (currentPayload !== candidatePayload) {
      changed.push({
        matcherKey,
        current: currentRow,
        candidate: candidateRow,
      });
    }
  });

  currentRegister.map.forEach((currentRow, matcherKey) => {
    if (!candidateRegister.map.has(matcherKey)) {
      removed.push(currentRow);
    }
  });

  return {
    status: 'ok',
    currentRegisterFile: currentRegister.resolvedFile,
    candidateRegisterFile: candidateRegister.resolvedFile,
    currentRowCount: currentRegister.rows.length,
    candidateRowCount: candidateRegister.rows.length,
    addedCount: added.length,
    removedCount: removed.length,
    changedCount: changed.length,
    added,
    removed,
    changed,
  };
};

module.exports = {
  compareRegisters,
};

if (require.main === module) {
  try {
    const result = compareRegisters();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
