#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const localTsPath = join(projectRoot, 'src', 'local.ts');

/**
 * Robustly find the tsx binary.
 * In npx/npm environments, it should be in the PATH.
 */
function getTsxCommand() {
  // Try to use 'tsx' from PATH first (most reliable in npx)
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
