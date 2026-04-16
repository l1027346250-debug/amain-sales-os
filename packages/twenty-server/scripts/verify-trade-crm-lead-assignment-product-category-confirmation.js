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
const repoRootPath = path.resolve(__dirname, '..', '..', '..');
const SUPPORTED_ASSIGNMENT_MODES = new Set(['POOL', 'PUBLIC_POOL']);
const SUPPORTED_DECISION_STATUSES = new Set(['approved', 'confirmed', 'pending']);

const resolveFilePath = (filePath) => {
  const candidatePaths = [
    filePath,
    path.resolve(process.cwd(), filePath),
    path.resolve(process.cwd(), '..', '..', filePath),
    path.resolve(repoRootPath, filePath),
  ];

  return candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));
};

const verifyProductCategoryConfirmation = ({
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
  const seenCategories = new Set();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const productCategory = row.productCategory?.trim() || '';
    const assignmentMode = row.assignmentMode?.trim().toUpperCase() || '';
    const targetPool = row.targetPool?.trim() || '';
    const decisionStatus = normalizeDecisionStatus(row.decisionStatus);

    if (!productCategory) {
      throw new Error(`Row ${rowNumber} is missing productCategory`);
    }

    if (seenCategories.has(productCategory)) {
      throw new Error(`Row ${rowNumber} duplicates productCategory: ${productCategory}`);
    }

    seenCategories.add(productCategory);

    parseBoolean(row.categoryEnabled);
    parseBoolean(row.postLaunchOwnerConfig);

    if (!SUPPORTED_ASSIGNMENT_MODES.has(assignmentMode)) {
      throw new Error(
        `Row ${rowNumber} has unsupported assignmentMode: ${row.assignmentMode}`,
      );
    }

    if (!SUPPORTED_DECISION_STATUSES.has(decisionStatus)) {
      throw new Error(
        `Row ${rowNumber} has unsupported decisionStatus: ${row.decisionStatus}`,
      );
    }

    if ((assignmentMode === 'POOL' || assignmentMode === 'PUBLIC_POOL') && !targetPool) {
      throw new Error(
        `Row ${rowNumber} must provide targetPool for assignmentMode ${assignmentMode}`,
      );
    }
  });

  return {
    status: 'ok',
    inputFile: resolvedInputFile,
    rowCount: rows.length,
    supportedAssignmentModes: Array.from(SUPPORTED_ASSIGNMENT_MODES),
    supportedDecisionStatuses: Array.from(SUPPORTED_DECISION_STATUSES),
  };
};

module.exports = {
  verifyProductCategoryConfirmation,
};

if (require.main === module) {
  try {
    const result = verifyProductCategoryConfirmation();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
