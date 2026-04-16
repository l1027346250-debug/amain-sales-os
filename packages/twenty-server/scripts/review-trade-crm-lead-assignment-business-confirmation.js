const path = require('node:path');
const {
  convertBusinessConfirmationToRegister,
} = require('./convert-trade-crm-lead-assignment-business-confirmation.js');
const {
  summarizeBusinessConfirmation,
} = require('./summarize-trade-crm-lead-assignment-business-confirmation.js');
const {
  compareRegisters,
} = require('./compare-trade-crm-lead-assignment-registers.js');

const repoRootPath = path.resolve(__dirname, '..', '..', '..');
const defaultBusinessConfirmationFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_BUSINESS_CONFIRMATION_FILE ||
  'trade-crm-lead-assignment-rules.phase1-business-confirmation.csv';
const defaultCandidateRegisterFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_REGISTER_OUTPUT_FILE ||
  'trade-crm-lead-assignment-rules.phase1-from-business-confirmation.csv';
const defaultCurrentRegisterFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_REGISTER_FILE ||
  'trade-crm-lead-assignment-rules.phase1-register.csv';

const main = () => {
  const summary = summarizeBusinessConfirmation({
    inputFile: defaultBusinessConfirmationFile,
  });

  const conversion = convertBusinessConfirmationToRegister({
    inputFile: defaultBusinessConfirmationFile,
    outputFile: defaultCandidateRegisterFile,
  });

  const compare = compareRegisters({
    currentRegisterFile: defaultCurrentRegisterFile,
    candidateRegisterFile: defaultCandidateRegisterFile,
  });

  const reviewStatus =
    summary.readyForConversionRowCount === 0
      ? 'waiting_for_business_confirmation'
      : compare.addedCount === 0 &&
          compare.changedCount === 0 &&
          compare.removedCount === 0
        ? 'no_register_delta'
        : 'candidate_delta_ready_for_review';

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        reviewStatus,
        businessConfirmationFile: path.resolve(repoRootPath, defaultBusinessConfirmationFile),
        candidateRegisterFile: conversion.outputFile,
        currentRegisterFile: compare.currentRegisterFile,
        summary: {
          rowCount: summary.rowCount,
          approvedRowCount: summary.approvedRowCount,
          pendingRowCount: summary.pendingRowCount,
          readyForConversionRowCount: summary.readyForConversionRowCount,
          blockerCount: summary.actionItems.length,
        },
        conversion: {
          approvedRowCount: conversion.approvedRowCount,
        },
        compare: {
          addedCount: compare.addedCount,
          removedCount: compare.removedCount,
          changedCount: compare.changedCount,
        },
      },
      null,
      2,
    ),
  );
};

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
