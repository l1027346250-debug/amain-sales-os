const fs = require('node:fs');
const path = require('node:path');

const serverRoot = path.resolve(__dirname, '..');
const workspacePackagesRoot = path.resolve(serverRoot, '..');
const sourceRoot = path.join(workspacePackagesRoot, 'twenty-client-sdk');
const targetRoot = path.join(serverRoot, 'dist', 'assets', 'twenty-client-sdk');

fs.mkdirSync(targetRoot, { recursive: true });
fs.copyFileSync(
  path.join(sourceRoot, 'package.json'),
  path.join(targetRoot, 'package.json'),
);
fs.rmSync(path.join(targetRoot, 'dist'), { force: true, recursive: true });
fs.cpSync(path.join(sourceRoot, 'dist'), path.join(targetRoot, 'dist'), {
  recursive: true,
});
