const fs = require('node:fs');
const path = require('node:path');
const {
  compareRegisters,
} = require('./compare-trade-crm-lead-assignment-registers.js');

const repoRootPath = path.resolve(__dirname, '..', '..', '..');
const defaultCurrentRegisterFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_REGISTER_FILE ||
  'trade-crm-lead-assignment-rules.phase1-register.csv';
const defaultCandidateRegisterFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_CANDIDATE_REGISTER_FILE ||
  'trade-crm-lead-assignment-rules.phase1-from-business-confirmation.csv';

const resolveFilePath = (filePath) => {
  const candidatePaths = [
    filePath,
    path.resolve(process.cwd(), filePath),
    path.resolve(process.cwd(), '..', '..', filePath),
    path.resolve(repoRootPath, filePath),
  ];

  return candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));
};

const timestampForFile = () =>
  new Date().toISOString().replace(/[:.]/g, '-');

const main = () => {
  const compare = compareRegisters({
    currentRegisterFile: defaultCurrentRegisterFile,
    candidateRegisterFile: defaultCandidateRegisterFile,
  });

  if (compare.candidateRowCount === 0) {
    throw new Error(
      'Refusing to apply lead assignment candidate: candidate register is empty.',
    );
  }

  if (
    compare.addedCount === 0 &&
    compare.changedCount === 0 &&
    compare.removedCount === compare.currentRowCount
  ) {
    throw new Error(
      'Refusing to apply lead assignment candidate: candidate would remove every current routing row.',
    );
  }

  if (
    compare.addedCount === 0 &&
    compare.changedCount === 0 &&
    compare.removedCount === 0
  ) {
    console.log(
      JSON.stringify(
        {
          status: 'ok',
          applyStatus: 'no_changes',
          currentRegisterFile: compare.currentRegisterFile,
          candidateRegisterFile: compare.candidateRegisterFile,
        },
        null,
        2,
      ),
    );
    return;
  }

  const resolvedCurrentFile = resolveFilePath(defaultCurrentRegisterFile);
  const resolvedCandidateFile = resolveFilePath(defaultCandidateRegisterFile);

  if (!resolvedCurrentFile || !resolvedCandidateFile) {
    throw new Error('Resolved register file paths are missing before apply.');
  }

  const backupFilePath = `${resolvedCurrentFile}.${timestampForFile()}.bak`;

  fs.copyFileSync(resolvedCurrentFile, backupFilePath);
  fs.copyFileSync(resolvedCandidateFile, resolvedCurrentFile);

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        applyStatus: 'applied',
        currentRegisterFile: resolvedCurrentFile,
        candidateRegisterFile: resolvedCandidateFile,
        backupFilePath,
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
  console.error(error.message || error);
  process.exit(1);
}
