const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  convertBusinessConfirmationToRegister,
} = require('./convert-trade-crm-lead-assignment-business-confirmation.js');

const splitCsvLine = (line) => {
  const values = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      const nextCharacter = line[index + 1];

      if (insideQuotes && nextCharacter === '"') {
        currentValue += '"';
        index += 1;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === ',' && !insideQuotes) {
      values.push(currentValue);
      currentValue = '';
      continue;
    }

    currentValue += character;
  }

  values.push(currentValue);

  return values.map((value) => value.trim());
};

const parseCsv = (csvContent) => {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const headers = splitCsvLine(lines[0]);
  const rows = [];

  for (let index = 1; index < lines.length; index += 1) {
    const values = splitCsvLine(lines[index]);
    const row = {};

    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex];
    });

    rows.push(row);
  }

  return rows;
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const main = () => {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'trade-crm-business-confirmation-verify-'),
  );
  const inputFile = path.join(tempDir, 'business-confirmation.csv');
  const outputFile = path.join(tempDir, 'generated-register.csv');

  const inputCsv = [
    'priority,source,country,productCategory,ownerRole,ownerEmail,enabled,decisionStatus,businessNotes',
    '10,ALIBABA,US,,北美负责人,tim@example.com,true,Approved,阿里美国线索',
    '20,ALIBABA,DE,,欧洲负责人,jane@example.com,true,Confirmed,阿里德国线索',
    '30,ALIBABA,JP,,日本负责人,jony@example.com,true,Pending,阿里日本线索',
    '40,MANUAL,US,,美国人工录入负责人,manual@example.com,false,Approved,禁用示例',
  ].join('\n');

  fs.writeFileSync(inputFile, `${inputCsv}\n`, 'utf8');

  const commandOutput = convertBusinessConfirmationToRegister({
    inputFile,
    outputFile,
  });
  const generatedCsv = fs.readFileSync(outputFile, 'utf8');
  const generatedRows = parseCsv(generatedCsv);

  assert(commandOutput.status === 'ok', 'Expected converter to return ok status');
  assert(commandOutput.rowCount === 4, 'Expected four input rows');
  assert(
    commandOutput.approvedRowCount === 2,
    'Expected only approved and confirmed enabled rows to be exported',
  );
  assert(generatedRows.length === 2, 'Expected two generated technical register rows');
  assert(
    generatedRows[0].userEmail === 'tim@example.com',
    'Expected first generated row to preserve lowercase owner email',
  );
  assert(
    generatedRows[1].userEmail === 'jane@example.com',
    'Expected second generated row to preserve lowercase owner email',
  );
  assert(
    generatedRows[0].notes.includes('角色=北美负责人'),
    'Expected generated notes to include readable owner role text',
  );
  assert(
    generatedRows[0].notes.includes('阿里美国线索'),
    'Expected generated notes to include business notes text',
  );

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        inputRowCount: commandOutput.rowCount,
        approvedRowCount: commandOutput.approvedRowCount,
        generatedRegisterRowCount: generatedRows.length,
        outputFile,
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
