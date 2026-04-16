const fs = require('node:fs');
const path = require('node:path');
const {
  normalizeDecisionStatus,
  parseBoolean,
  parseCsv,
} = require('./summarize-trade-crm-lead-assignment-product-category-confirmation.js');

const defaultInputFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_PRODUCT_CATEGORY_CONFIRMATION_FILE ||
  'trade-crm-lead-assignment-rules.phase1-product-category-confirmation.csv';
const defaultOutputFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_PRODUCT_CATEGORY_HANDOFF_OUTPUT_FILE ||
  'trade-crm-lead-assignment.phase1-pool-routing.from-category-confirmation.json';
const repoRootPath = path.resolve(__dirname, '..', '..', '..');
const APPROVED_STATUSES = new Set(['approved', 'confirmed']);

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

const toHandoffEntry = (row, index) => {
  const rowNumber = index + 2;
  const productCategory = row.productCategory?.trim() || '';
  const assignmentMode = row.assignmentMode?.trim().toUpperCase() || '';
  const targetPool = row.targetPool?.trim() || '';
  const targetStaffLevel = row.targetStaffLevel?.trim() || null;
  const decisionStatus = normalizeDecisionStatus(row.decisionStatus);
  const categoryEnabled = parseBoolean(row.categoryEnabled);
  const postLaunchOwnerConfig = parseBoolean(row.postLaunchOwnerConfig);

  if (!categoryEnabled || !APPROVED_STATUSES.has(decisionStatus)) {
    return null;
  }

  if (!productCategory) {
    throw new Error(`Row ${rowNumber} is missing productCategory`);
  }

  if (!assignmentMode) {
    throw new Error(`Row ${rowNumber} is missing assignmentMode`);
  }

  if (!targetPool) {
    throw new Error(`Row ${rowNumber} is missing targetPool`);
  }

  return {
    productCategory,
    assignmentMode,
    targetPool,
    targetStaffLevel,
    postLaunchOwnerConfig,
    businessNotes: row.businessNotes?.trim() || '',
  };
};

const convertProductCategoryConfirmationToHandoff = ({
  inputFile = defaultInputFile,
  outputFile = defaultOutputFile,
} = {}) => {
  const resolvedInputFile = resolveFilePath(inputFile);

  if (!resolvedInputFile) {
    throw new Error(
      `Lead assignment product category confirmation file not found: ${inputFile}`,
    );
  }

  const rawCsv = fs.readFileSync(resolvedInputFile, 'utf8');
  const rows = parseCsv(rawCsv);
  const handoffEntries = rows
    .map(toHandoffEntry)
    .filter((entry) => entry !== null);
  const resolvedOutputFile = resolveOutputFilePath(outputFile);

  const output = {
    status: 'ok',
    source: 'trade-crm-lead-assignment-product-category-confirmation',
    inputFile: resolvedInputFile,
    generatedAt: new Date().toISOString(),
    approvedCategoryCount: handoffEntries.length,
    entries: handoffEntries,
  };

  fs.writeFileSync(
    resolvedOutputFile,
    `${JSON.stringify(output, null, 2)}\n`,
    'utf8',
  );

  return {
    status: 'ok',
    inputFile: resolvedInputFile,
    outputFile: resolvedOutputFile,
    rowCount: rows.length,
    approvedCategoryCount: handoffEntries.length,
  };
};

module.exports = {
  APPROVED_STATUSES,
  convertProductCategoryConfirmationToHandoff,
};

if (require.main === module) {
  try {
    const result = convertProductCategoryConfirmationToHandoff();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
