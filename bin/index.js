#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const localTsPath = join(projectRoot, 'src', 'local.ts');

/**
 * Robustly find the tsx binary.
 * Checks the package's local node_modules/.bin first, then falls back to PATH.
 */
function getTsxCommand() {
  const binaryName = process.platform === 'win32' ? 'tsx.cmd' : 'tsx';
  const localTsx = join(projectRoot, 'node_modules', '.bin', binaryName);
  if (existsSync(localTsx)) {
    return localTsx;
  }
  return 'tsx';
}

// Spawn the tsx process to run the MCP server
const child = spawn(getTsxCommand(), [localTsPath], {
  cwd: projectRoot,
  stdio: ['inherit', 'inherit', 'inherit'],
  shell: true, // Use shell to help find the command in PATH on all platforms
  env: {
    ...process.env,
    NODE_OPTIONS: '--no-warnings'
  }
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

child.on('error', (err) => {
  console.error('Failed to start MCP server process:', err);
  process.exit(1);
});

// Handle termination signals
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
