const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const isWin = os.platform() === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('☕ Starting Coffee Chat App...\n');

// Start backend
const backend = spawn(npmCmd, ['start'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Wait a moment then start frontend
setTimeout(() => {
  const frontend = spawn(npmCmd, ['start'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, BROWSER: 'open' }
  });

  frontend.on('error', (e) => console.error('Frontend error:', e));
}, 1500);

backend.on('error', (e) => console.error('Backend error:', e));

process.on('SIGINT', () => {
  backend.kill();
  process.exit();
});
