const fs = require('node:fs');
const path = require('node:path');

const repoRootPath = path.resolve(__dirname, '..', '..', '..');

const defaultTemplateFile =
  process.env.TRADE_CRM_RUNTIME_ASSIGNMENT_ACTIVATION_APPROVAL_TEMPLATE_FILE ||
  'trade-crm-post-launch-runtime-assignment-activation.approval.template.json';
const defaultOutputFile =
  process.env.TRADE_CRM_RUNTIME_ASSIGNMENT_ACTIVATION_APPROVAL_FILE ||
  'trade-crm-post-launch-runtime-assignment-activation.approval.json';

const resolveFilePath = (filePath) => {
  const candidatePaths = [
    filePath,
    path.resolve(process.cwd(), filePath),
    path.resolve(process.cwd(), '..', '..', filePath),
    path.resolve(repoRootPath, filePath),
  ];

  return candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));
};

const initRuntimeAssignmentActivationApproval = ({
  templateFile = defaultTemplateFile,
  outputFile = defaultOutputFile,
} = {}) => {
  const resolvedTemplateFile = resolveFilePath(templateFile);

  if (!resolvedTemplateFile) {
    throw new Error(`Approval template file not found: ${templateFile}`);
  }

  const resolvedOutputFile = path.resolve(repoRootPath, outputFile);

  if (fs.existsSync(resolvedOutputFile)) {
    return {
      status: 'ok',
      result: 'already_exists',
      templateFile: resolvedTemplateFile,
      outputFile: resolvedOutputFile,
    };
  }

  const template = JSON.parse(fs.readFileSync(resolvedTemplateFile, 'utf8'));
  const payload = {
    ...template,
    notes:
      template.notes ??
      'Fill this file and set approved=true before manual runtime activation.',
  };

  fs.writeFileSync(resolvedOutputFile, JSON.stringify(payload, null, 2), 'utf8');

  return {
    status: 'ok',
    result: 'created',
    templateFile: resolvedTemplateFile,
    outputFile: resolvedOutputFile,
  };
};

module.exports = {
  initRuntimeAssignmentActivationApproval,
};

if (require.main === module) {
  try {
    const result = initRuntimeAssignmentActivationApproval();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
