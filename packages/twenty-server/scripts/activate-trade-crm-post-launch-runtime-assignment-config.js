const fs = require('node:fs');
const path = require('node:path');
const {
  reviewPostLaunchRuntimeAssignmentActivationReadiness,
} = require('./review-trade-crm-post-launch-runtime-assignment-activation-readiness.js');
const {
  convertRegisterCsvToRules,
  parseCsv: parseRegisterCsv,
} = require('./convert-trade-crm-lead-assignment-rules-register.js');
const {
  normalizeDecisionStatus,
  parseBoolean,
  parseCsv: parseCategoryCsv,
} = require('./summarize-trade-crm-lead-assignment-product-category-confirmation.js');

const repoRootPath = path.resolve(__dirname, '..', '..', '..');

const DEFAULT_CATEGORY_CONFIRMATION_FILE =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_PRODUCT_CATEGORY_CONFIRMATION_FILE ||
  'trade-crm-lead-assignment-rules.phase1-product-category-confirmation.csv';
const DEFAULT_RUNTIME_DRAFT_FILE =
  process.env.TRADE_CRM_POST_LAUNCH_RUNTIME_ASSIGNMENT_CONFIG_DRAFT_FILE ||
  'trade-crm-post-launch-runtime-assignment-config.draft.json';
const DEFAULT_CURRENT_REGISTER_FILE =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_REGISTER_FILE ||
  'trade-crm-lead-assignment-rules.phase1-register.csv';
const DEFAULT_CANDIDATE_REGISTER_FILE =
  process.env.TRADE_CRM_RUNTIME_ASSIGNMENT_ACTIVATION_CANDIDATE_FILE ||
  'trade-crm-lead-assignment-rules.phase1-from-runtime-activation.csv';
const DEFAULT_CATEGORY_SOURCE =
  process.env.TRADE_CRM_RUNTIME_ASSIGNMENT_CATEGORY_SOURCE || 'ALIBABA';
const DEFAULT_REPORT_DIR =
  process.env.TRADE_CRM_RUNTIME_ASSIGNMENT_ACTIVATION_REPORT_DIR ||
  path.join(
    repoRootPath,
    'tmp',
    'trade-crm-post-launch-runtime-assignment-activation-execution',
  );

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

const parseCommandOptions = () => {
  const args = process.argv.slice(2);

  return {
    apply: args.includes('--apply'),
  };
};

const toCsvValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);

  if (text.includes('"') || text.includes(',') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

const toCsv = (rows, headers) => {
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => toCsvValue(row[header])).join(',')),
  ];

  return `${lines.join('\n')}\n`;
};

const formatPriority = (index) => (index + 1) * 10;

const loadRuntimeDraft = (runtimeDraftFile) => {
  const resolvedRuntimeDraftFile = resolveFilePath(runtimeDraftFile);

  if (!resolvedRuntimeDraftFile) {
    throw new Error(`Runtime draft file not found: ${runtimeDraftFile}`);
  }

  const draft = JSON.parse(fs.readFileSync(resolvedRuntimeDraftFile, 'utf8'));
  const pools = Array.isArray(draft.pools) ? draft.pools : [];
  const poolAssigneeMap = new Map();

  for (const pool of pools) {
    const targetPool = pool?.targetPool?.trim?.() || '';

    if (!targetPool) {
      continue;
    }

    const members = Array.isArray(pool.members) ? pool.members : [];
    const levels = Array.isArray(pool.levels) ? pool.levels : [];
    const defaultLevel = levels.find((level) => level?.isDefaultLevel === true);
    const defaultLevelKey =
      typeof defaultLevel?.levelKey === 'string' ? defaultLevel.levelKey : null;
    const preferredMember = defaultLevelKey
      ? members.find((member) => member?.staffLevel === defaultLevelKey)
      : null;
    const fallbackMember = members.find(
      (member) =>
        typeof member?.memberEmail === 'string' &&
        member.memberEmail.trim().length > 0,
    );
    const selectedMember = preferredMember ?? fallbackMember ?? null;
    const selectedEmail =
      typeof selectedMember?.memberEmail === 'string'
        ? selectedMember.memberEmail.trim().toLowerCase()
        : '';

    if (!selectedEmail) {
      throw new Error(
        `Pool ${targetPool} has no usable memberEmail in runtime draft`,
      );
    }

    poolAssigneeMap.set(targetPool, {
      userEmail: selectedEmail,
      staffLevel:
        typeof selectedMember?.staffLevel === 'string'
          ? selectedMember.staffLevel
          : null,
    });
  }

  return {
    resolvedRuntimeDraftFile,
    poolAssigneeMap,
  };
};

