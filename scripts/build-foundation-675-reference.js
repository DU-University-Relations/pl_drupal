#!/usr/bin/env node

/**
 * Build Foundation 6.7.5 Reference
 * 
 * Temporarily installs Foundation 6.7.5, compiles it with settings, 
 * and saves as reference. Then restores Foundation 6.9.0.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PACKAGE_JSON = path.join(__dirname, '../package.json');
const PACKAGE_LOCK = path.join(__dirname, '../package-lock.json');
const OUTPUT_FILE = path.join(__dirname, 'foundation-675-reference.css');

console.log('Building Foundation 6.7.5 reference...\n');

// Backup current package files
console.log('1. Backing up package files...');
const pkgBackup = fs.readFileSync(PACKAGE_JSON, 'utf8');
const lockBackup = fs.existsSync(PACKAGE_LOCK) ? fs.readFileSync(PACKAGE_LOCK, 'utf8') : null;

try {
  // Install Foundation 6.7.5
  console.log('2. Installing Foundation 6.7.5 temporarily...');
  execSync('npm install foundation-sites@6.7.5 --save-exact', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });

  // Build foundation.css
  console.log('\n3. Compiling Foundation 6.7.5...');
  execSync('npm run build', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });

  // Copy foundation.css as reference
  console.log('\n4. Saving Foundation 6.7.5 reference...');
  const foundationCSS = fs.readFileSync(path.join(__dirname, '../dest/foundation.css'), 'utf8');
  
  const header = `/**
 * Foundation for Sites 6.7.5 Reference
 * Compiled on ${new Date().toISOString().split('T')[0]}
 * 
 * This is Foundation 6.7.5 compiled with DU settings from scss/_settings.scss
 * Used as a reference for extraction comparisons to match legacy sparkle.css
 */

`;
  
  fs.writeFileSync(OUTPUT_FILE, header + foundationCSS, 'utf8');
  
  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`✓ Foundation 6.7.5 reference saved (${(stats.size / 1024).toFixed(2)} KB)\n`);

} finally {
  // Restore original packages
  console.log('5. Restoring Foundation 6.9.0...');
  fs.writeFileSync(PACKAGE_JSON, pkgBackup, 'utf8');
  if (lockBackup) {
    fs.writeFileSync(PACKAGE_LOCK, lockBackup, 'utf8');
  }
  
  execSync('npm install', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  
  console.log('\n✓ Foundation 6.9.0 restored');
  console.log(`✓ Reference file ready: ${OUTPUT_FILE}\n`);
}
