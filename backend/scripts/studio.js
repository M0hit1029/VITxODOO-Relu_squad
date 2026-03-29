const { spawn } = require('child_process');
const readline = require('readline');
const path = require('path');

const backendRoot = path.resolve(__dirname, '..');

const child = spawn(
  'npx prisma studio --config prisma.config.ts',
  [],
  {
    cwd: backendRoot,
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe'],
  }
);

let suppressBlock = false;

const stdoutRl = readline.createInterface({ input: child.stdout });
stdoutRl.on('line', (line) => {
  process.stdout.write(`${line}\n`);
});

const stderrRl = readline.createInterface({ input: child.stderr });
stderrRl.on('line', (line) => {
  const isSuppressedStart = line.includes('ERR_STREAM_UNABLE_TO_PIPE');

  if (isSuppressedStart) {
    suppressBlock = true;
    return;
  }

  if (suppressBlock) {
    if (line.trim() === '') {
      suppressBlock = false;
    }
    return;
  }

  process.stderr.write(`${line}\n`);
});

const shutdown = () => {
  if (!child.killed) {
    child.kill('SIGINT');
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
