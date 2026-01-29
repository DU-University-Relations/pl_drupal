#!/usr/bin/env node

/**
 * Build Reference Libraries CSS
 *
 * Uses Foundation 6.7.5 reference (extracted from sparkle.css), then concatenates 
 * with Drupal Seven tabs and Slick carousel CSS for comparison during extraction.
 * 
 * IMPORTANT: Sparkle.css was built with Foundation 6.7.5. We use a pre-extracted
 * Foundation 6.7.5 reference file to ensure accurate comparison.
 */

const fs = require('fs');
const path = require('path');

// File paths
const FOUNDATION_675_REF = path.join(__dirname, 'foundation-675-reference.css');
const TABS_CSS = path.join(__dirname, '../../../contrib/seven/css/components/tabs.css');
const SLICK_CSS = path.join(__dirname, '../../../../libraries/slick-carousel/slick/slick.css');
const OUTPUT_FILE = path.join(__dirname, '.reference-libs.css');

console.log('Building reference libraries CSS...\n');

// Check all source files exist
const sources = [
  { name: 'Foundation 6.7.5 Reference', path: FOUNDATION_675_REF },
  { name: 'Drupal Seven Tabs CSS', path: TABS_CSS },
  { name: 'Slick Carousel CSS', path: SLICK_CSS }
];

const missing = sources.filter(src => !fs.existsSync(src.path));
if (missing.length > 0) {
  console.error('ERROR: Missing required CSS files:');
  missing.forEach(src => console.error(`  - ${src.name}: ${src.path}`));
  process.exit(1);
}

// Read and concatenate CSS files
let combinedCSS = '';

sources.forEach(src => {
  console.log(`Reading ${src.name}...`);
  const content = fs.readFileSync(src.path, 'utf8');
  combinedCSS += `\n/* ========================================\n`;
  combinedCSS += `   ${src.name}\n`;
  combinedCSS += `   ======================================== */\n\n`;
  combinedCSS += content;
  combinedCSS += '\n\n';
});

// Write output
console.log(`\nWriting combined reference to ${OUTPUT_FILE}...`);
fs.writeFileSync(OUTPUT_FILE, combinedCSS, 'utf8');

const stats = fs.statSync(OUTPUT_FILE);
console.log(`✓ Reference libraries built successfully (${(stats.size / 1024).toFixed(2)} KB)\n`);
