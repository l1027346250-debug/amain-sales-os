const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const appRoot = path.resolve(__dirname, '..');
const outputDir = path.join(
  appRoot,
  'tmp',
  'trade-crm-trial',
  'business-trial-pack',
);

const requiredInputs = [
  {
    id: 'business-trial-readiness-json',
    path: path.join(
      appRoot,
      'tmp',
      'trade-crm-trial',
      'phase1-business-trial-readiness.json',
    ),
  },
  {
    id: 'runtime-walkthrough-json',
    path: path.join(appRoot, 'tmp', 'sales-workbench-runtime-walkthrough-v2.json'),
  },
  {
    id: 'seller-signoff-template',
    path: path.join(
      repoRoot,
      'trade-crm-phase1-trial-seller-signoff.template.csv',
    ),
  },
  {
    id: 'manager-signoff-template',
    path: path.join(
      repoRoot,
      'trade-crm-phase1-trial-manager-signoff.template.csv',
    ),
  },
  {
    id: 'import-register-template',
    path: path.join(
      repoRoot,
      'trade-crm-phase1-trial-import-register.template.csv',
    ),
  },
];

const linkedReferences = [
  path.join(
    repoRoot,
    'trade-crm-lead-assignment-rules.phase1-product-category-confirmation.csv',
  ),
  path.join(repoRoot, 'trade-crm-lead-assignment-rules.phase1-approval-draft.md'),
  path.join(repoRoot, 'trade-crm-lead-assignment.phase1-pool-staffing-template.csv'),
  path.join(
    repoRoot,
    'trade-crm-lead-assignment.phase1-pool-staff-level-template.csv',
  ),
  path.join(
    repoRoot,
    'trade-crm-post-launch-runtime-assignment-activation.approval.template.json',
  ),
  path.join(appRoot, 'docs', 'trade-crm-phase1-business-trial-checklist.md'),
  path.join(appRoot, 'docs', 'trade-crm-phase1-business-trial-execution-pack.md'),
  path.join(appRoot, 'docs', 'trade-crm-phase1-trial-run-playbook.md'),
];

for (const input of requiredInputs) {
  if (!fs.existsSync(input.path)) {
    console.error(
      `[prepare:trade-crm-phase1-business-trial-pack] Missing required input: ${input.id}`,
    );
    console.error(input.path);
    process.exit(1);
  }
}

fs.mkdirSync(outputDir, { recursive: true });

const copiedFiles = [
  {
    from: requiredInputs[2].path,
    to: path.join(outputDir, 'seller-signoff.csv'),
    blankTo: path.join(outputDir, 'seller-signoff.blank.csv'),
  },
  {
    from: requiredInputs[3].path,
    to: path.join(outputDir, 'manager-signoff.csv'),
    blankTo: path.join(outputDir, 'manager-signoff.blank.csv'),
  },
  {
    from: requiredInputs[4].path,
    to: path.join(outputDir, 'import-register.csv'),
    blankTo: path.join(outputDir, 'import-register.blank.csv'),
  },
];

const fileOperations = [];

for (const file of copiedFiles) {
  if (!fs.existsSync(file.to)) {
    fs.copyFileSync(file.from, file.to);
    fileOperations.push({
      type: 'working-file',
      path: file.to,
      action: 'created_from_template',
    });
  } else {
    fileOperations.push({
      type: 'working-file',
      path: file.to,
      action: 'preserved_existing',
    });
  }

  fs.copyFileSync(file.from, file.blankTo);
  fileOperations.push({
    type: 'blank-file',
    path: file.blankTo,
    action: 'refreshed_from_template',
  });
}

const preparedAt = new Date().toISOString();
const importChecklistPath = path.join(outputDir, 'phase1-import-rehearsal-checklist.md');
const importChecklistLines = [
  '# Phase 1 Import Rehearsal Checklist',
  '',
  '## Import order',
  '',
  '1. Companies',
  '2. People',
  '3. Leads',
  '4. Opportunities',
  '',
  '## Checks before import',
  '',
  '- Confirm owner mapping is ready.',
  '- Confirm staff-level maintenance is ready.',
  '- Confirm the sample CSV headers still match the phase-1 field configuration baseline.',
  '- Confirm company names, people names, and opportunity references match across files.',
  '- Confirm stage values match the configured pipeline stages.',
  '',
  '## Sample files in this pack',
  '',
  '- companies-import.sample.csv',
  '- people-import.sample.csv',
  '- leads-import.sample.csv',
  '- opportunities-import.sample.csv',
  '',
  '## Blank working files in this pack',
  '',
  '- seller-signoff.blank.csv',
  '- manager-signoff.blank.csv',
  '- import-register.blank.csv',
  '',
];

fs.writeFileSync(importChecklistPath, `${importChecklistLines.join('\n')}\n`, 'utf8');

const manifest = {
  status: 'prepared',
  preparedAt,
  outputDir,
  prerequisites: requiredInputs.map((input) => ({
    id: input.id,
    path: input.path,
  })),
  generatedFiles: copiedFiles.map((file) => file.to),
  fileOperations,
  linkedReferences,
  nextActions: [
    'Review seller-signoff.csv with the first trial seller group.',
    'Review manager-signoff.csv with the manager or supervisor group.',
    'Keep import-register.csv empty until real data import is approved.',
    'Fill runtime owner mapping only after product-category routing is confirmed.',
  ],
};

const markdownLines = [
  '# Trade CRM Phase 1 Business Trial Pack',
  '',
  `Prepared at: ${preparedAt}`,
  '',
  '## Output directory',
  '',
  `- ${outputDir}`,
  '',
  '## Generated working files',
  '',
  ...copiedFiles.map((file) => `- ${file.to}`),
  '',
  '## Blank template copies',
  '',
  ...copiedFiles.map((file) => `- ${file.blankTo}`),
  '',
  '## File operations',
  '',
  ...fileOperations.map(
    (entry) => `- ${entry.type}: ${entry.action}: ${entry.path}`,
  ),
  '',
  '## Required prerequisites',
  '',
  ...requiredInputs.map((input) => `- ${input.id}: ${input.path}`),
  '',
  '## Import rehearsal checklist',
  '',
  `- ${importChecklistPath}`,
  '',
  '## Linked references',
  '',
  ...linkedReferences.map((reference) => `- ${reference}`),
  '',
  '## Next actions',
  '',
  ...manifest.nextActions.map((action) => `- ${action}`),
  '',
];

fs.writeFileSync(
  path.join(outputDir, 'phase1-business-trial-pack-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

fs.writeFileSync(
  path.join(outputDir, 'phase1-business-trial-pack-manifest.md'),
  markdownLines.join('\n'),
  'utf8',
);

console.log(
  JSON.stringify(
    {
      status: manifest.status,
      outputDir,
      generatedFiles: manifest.generatedFiles,
    },
    null,
    2,
  ),
);
