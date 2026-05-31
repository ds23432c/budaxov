const { spawn } = require('child_process');

const publicPort = process.env.PORT || '8080';
const backendPort = process.env.BACKEND_PORT || '3001';

function run(command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  child.on('exit', (code, signal) => {
    if (code && code !== 0) {
      console.error(`${command} ${args.join(' ')} exited with code ${code}${signal ? ` signal ${signal}` : ''}`);
      process.exit(code);
    }
  });

  return child;
}

function runOnce(command, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        ...extraEnv,
      },
    });

    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with code ${code}${signal ? ` signal ${signal}` : ''}`));
    });
  });
}

async function main() {
  try {
    await runOnce('npm', ['--prefix', 'backend', 'run', 'db:generate']);
    await runOnce('npm', ['--prefix', 'backend', 'run', 'db:push']);
    await runOnce('npm', ['--prefix', 'frontend', 'run', 'build']);

    const backend = run('npm', ['--prefix', 'backend', 'run', 'start'], {
      PORT: backendPort,
    });

    const frontend = run('npm', ['--prefix', 'frontend', 'run', 'start', '--', '-p', publicPort, '-H', '0.0.0.0']);

    const shutdown = (code = 0) => {
      backend.kill('SIGTERM');
      frontend.kill('SIGTERM');
      process.exit(code);
    };

    backend.on('exit', (code) => {
      shutdown(code ?? 1);
    });

    frontend.on('exit', (code) => {
      shutdown(code ?? 1);
    });

    process.on('SIGTERM', () => shutdown(0));
    process.on('SIGINT', () => shutdown(0));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
