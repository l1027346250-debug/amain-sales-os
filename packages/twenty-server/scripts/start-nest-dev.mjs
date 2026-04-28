import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const nestCliPath = resolve(process.cwd(), '..', '..', 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');
const nestArguments = ['start', ...process.argv.slice(2)];

rmSync(resolve(process.cwd(), 'dist'), {
  force: true,
  recursive: true,
});

const childProcess = spawn(process.execPath, [nestCliPath, ...nestArguments], {
  env: {
    ...process.env,
    NODE_ENV: 'development',
  },
  stdio: 'inherit',
});

childProcess.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);

    return;
  }

  process.exit(code ?? 0);
});