const loadCategoryRows = (categoryFile) => {
  const resolvedCategoryFile = resolveFilePath(categoryFile);

  if (!resolvedCategoryFile) {
    throw new Error(`Category confirmation file not found: ${categoryFile}`);
  }

  const rows = parseCategoryCsv(fs.readFileSync(resolvedCategoryFile, 'utf8'));
  const approvedRows = rows.filter((row) => {
    const enabled = parseBoolean(row.categoryEnabled);
    const status = normalizeDecisionStatus(row.decisionStatus);

    return enabled && (status === 'approved' || status === 'confirmed');
  });

  return {
    resolvedCategoryFile,
    rows,
    approvedRows,
  };
};

const loadCurrentRegisterRows = (registerFile) => {
  const resolvedRegisterFile = resolveFilePath(registerFile);

  if (!resolvedRegisterFile) {
    throw new Error(`Current register file not found: ${registerFile}`);
  }

  const rows = parseRegisterCsv(fs.readFileSync(resolvedRegisterFile, 'utf8'));

  return {
    resolvedRegisterFile,
    rows,
  };
};

const buildCategoryRules = ({
  approvedRows,
  poolAssigneeMap,
  categorySource,
}) => {
  return approvedRows.map((row) => {
    const targetPool = row.targetPool?.trim() || '';
    const productCategory = row.productCategory?.trim() || '';

    if (!targetPool) {
      throw new Error(
        `Category row ${productCategory || '(unknown)'} is missing targetPool`,
      );
    }

    if (!productCategory) {
      throw new Error(`Category row with targetPool=${targetPool} is missing productCategory`);
    }

    const assignee = poolAssigneeMap.get(targetPool);

    if (!assignee?.userEmail) {
      throw new Error(
        `No assignee mapping found for pool ${targetPool} while building category rule ${productCategory}`,
      );
    }

    return {
      source: categorySource,
      country: '',
      productCategory,
      userEmail: assignee.userEmail,
      workspaceMemberId: '',
      enabled: 'true',
      notes: `Activated from runtime pool ${targetPool} (${assignee.staffLevel ?? 'no-level'})`,
    };
  });
};

const buildMergedRegisterRows = ({
  categoryRules,
  currentRows,
  categorySource,
}) => {
  const preservedRows = currentRows
    .filter((row) => {
      const source = row.source?.trim().toUpperCase() || '';

      return source !== categorySource;
    })
    .map((row) => ({
      source: row.source?.trim() || '',
      country: row.country?.trim() || '',
      productCategory: row.productCategory?.trim() || '',
      userEmail: row.userEmail?.trim().toLowerCase() || '',
      workspaceMemberId: row.workspaceMemberId?.trim() || '',
      enabled: row.enabled?.trim() || 'true',
      notes: row.notes?.trim() || '',
    }));

  const mergedRows = [...categoryRules, ...preservedRows].map((row, index) => ({
    priority: formatPriority(index),
    source: row.source,
    country: row.country,
    productCategory: row.productCategory,
    userEmail: row.userEmail,
    workspaceMemberId: row.workspaceMemberId,
    enabled: row.enabled,
    notes: row.notes,
  }));

  return {
    mergedRows,
    preservedRowCount: preservedRows.length,
  };
};

const writeCandidateRegister = ({
  candidateFile,
  mergedRows,
}) => {
  const resolvedCandidateFile = resolveOutputFilePath(candidateFile);
  const csv = toCsv(mergedRows, [
    'priority',
    'source',
    'country',
    'productCategory',
    'userEmail',
    'workspaceMemberId',
    'enabled',
    'notes',
  ]);

  fs.writeFileSync(resolvedCandidateFile, csv, 'utf8');

  return {
    resolvedCandidateFile,
  };
};

const timestampForFile = () =>
  new Date().toISOString().replace(/[:.]/g, '-');

const applyCandidateToCurrentRegister = ({
  currentRegisterFile,
  candidateRegisterFile,
}) => {
  const backupFilePath = `${currentRegisterFile}.${timestampForFile()}.bak`;

  fs.copyFileSync(currentRegisterFile, backupFilePath);
  fs.copyFileSync(candidateRegisterFile, currentRegisterFile);

  return {
    backupFilePath,
  };
};

