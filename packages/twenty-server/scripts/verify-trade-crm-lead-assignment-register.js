const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRootPath = path.resolve(__dirname, '..', '..', '..');
const nodeExecutable = process.execPath;
const convertScriptPath = path.resolve(
  __dirname,
  'convert-trade-crm-lead-assignment-rules-register.js',
);
const verifyRulesScriptPath = path.resolve(
  __dirname,
  'verify-trade-crm-lead-assignment-rules.js',
);

const runNodeScript = (scriptPath, envOverrides = {}) => {
  const result = spawnSync(nodeExecutable, [scriptPath], {
    cwd: repoRootPath,
    env: {
      ...process.env,
      ...envOverrides,
    },
    encoding: 'utf8',
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result.stdout;
};

const parseJsonFromStdout = (stdoutText) => {
  const trimmedText = stdoutText.trim();

  if (!trimmedText) {
    throw new Error('Expected JSON output from helper script');
  }

  return JSON.parse(trimmedText);
};

const main = () => {
  const convertOutput = runNodeScript(convertScriptPath);
  const convertSummary = parseJsonFromStdout(convertOutput);

  if (!convertSummary.outputFile) {
    throw new Error('Conversion summary did not include outputFile');
  }

  const verifyOutput = runNodeScript(verifyRulesScriptPath, {
    TRADE_CRM_LEAD_ASSIGNMENT_RULES_FILE: convertSummary.outputFile,
  });
  const verifySummary = parseJsonFromStdout(verifyOutput);

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        registerFile:
          process.env.TRADE_CRM_LEAD_ASSIGNMENT_REGISTER_FILE ||
          'trade-crm-lead-assignment-rules.phase1-register.csv',
        generatedRulesFile: convertSummary.outputFile,
        ruleCount: verifySummary.ruleCount,
        workspaceId: verifySummary.workspaceId,
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
