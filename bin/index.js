#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Find the local tsx binary
const projectRoot = join(__dirname, '..');
const tsxPath = join(projectRoot, 'node_modules', '.bin', 'tsx');
const localTsPath = join(projectRoot, 'src', 'local.ts');

if (!existsSync(tsxPath)) {
  console.error(`Error: tsx not found at ${tsxPath}`);
  console.error('Please ensure dependencies are installed.');
  process.exit(1);
}

// Spawn the tsx process to run the MCP server
const child = spawn(tsxPath, [localTsPath], {
  cwd: projectRoot,
  stdio: ['inherit', 'inherit', 'inherit'], // Use inherit to pass stdio directly
  env: {
    ...process.env,
    // Ensure no unwanted output on stdout
    NODE_OPTIONS: '--no-warnings'
  }
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

child.on('error', (err) => {
  console.error('Failed to start MCP server:', err);
  process.exit(1);
});
