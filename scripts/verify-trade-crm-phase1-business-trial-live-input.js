const fs = require('node:fs');
const path = require('node:path');

const {
  parseCsv,
} = require('../packages/twenty-server/scripts/convert-trade-crm-lead-assignment-rules-register.js');

const appRoot = path.resolve(__dirname, '..');
const packDir = path.join(appRoot, 'tmp', 'trade-crm-trial', 'business-trial-pack');

const files = {
  sellerSignoff: path.join(packDir, 'seller-signoff.csv'),
  managerSignoff: path.join(packDir, 'manager-signoff.csv'),
  importRegister: path.join(packDir, 'import-register.csv'),
};

const sampleMarkers = ['sample', 'mock', 'example', 'trial'];

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

const containsSampleMarker = (value) => {
  const normalized = String(value || '').trim().toLowerCase();

  return sampleMarkers.some((marker) => normalized.includes(marker));
};

const collectHits = (rows, columns, label) => {
  const hits = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;

    columns.forEach((column) => {
      if (containsSampleMarker(row[column])) {
        hits.push({
          label,
          rowNumber,
          column,
          value: row[column],
        });
      }
    });
  });

  return hits;
};

const verifyBusinessTrialLiveInput = () => {
  const sellerRows = loadCsv(files.sellerSignoff, 'Seller sign-off');
  const managerRows = loadCsv(files.managerSignoff, 'Manager sign-off');
  const importRows = loadCsv(files.importRegister, 'Import register');

  const sampleHits = [
    ...collectHits(sellerRows, ['seller_name', 'remarks'], 'sellerSignoff'),
    ...collectHits(managerRows, ['manager_name', 'remarks'], 'managerSignoff'),
    ...collectHits(
      importRows,
      ['data_batch_name', 'source_channel', 'remarks'],
      'importRegister',
    ),
  ];

  const status =
    sampleHits.length > 0 ? 'sample_baseline_only' : 'ready_for_business_owned_input';

  const reviewedAt = new Date().toISOString();
  const result = {
    status,
    reviewedAt,
    packDir,
    files,
    sampleMarkerHitCount: sampleHits.length,
    sampleHits,
    nextActions:
      status === 'sample_baseline_only'
        ? [
            'Replace seller and manager mock/example names with real business owners.',
            'Replace import batch names and remarks with business-owned trial batch identifiers.',
            'Re-run verify:trade-crm-phase1-business-trial-live-input after business-owned rows are entered.',
          ]
        : ['Current working files no longer contain sample/mock/example markers.'],
  };

  const markdownLines = [
    '# Trade CRM Phase 1 Business Trial Live-Input Verification',
    '',
    `Reviewed at: ${reviewedAt}`,
    '',
    `- Status: ${status}`,
    `- sampleMarkerHitCount: ${sampleHits.length}`,
    '',
    '## Sample marker hits',
    '',
    ...(sampleHits.length > 0
      ? sampleHits.map(
          (hit) =>
            `- ${hit.label} row ${hit.rowNumber} column ${hit.column}: ${hit.value}`,
        )
      : ['- none']),
    '',
    '## Next actions',
    '',
    ...result.nextActions.map((action) => `- ${action}`),
    '',
  ];

  fs.writeFileSync(
    path.join(packDir, 'phase1-business-trial-live-input-check.json'),
    `${JSON.stringify(result, null, 2)}\n`,
    'utf8',
  );
  fs.writeFileSync(
    path.join(packDir, 'phase1-business-trial-live-input-check.md'),
    `${markdownLines.join('\n')}\n`,
    'utf8',
  );

  return result;
};

module.exports = {
  verifyBusinessTrialLiveInput,
};

if (require.main === module) {
  try {
    const result = verifyBusinessTrialLiveInput();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
