const fs = require('node:fs');
const path = require('node:path');

const {
  parseBoolean,
  parseCsv,
} = require('../packages/twenty-server/scripts/convert-trade-crm-lead-assignment-rules-register.js');

const appRoot = path.resolve(__dirname, '..');
const packDir = path.join(appRoot, 'tmp', 'trade-crm-trial', 'business-trial-pack');

const files = {
  sellerSignoff: path.join(packDir, 'seller-signoff.csv'),
  managerSignoff: path.join(packDir, 'manager-signoff.csv'),
  importRegister: path.join(packDir, 'import-register.csv'),
};

const sellerChecklistFields = [
  'route_checked',
  'lead_followup_checked',
  'customer_followup_checked',
  'opportunity_next_action_checked',
  'ai_suggestion_checked',
];

const managerChecklistFields = [
  'new_leads_checked',
  'first_response_overdue_checked',
  'stalled_opportunity_checked',
  'team_execution_checked',
];

const normalizeStatus = (value) => value?.trim().toLowerCase() || 'pending';

const parseChecklistValue = (value) => {
  if (!value || value.trim().length === 0) {
    return null;
  }

  return parseBoolean(value);
};

const loadCsv = (filePath, label) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} file not found: ${filePath}`);
  }

  const rawCsv = fs.readFileSync(filePath, 'utf8');
  const trimmedCsv = rawCsv.trim();

  if (trimmedCsv.length === 0) {
    throw new Error(`${label} file is empty: ${filePath}`);
  }

  if (trimmedCsv.split(/\r?\n/).length === 1) {
    return [];
  }

  return parseCsv(rawCsv);
};

const summarizeSignoffRows = (rows, roleLabel, checklistFields) => {
  const summary = {
    roleLabel,
    rowCount: rows.length,
    acceptedCount: 0,
    rejectedCount: 0,
    pendingCount: 0,
    issueCount: 0,
    invalidAcceptedChecklistCount: 0,
    acceptedMissingSignoffDateCount: 0,
    pendingRows: [],
    rejectedRows: [],
    invalidAcceptedChecklistRows: [],
    acceptedMissingSignoffDateRows: [],
  };

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const signoffStatus = normalizeStatus(row.signoff_status);

    if (!['accepted', 'rejected', 'pending'].includes(signoffStatus)) {
      throw new Error(
        `${roleLabel} row ${rowNumber} has unsupported signoff_status: ${row.signoff_status}`,
      );
    }

    if (signoffStatus === 'accepted') {
      summary.acceptedCount += 1;

      const allChecklistConfirmed = checklistFields.every((fieldName) => {
        try {
          return parseChecklistValue(row[fieldName]) === true;
        } catch (error) {
          throw new Error(
            `${roleLabel} row ${rowNumber} has unsupported ${fieldName}: ${row[fieldName]}`,
          );
        }
      });

      if (!allChecklistConfirmed) {
        summary.invalidAcceptedChecklistCount += 1;
        summary.invalidAcceptedChecklistRows.push(rowNumber);
      }

      if ((row.signoff_date?.trim() || '').length === 0) {
        summary.acceptedMissingSignoffDateCount += 1;
        summary.acceptedMissingSignoffDateRows.push(rowNumber);
      }
    } else if (signoffStatus === 'rejected') {
      summary.rejectedCount += 1;
      summary.rejectedRows.push(rowNumber);
    } else {
      summary.pendingCount += 1;
      summary.pendingRows.push(rowNumber);
    }

    if ((row.issues_found?.trim() || '').length > 0) {
      summary.issueCount += 1;
    }
  });

  return summary;
};

const summarizeImportRows = (rows) => {
  const summary = {
    rowCount: rows.length,
    approvedCount: 0,
    pendingApprovalCount: 0,
    blockedApprovedRowCount: 0,
    approvedMissingImportDateCount: 0,
    pendingApprovalRows: [],
    blockedApprovedRows: [],
    approvedMissingImportDateRows: [],
  };

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    let ownerMappingConfirmed;
    let staffLevelConfirmed;
    let importApproved;

    try {
      ownerMappingConfirmed = parseBoolean(row.owner_mapping_confirmed);
      staffLevelConfirmed = parseBoolean(row.staff_level_confirmed);
      importApproved = parseBoolean(row.import_approved);
    } catch (error) {
      throw new Error(`Import register row ${rowNumber}: ${error.message}`);
    }

    if (importApproved) {
      summary.approvedCount += 1;

      if (!ownerMappingConfirmed || !staffLevelConfirmed) {
        summary.blockedApprovedRowCount += 1;
        summary.blockedApprovedRows.push(rowNumber);
      }

      if ((row.import_date?.trim() || '').length === 0) {
        summary.approvedMissingImportDateCount += 1;
        summary.approvedMissingImportDateRows.push(rowNumber);
      }
    } else {
      summary.pendingApprovalCount += 1;
      summary.pendingApprovalRows.push(rowNumber);
    }
  });

  return summary;
};

const buildOverallStatus = ({
  sellerSummary,
  managerSummary,
  importSummary,
}) => {
  if (
    sellerSummary.rejectedCount > 0 ||
    managerSummary.rejectedCount > 0 ||
    sellerSummary.invalidAcceptedChecklistCount > 0 ||
    managerSummary.invalidAcceptedChecklistCount > 0 ||
    sellerSummary.acceptedMissingSignoffDateCount > 0 ||
    managerSummary.acceptedMissingSignoffDateCount > 0 ||
    importSummary.blockedApprovedRowCount > 0 ||
    importSummary.approvedMissingImportDateCount > 0
  ) {
    return 'blocked';
  }

  if (
    sellerSummary.acceptedCount > 0 &&
    managerSummary.acceptedCount > 0 &&
    importSummary.blockedApprovedRowCount === 0
  ) {
    return 'ready_for_real_data_trial';
  }

  return 'waiting_for_business_input';
};

const buildBlockingReasons = ({
  sellerSummary,
  managerSummary,
  importSummary,
}) => {
  const reasons = [];

  if (sellerSummary.pendingRows.length > 0) {
    reasons.push(
      `seller sign-off rows pending: ${sellerSummary.pendingRows.join(', ')}`,
    );
  }

  if (managerSummary.pendingRows.length > 0) {
    reasons.push(
      `manager sign-off rows pending: ${managerSummary.pendingRows.join(', ')}`,
    );
  }

  if (importSummary.pendingApprovalRows.length > 0) {
    reasons.push(
      `import register rows pending approval: ${importSummary.pendingApprovalRows.join(', ')}`,
    );
  }

  if (sellerSummary.rejectedRows.length > 0) {
    reasons.push(
      `seller sign-off rows rejected: ${sellerSummary.rejectedRows.join(', ')}`,
    );
  }

  if (managerSummary.rejectedRows.length > 0) {
    reasons.push(
      `manager sign-off rows rejected: ${managerSummary.rejectedRows.join(', ')}`,
    );
  }

  if (sellerSummary.invalidAcceptedChecklistRows.length > 0) {
    reasons.push(
      `seller accepted rows missing checklist confirmation: ${sellerSummary.invalidAcceptedChecklistRows.join(', ')}`,
    );
  }

  if (managerSummary.invalidAcceptedChecklistRows.length > 0) {
    reasons.push(
      `manager accepted rows missing checklist confirmation: ${managerSummary.invalidAcceptedChecklistRows.join(', ')}`,
    );
  }

  if (sellerSummary.acceptedMissingSignoffDateRows.length > 0) {
    reasons.push(
      `seller accepted rows missing signoff_date: ${sellerSummary.acceptedMissingSignoffDateRows.join(', ')}`,
    );
  }

  if (managerSummary.acceptedMissingSignoffDateRows.length > 0) {
    reasons.push(
      `manager accepted rows missing signoff_date: ${managerSummary.acceptedMissingSignoffDateRows.join(', ')}`,
    );
  }

  if (importSummary.blockedApprovedRows.length > 0) {
    reasons.push(
      `approved import rows missing owner/staff confirmation: ${importSummary.blockedApprovedRows.join(', ')}`,
    );
  }

  if (importSummary.approvedMissingImportDateRows.length > 0) {
    reasons.push(
      `approved import rows missing import_date: ${importSummary.approvedMissingImportDateRows.join(', ')}`,
    );
  }

  return reasons;
};

const buildNextActions = ({
  status,
  sellerSummary,
  managerSummary,
  importSummary,
}) => {
  const actions = [];

  if (status === 'waiting_for_business_input') {
    if (sellerSummary.pendingRows.length > 0) {
      actions.push('Fill seller-signoff.csv for the pending seller rows.');
    }

    if (managerSummary.pendingRows.length > 0) {
      actions.push('Fill manager-signoff.csv for the pending manager rows.');
    }

    if (importSummary.pendingApprovalRows.length > 0) {
      actions.push('Keep import-register.csv pending until owner mapping and staff levels are confirmed.');
    }
  }

  if (sellerSummary.invalidAcceptedChecklistRows.length > 0) {
    actions.push('Complete all seller checklist fields before keeping signoff_status=accepted.');
  }

  if (managerSummary.invalidAcceptedChecklistRows.length > 0) {
    actions.push('Complete all manager checklist fields before keeping signoff_status=accepted.');
  }

  if (
    sellerSummary.acceptedMissingSignoffDateRows.length > 0 ||
    managerSummary.acceptedMissingSignoffDateRows.length > 0
  ) {
    actions.push('Fill signoff_date for every accepted seller or manager row.');
  }

  if (importSummary.blockedApprovedRows.length > 0) {
    actions.push('Do not keep import_approved=yes until owner_mapping_confirmed=yes and staff_level_confirmed=yes.');
  }

  if (importSummary.approvedMissingImportDateRows.length > 0) {
    actions.push('Fill import_date for every approved import row.');
  }

  if (status === 'ready_for_real_data_trial') {
    actions.push('Proceed to the first controlled real-data trial batch.');
  }

  return actions;
};

const reviewBusinessTrialPack = () => {
  const sellerRows = loadCsv(files.sellerSignoff, 'Seller sign-off');
  const managerRows = loadCsv(files.managerSignoff, 'Manager sign-off');
  const importRows = loadCsv(files.importRegister, 'Import register');

  const sellerSummary = summarizeSignoffRows(
    sellerRows,
    'seller',
    sellerChecklistFields,
  );
  const managerSummary = summarizeSignoffRows(
    managerRows,
    'manager',
    managerChecklistFields,
  );
  const importSummary = summarizeImportRows(importRows);
  const status = buildOverallStatus({
    sellerSummary,
    managerSummary,
    importSummary,
  });
  const blockingReasons = buildBlockingReasons({
    sellerSummary,
    managerSummary,
    importSummary,
  });
  const nextActions = buildNextActions({
    status,
    sellerSummary,
    managerSummary,
    importSummary,
  });

  const reviewedAt = new Date().toISOString();
  const result = {
    status,
    reviewedAt,
    packDir,
    files,
    sellerSummary,
    managerSummary,
    importSummary,
    blockingReasons,
    nextActions,
  };

  const markdownLines = [
    '# Trade CRM Phase 1 Business Trial Pack Review',
    '',
    `Reviewed at: ${reviewedAt}`,
    '',
    `- Status: ${status}`,
    '',
    '## Seller sign-off summary',
    '',
    `- rowCount: ${sellerSummary.rowCount}`,
    `- acceptedCount: ${sellerSummary.acceptedCount}`,
    `- rejectedCount: ${sellerSummary.rejectedCount}`,
    `- pendingCount: ${sellerSummary.pendingCount}`,
    `- issueCount: ${sellerSummary.issueCount}`,
    `- invalidAcceptedChecklistCount: ${sellerSummary.invalidAcceptedChecklistCount}`,
    `- acceptedMissingSignoffDateCount: ${sellerSummary.acceptedMissingSignoffDateCount}`,
    '',
    '## Manager sign-off summary',
    '',
    `- rowCount: ${managerSummary.rowCount}`,
    `- acceptedCount: ${managerSummary.acceptedCount}`,
    `- rejectedCount: ${managerSummary.rejectedCount}`,
    `- pendingCount: ${managerSummary.pendingCount}`,
    `- issueCount: ${managerSummary.issueCount}`,
    `- invalidAcceptedChecklistCount: ${managerSummary.invalidAcceptedChecklistCount}`,
    `- acceptedMissingSignoffDateCount: ${managerSummary.acceptedMissingSignoffDateCount}`,
    '',
    '## Import register summary',
    '',
    `- rowCount: ${importSummary.rowCount}`,
    `- approvedCount: ${importSummary.approvedCount}`,
    `- pendingApprovalCount: ${importSummary.pendingApprovalCount}`,
    `- blockedApprovedRowCount: ${importSummary.blockedApprovedRowCount}`,
    `- approvedMissingImportDateCount: ${importSummary.approvedMissingImportDateCount}`,
    '',
    '## Blocking reasons',
    '',
    ...(blockingReasons.length > 0
      ? blockingReasons.map((reason) => `- ${reason}`)
      : ['- none']),
    '',
    '## Next actions',
    '',
    ...(nextActions.length > 0
      ? nextActions.map((action) => `- ${action}`)
      : ['- none']),
    '',
  ];

  fs.writeFileSync(
    path.join(packDir, 'phase1-business-trial-pack-review.json'),
    `${JSON.stringify(result, null, 2)}\n`,
    'utf8',
  );
  fs.writeFileSync(
    path.join(packDir, 'phase1-business-trial-pack-review.md'),
    `${markdownLines.join('\n')}\n`,
    'utf8',
  );

  return result;
};

module.exports = {
  reviewBusinessTrialPack,
};

if (require.main === module) {
  try {
    const result = reviewBusinessTrialPack();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
