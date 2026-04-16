const { Client } = require('pg');
const {
  summarizePoolStaffingTemplate,
  parseCsv,
} = require('./summarize-trade-crm-pool-staffing-template.js');
const fs = require('node:fs');
const path = require('node:path');
const {
  loadWorkspaceSchema,
} = require('./resolve-trade-crm-workspace-schema.js');

const workspaceId =
  process.env.TRADE_CRM_WORKSPACE_ID ||
  process.argv[2] ||
  '20202020-1c25-4d02-bf25-6aeccf7ea419';
const pgDatabaseUrl =
  process.env.PG_DATABASE_URL ||
  'postgres://postgres:postgres@127.0.0.1:5432/default';
const defaultInputFile =
  process.env.TRADE_CRM_POOL_STAFFING_TEMPLATE_FILE ||
  'trade-crm-lead-assignment.phase1-pool-staffing-template.csv';
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

const normalizeEmail = (value) => value?.trim().toLowerCase() || '';

const validateWorkspaceMembers = async (rows) => {
  const client = new Client({ connectionString: pgDatabaseUrl });

  await client.connect();

  try {
    const workspaceSchema = await loadWorkspaceSchema({
      workspaceId,
      client,
    });
    const result = await client.query(
      `
        SELECT id, "userEmail"
        FROM ${workspaceSchema}."workspaceMember"
      `,
    );

    const members = result.rows;
    const matchedMembers = [];
    const pendingRows = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const memberEmail = normalizeEmail(row.memberEmail);

      if (!memberEmail) {
        pendingRows.push({
          rowNumber,
          targetPool: row.targetPool?.trim() || '',
          reason: 'missing_member_email',
        });

        return;
      }

      const matches = members.filter(
        (member) => normalizeEmail(member.userEmail) === memberEmail,
      );

      if (matches.length !== 1) {
        throw new Error(
          `Row ${rowNumber} expected exactly 1 workspace member for ${memberEmail}, received ${matches.length}`,
        );
      }

      matchedMembers.push({
        rowNumber,
        targetPool: row.targetPool?.trim() || '',
        memberEmail,
        workspaceMemberId: matches[0].id,
      });
    });

    return {
      matchedMembers,
      pendingRows,
    };
  } finally {
    await client.end();
  }
};

const verifyPoolStaffingTemplate = async ({
  inputFile = defaultInputFile,
} = {}) => {
  const summary = summarizePoolStaffingTemplate({ inputFile });
  const resolvedInputFile = resolveFilePath(inputFile);

  if (!resolvedInputFile) {
    throw new Error(`Pool staffing template file not found: ${inputFile}`);
  }

  const rows = parseCsv(fs.readFileSync(resolvedInputFile, 'utf8'));
  const workspaceValidation = await validateWorkspaceMembers(rows);

  return {
    status: 'ok',
    workspaceId,
    inputFile: resolvedInputFile,
    rowCount: summary.rowCount,
    enabledRowCount: summary.enabledRowCount,
    filledMemberEmailCount: summary.filledMemberEmailCount,
    pendingMemberEmailCount: workspaceValidation.pendingRows.length,
    matchedWorkspaceMemberCount: workspaceValidation.matchedMembers.length,
    poolStrategies: summary.poolStrategies,
    workspaceValidation,
  };
};

module.exports = {
  verifyPoolStaffingTemplate,
};

if (require.main === module) {
  verifyPoolStaffingTemplate()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