const writeExecutionArtifacts = ({
  reportDir,
  report,
}) => {
  fs.mkdirSync(reportDir, { recursive: true });

  const jsonPath = path.join(
    reportDir,
    'post-launch-runtime-assignment-activation-execution.json',
  );
  const markdownPath = path.join(
    reportDir,
    'post-launch-runtime-assignment-activation-execution.md',
  );

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const markdown = [
    '# Trade CRM Runtime Assignment Activation Execution',
    '',
    `- status: ${report.status}`,
    `- applyMode: ${report.applyMode}`,
    `- activationReadiness: ${report.activationReadiness}`,
    `- categorySource: ${report.categorySource}`,
    `- approvedCategoryCount: ${report.approvedCategoryCount}`,
    `- categoryRuleCount: ${report.categoryRuleCount}`,
    `- preservedNonCategoryRuleCount: ${report.preservedNonCategoryRuleCount}`,
    `- mergedRuleCount: ${report.mergedRuleCount}`,
    '',
    '## Files',
    '',
    `- runtimeDraftFile: ${report.files.runtimeDraftFile}`,
    `- categoryFile: ${report.files.categoryFile}`,
    `- currentRegisterFile: ${report.files.currentRegisterFile}`,
    `- candidateRegisterFile: ${report.files.candidateRegisterFile}`,
    `- rulesJsonOutputFile: ${report.files.rulesJsonOutputFile}`,
    ...(report.files.backupFilePath
      ? [`- backupFilePath: ${report.files.backupFilePath}`]
      : []),
    '',
  ].join('\n');

  fs.writeFileSync(markdownPath, `${markdown}\n`, 'utf8');

  return {
    jsonPath,
    markdownPath,
  };
};

const activatePostLaunchRuntimeAssignmentConfig = ({
  apply = false,
} = {}) => {
  const readiness = reviewPostLaunchRuntimeAssignmentActivationReadiness();

  if (readiness.activationStatus !== 'ready_for_manual_activation') {
    throw new Error(
      `Activation readiness failed: activationStatus=${readiness.activationStatus}, stackStatus=${readiness.stackStatus}, approvalStatus=${readiness.approvalStatus}`,
    );
  }

  const { resolvedRuntimeDraftFile, poolAssigneeMap } = loadRuntimeDraft(
    DEFAULT_RUNTIME_DRAFT_FILE,
  );
  const { resolvedCategoryFile, approvedRows } = loadCategoryRows(
    DEFAULT_CATEGORY_CONFIRMATION_FILE,
  );
  const { resolvedRegisterFile, rows: currentRows } = loadCurrentRegisterRows(
    DEFAULT_CURRENT_REGISTER_FILE,
  );
  const categoryRules = buildCategoryRules({
    approvedRows,
    poolAssigneeMap,
    categorySource: DEFAULT_CATEGORY_SOURCE,
  });
  const { mergedRows, preservedRowCount } = buildMergedRegisterRows({
    categoryRules,
    currentRows,
    categorySource: DEFAULT_CATEGORY_SOURCE,
  });
  const { resolvedCandidateFile } = writeCandidateRegister({
    candidateFile: DEFAULT_CANDIDATE_REGISTER_FILE,
    mergedRows,
  });

  let backupFilePath = null;
  let rulesJsonOutputFile = null;

  if (apply) {
    const applyResult = applyCandidateToCurrentRegister({
      currentRegisterFile: resolvedRegisterFile,
      candidateRegisterFile: resolvedCandidateFile,
    });
    backupFilePath = applyResult.backupFilePath;

    const conversion = convertRegisterCsvToRules({
      inputFile: resolvedRegisterFile,
    });
    rulesJsonOutputFile = conversion.outputFile;
  }

  const report = {
    status: 'ok',
    applyMode: apply ? 'apply' : 'dry_run',
    generatedAt: new Date().toISOString(),
    activationReadiness: readiness.activationStatus,
    categorySource: DEFAULT_CATEGORY_SOURCE,
    approvedCategoryCount: approvedRows.length,
    categoryRuleCount: categoryRules.length,
    preservedNonCategoryRuleCount: preservedRowCount,
    mergedRuleCount: mergedRows.length,
    files: {
      runtimeDraftFile: resolvedRuntimeDraftFile,
      categoryFile: resolvedCategoryFile,
      currentRegisterFile: resolvedRegisterFile,
      candidateRegisterFile: resolvedCandidateFile,
      backupFilePath,
      rulesJsonOutputFile,
    },
  };

  const artifacts = writeExecutionArtifacts({
    reportDir: DEFAULT_REPORT_DIR,
    report,
  });

  return {
    ...report,
    artifacts,
  };
};

module.exports = {
  activatePostLaunchRuntimeAssignmentConfig,
};

if (require.main === module) {
  try {
    const options = parseCommandOptions();
    const result = activatePostLaunchRuntimeAssignmentConfig({
      apply: options.apply,
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
}
