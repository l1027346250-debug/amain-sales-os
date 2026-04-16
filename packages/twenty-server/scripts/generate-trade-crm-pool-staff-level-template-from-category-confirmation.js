const fs = require('node:fs');
const path = require('node:path');
const {
  parseBoolean,
  parseCsv,
  summarizeProductCategoryConfirmation,
} = require('./summarize-trade-crm-lead-assignment-product-category-confirmation.js');

const defaultInputFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_PRODUCT_CATEGORY_CONFIRMATION_FILE ||
  'trade-crm-lead-assignment-rules.phase1-product-category-confirmation.csv';
const defaultOutputFile =
  process.env.TRADE_CRM_POOL_STAFF_LEVEL_TEMPLATE_OUTPUT_FILE ||
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

const resolveOutputFilePath = (filePath) => {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.resolve(repoRootPath, filePath);
};

const escapeCsvValue = (value) => {
  const normalizedValue = value ?? '';

  if (/[",\r\n]/.test(normalizedValue)) {
    return `"${normalizedValue.replace(/"/g, '""')}"`;
  }

  return normalizedValue;
};

const serializeCsv = (rows) => {
  const headers = [
    'targetPool',
    'poolStrategy',
    'productCategories',
    'levelKey',
    'levelName',
    'sortOrder',
    'isDefaultLevel',
    'enabled',
    'notes',
  ];

  const lines = [headers.join(',')];

  rows.forEach((row) => {
    lines.push(headers.map((header) => escapeCsvValue(row[header] || '')).join(','));
  });

  return `\ufeff${lines.join('\r\n')}\r\n`;
};

const generatePoolStaffLevelTemplateFromCategoryConfirmation = ({
  inputFile = defaultInputFile,
  outputFile = defaultOutputFile,
} = {}) => {
  const resolvedInputFile = resolveFilePath(inputFile);

  if (!resolvedInputFile) {
    throw new Error(
      `Lead assignment product category confirmation file not found: ${inputFile}`,
    );
  }

  const summary = summarizeProductCategoryConfirmation({ inputFile: resolvedInputFile });
  const rawCsv = fs.readFileSync(resolvedInputFile, 'utf8');
  const rows = parseCsv(rawCsv);
  const poolMap = new Map();

  rows.forEach((row) => {
    const enabled = parseBoolean(row.categoryEnabled);
    const targetPool = row.targetPool?.trim() || '';
    const productCategory = row.productCategory?.trim() || '';

    if (!enabled || !targetPool) {
      return;
    }

    const existing = poolMap.get(targetPool) || {
      targetPool,
      poolStrategy: summary.poolStrategy,
      productCategories: [],
      levelKey: '',
      levelName: '',
      sortOrder: '',
      isDefaultLevel: '',
      enabled: 'true',
      notes: '系统运行后维护员工等级，可新增、停用、排序或调整默认等级。',
    };

    if (productCategory && !existing.productCategories.includes(productCategory)) {
      existing.productCategories.push(productCategory);
    }

    poolMap.set(targetPool, existing);
  });

  const templateRows = Array.from(poolMap.values()).map((row) => ({
    ...row,
    productCategories: row.productCategories.join(' | '),
  }));

  const resolvedOutputFile = resolveOutputFilePath(outputFile);
  fs.writeFileSync(resolvedOutputFile, serializeCsv(templateRows), 'utf8');

  return {
    status: 'ok',
    inputFile: resolvedInputFile,
    outputFile: resolvedOutputFile,
    poolStrategy: summary.poolStrategy,
    enabledCategoryCount: summary.enabledCategoryCount,
    generatedPoolCount: templateRows.length,
  };
};

module.exports = {
  generatePoolStaffLevelTemplateFromCategoryConfirmation,
};

if (require.main === module) {
  try {
    const result = generatePoolStaffLevelTemplateFromCategoryConfirmation();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
