const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
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
const leadAssignmentRulesFile =
  process.env.TRADE_CRM_LEAD_ASSIGNMENT_RULES_FILE ||
  'trade-crm-lead-assignment-rules.example.json';
const repoRootPath = path.resolve(__dirname, '..', '..', '..');

const resolveRulesFile = (rulesFilePath) => {
  const candidatePaths = [
    rulesFilePath,
    path.resolve(process.cwd(), rulesFilePath),
    path.resolve(process.cwd(), '..', '..', rulesFilePath),
    path.resolve(repoRootPath, rulesFilePath),
  ];

  return candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));
};

const loadRules = () => {
  if (process.env.TRADE_CRM_LEAD_ASSIGNMENT_RULES_JSON?.trim()) {
    return {
      source: 'env_json',
      filePath: null,
      rules: JSON.parse(process.env.TRADE_CRM_LEAD_ASSIGNMENT_RULES_JSON),
    };
  }

  const resolvedFilePath = resolveRulesFile(leadAssignmentRulesFile);

  if (!resolvedFilePath) {
    throw new Error(
      `Lead assignment rules file not found: ${leadAssignmentRulesFile}`,
    );
  }

  return {
    source: 'file',
    filePath: resolvedFilePath,
    rules: JSON.parse(fs.readFileSync(resolvedFilePath, 'utf8')),
  };
};

const countSpecificity = (rule) =>
  [rule.source, rule.country, rule.productCategory].filter(Boolean).length;

const buildMatcherSignature = (rule) =>
  JSON.stringify({
    source: rule.source ?? null,
    country: rule.country ?? null,
    productCategory: rule.productCategory ?? null,
  });

const matchesCriterion = (leftValue, rightValue) => {
  if (!leftValue) {
    return true;
  }

  return leftValue === rightValue;
};

const shadowsRule = (leftRule, rightRule) =>
  matchesCriterion(leftRule.source, rightRule.source) &&
  matchesCriterion(leftRule.country, rightRule.country) &&
  matchesCriterion(leftRule.productCategory, rightRule.productCategory);

const normalizeRules = (rules) => {
  if (!Array.isArray(rules)) {
    throw new Error('Lead assignment rules must be a JSON array');
  }

  if (rules.length === 0) {
    throw new Error('Lead assignment rules must not be empty');
  }

  return rules.map((rule, index) => {
    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
      throw new Error(`Rule #${index + 1} must be a JSON object`);
    }

    const normalizedRule = {
      workspaceMemberId: rule.workspaceMemberId?.trim() || undefined,
      userEmail: rule.userEmail?.trim().toLowerCase() || undefined,
      source: rule.source?.trim() || undefined,
      country: rule.country?.trim() || undefined,
      productCategory: rule.productCategory?.trim() || undefined,
      priority:
        typeof rule.priority === 'number' && Number.isFinite(rule.priority)
          ? rule.priority
          : undefined,
      originalIndex: index,
    };

    if (!normalizedRule.workspaceMemberId && !normalizedRule.userEmail) {
      throw new Error(
        `Rule #${index + 1} must provide workspaceMemberId or userEmail`,
      );
    }

    return normalizedRule;
  });
};

const sortRules = (rules) =>
  [...rules].sort((leftRule, rightRule) => {
    const leftPriority = leftRule.priority ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = rightRule.priority ?? Number.MAX_SAFE_INTEGER;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    const specificityDifference =
      countSpecificity(rightRule) - countSpecificity(leftRule);

    if (specificityDifference !== 0) {
      return specificityDifference;
    }

    return leftRule.originalIndex - rightRule.originalIndex;
  });

const validateConflicts = (rules) => {
  const seenSignatures = new Map();

  for (const rule of rules) {
    const signature = buildMatcherSignature(rule);
    const matchingRule = seenSignatures.get(signature);

    if (matchingRule) {
      throw new Error(
        `Rule #${matchingRule.originalIndex + 1} conflicts with rule #${rule.originalIndex + 1}: duplicate matcher combination ${signature}`,
      );
    }

    seenSignatures.set(signature, rule);
  }

  for (let index = 0; index < rules.length; index += 1) {
    const currentRule = rules[index];

    for (
      let nextIndex = index + 1;
      nextIndex < rules.length;
      nextIndex += 1
    ) {
      const nextRule = rules[nextIndex];

      if (shadowsRule(currentRule, nextRule)) {
        throw new Error(
          `Rule #${currentRule.originalIndex + 1} shadows rule #${nextRule.originalIndex + 1}; reorder priorities or make the earlier rule more specific`,
        );
      }
    }
  }
};

const validateWorkspaceMembers = async (rules) => {
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
    const validation = [];

    for (const rule of rules) {
      if (rule.workspaceMemberId) {
        const matchingMember = members.find(
          (member) => member.id === rule.workspaceMemberId,
        );

        if (!matchingMember) {
          throw new Error(
            `Rule #${rule.originalIndex + 1} references missing workspaceMemberId ${rule.workspaceMemberId}`,
          );
        }

        validation.push({
          ruleIndex: rule.originalIndex + 1,
          workspaceMemberId: matchingMember.id,
          userEmail: matchingMember.userEmail ?? null,
        });

        continue;
      }

      const matchingMembers = members.filter(
        (member) =>
          member.userEmail?.trim().toLowerCase() === rule.userEmail,
      );

      if (matchingMembers.length !== 1) {
        throw new Error(
          `Rule #${rule.originalIndex + 1} expected exactly 1 workspace member for ${rule.userEmail}, received ${matchingMembers.length}`,
        );
      }

      validation.push({
        ruleIndex: rule.originalIndex + 1,
        workspaceMemberId: matchingMembers[0].id,
        userEmail: matchingMembers[0].userEmail ?? null,
      });
    }

    return validation;
  } finally {
    await client.end();
  }
};

const main = async () => {
  const loadedRules = loadRules();
  const normalizedRules = normalizeRules(loadedRules.rules);
  const sortedRules = sortRules(normalizedRules);

  validateConflicts(sortedRules);

  const workspaceValidation = await validateWorkspaceMembers(sortedRules);

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        workspaceId,
        source: loadedRules.source,
        filePath: loadedRules.filePath,
        ruleCount: sortedRules.length,
        rules: sortedRules.map((rule) => ({
          priority: rule.priority ?? null,
          source: rule.source ?? null,
          country: rule.country ?? null,
          productCategory: rule.productCategory ?? null,
          workspaceMemberId: rule.workspaceMemberId ?? null,
          userEmail: rule.userEmail ?? null,
          specificity: countSpecificity(rule),
          originalIndex: rule.originalIndex + 1,
        })),
        workspaceValidation,
      },
      null,
      2,
    ),
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
