const { execFileSync, spawnSync } = require('child_process');

const parseArguments = (argv) => {
  let project = 'project';
  let shouldFix = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--project') {
      project = argv[index + 1] ?? project;
      index += 1;
      continue;
    }

    if (argument === '--fix') {
      shouldFix = true;
    }
  }

  return {
    project,
    shouldFix,
  };
};

const runCommand = (command, args) => {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const getChangedSourceFiles = () => {
  const gitOutput = execFileSync(
    'git',
    [
      'diff',
      '--name-only',
      '--relative',
      '--diff-filter=d',
      'main...HEAD',
      '--',
      'src/',
    ],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
    },
  );

  return gitOutput
    .split(/\r?\n/)
    .map((filePath) => filePath.trim())
    .filter(
      (filePath) =>
        filePath.length > 0 &&
        (filePath.endsWith('.ts') || filePath.endsWith('.tsx')),
    );
};

const { project, shouldFix } = parseArguments(process.argv.slice(2));
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const changedFiles = getChangedSourceFiles();

if (changedFiles.length === 0) {
  console.log('No changed files.');
  process.exit(0);
}

runCommand(npxCommand, [
  'oxlint',
  '--type-aware',
  ...(shouldFix ? ['--fix'] : []),
  '-c',
  '.oxlintrc.json',
  ...changedFiles,
]);

const prettierArgs = [shouldFix ? '--write' : '--check', ...changedFiles];
const prettierResult = spawnSync(npxCommand, ['prettier', ...prettierArgs], {
  cwd: process.cwd(),
  encoding: 'utf8',
  stdio: 'inherit',
});

if (prettierResult.status !== 0) {
  if (!shouldFix) {
    console.error(
      `ERROR: Prettier formatting check failed! Fix with: npx nx lint:diff-with-main ${project} --configuration=fix`,
    );
  }

  process.exit(prettierResult.status ?? 1);
}
