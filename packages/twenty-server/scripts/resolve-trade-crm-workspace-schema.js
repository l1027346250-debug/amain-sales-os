const { Client } = require('pg');

const validateSchemaName = (schemaName) => {
  if (!schemaName || !/^[a-zA-Z0-9_]+$/.test(schemaName)) {
    throw new Error(`Invalid workspace schema name: ${schemaName ?? 'missing'}`);
  }

  return schemaName;
};

const loadWorkspaceSchema = async ({
  connectionString,
  workspaceId,
  client: existingClient,
}) => {
  const client = existingClient ?? new Client({ connectionString });
  const shouldClose = !existingClient;

  if (shouldClose) {
    await client.connect();
  }

  try {
    const workspaceResult = await client.query(
      `
        SELECT "databaseSchema"
        FROM core."workspace"
        WHERE id = $1
        LIMIT 1
      `,
      [workspaceId],
    );

    const databaseSchema = workspaceResult.rows[0]?.databaseSchema;

    if (!databaseSchema) {
      throw new Error(
        `Workspace ${workspaceId} not found in core.workspace or databaseSchema is empty`,
      );
    }

    return validateSchemaName(databaseSchema);
  } finally {
    if (shouldClose) {
      await client.end();
    }
  }
};

module.exports = {
  loadWorkspaceSchema,
  validateSchemaName,
};
