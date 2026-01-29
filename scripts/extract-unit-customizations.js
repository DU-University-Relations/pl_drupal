#!/usr/bin/env node

/**
 * Extract Unit Theme Customizations
 *
 * Compares pl_unit sparkle.css with pl_drupal sparkle.css and Foundation 6.7.5
 * and extracts only the rules unique to the unit theme.
 * Outputs to sparkle-unit.css
 */

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

// File paths
const DRUPAL_SPARKLE = path.join(__dirname, '../../pl_drupal/dest/sparkle.css');
const UNIT_SPARKLE = path.join(__dirname, '../../pl_unit/dest/sparkle.css');
const REFERENCE_CSS = path.join(__dirname, '.reference-libs.css');
const OUTPUT_FILE = path.join(__dirname, '../../pl_unit/dest/sparkle-unit.css');

console.log('Extracting unit theme customizations...\n');

// Check required files exist
const required = [
  { name: 'pl_drupal sparkle.css', path: DRUPAL_SPARKLE },
  { name: 'pl_unit sparkle.css', path: UNIT_SPARKLE },
  { name: 'Reference Libraries CSS', path: REFERENCE_CSS }
];

const missing = required.filter(file => !fs.existsSync(file.path));
if (missing.length > 0) {
  console.error('ERROR: Missing required files:');
  missing.forEach(file => console.error(`  - ${file.name}: ${file.path}`));
  process.exit(1);
}

/**
 * Create a unique key for a CSS rule (selector + declarations)
 */
function getRuleKey(rule) {
  const selector = rule.selector ? rule.selector.trim() : '';
  const declarations = [];

  rule.walkDecls(decl => {
    // Normalize declaration value for comparison
    const value = decl.value.replace(/\s+/g, ' ').trim();
    declarations.push(`${decl.prop}:${value}`);
  });

  return `${selector}|${declarations.sort().join('|')}`;
}

/**
 * Build a Set of rule keys from multiple sources for exact matching
 */
async function buildExclusionSet(drupalContent, librariesContent) {
  const exclusionSet = new Set();

  // Add pl_drupal rules
  const drupalRoot = postcss.parse(drupalContent, { from: DRUPAL_SPARKLE });
  drupalRoot.walkRules(rule => {
    const key = getRuleKey(rule);
    exclusionSet.add(key);
  });

  // Add library rules (Foundation 6.7.5 + Drupal tabs + Slick)
  const librariesRoot = postcss.parse(librariesContent, { from: REFERENCE_CSS });
  librariesRoot.walkRules(rule => {
    const key = getRuleKey(rule);
    exclusionSet.add(key);
  });

  console.log(`Built exclusion set with ${exclusionSet.size} unique rules (pl_drupal + libraries)\n`);
  return exclusionSet;
}

/**
 * Main extraction process
 */
async function extract() {
  // Read files
  console.log('Reading input files...');
  const drupalContent = fs.readFileSync(DRUPAL_SPARKLE, 'utf8');
  const unitContent = fs.readFileSync(UNIT_SPARKLE, 'utf8');
  const librariesContent = fs.readFileSync(REFERENCE_CSS, 'utf8');

  // Build exclusion set
  console.log('Building exclusion rule set...');
  const exclusionSet = await buildExclusionSet(drupalContent, librariesContent);

  // Parse unit theme CSS
  console.log('Parsing unit theme (pl_unit) CSS...');
  const unitRoot = postcss.parse(unitContent, { from: UNIT_SPARKLE });

  // Filter out base theme and Foundation rules, keep only unit-specific rules
  console.log('Filtering library and base theme rules...');
  let removedCount = 0;
  let keptCount = 0;

  unitRoot.walkRules(rule => {
    const key = getRuleKey(rule);
    if (exclusionSet.has(key)) {
      rule.remove();
      removedCount++;
    } else {
      keptCount++;
    }
  });

  console.log(`Removed ${removedCount} library/base theme rules, kept ${keptCount} unit-specific rules\n`);

  // Remove empty media queries and at-rules
  console.log('Cleaning up empty media queries...');
  let emptyMediaCount = 0;
  
  // Keep removing empty at-rules until none are left (nested empty at-rules)
  let hasEmpty = true;
  while (hasEmpty) {
    hasEmpty = false;
    unitRoot.walkAtRules(atRule => {
      // Check if the at-rule has any children
      if (!atRule.nodes || atRule.nodes.length === 0) {
        atRule.remove();
        emptyMediaCount++;
        hasEmpty = true;
      }
    });
  }

  console.log(`Removed ${emptyMediaCount} empty media queries\n`);

  // Convert to string
  let unitCSS = unitRoot.toString();

  // Clean up comments and excessive whitespace
  console.log('Removing all CSS comments and cleaning whitespace...');
  
  // Remove all CSS comments (both single-line and multi-line)
  unitCSS = unitCSS.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Remove empty media queries that became empty after comment removal
  // Matches @media...{ } with only whitespace inside
  unitCSS = unitCSS.replace(/@media[^{]*\{\s*\}/g, '');
  unitCSS = unitCSS.replace(/@[a-zA-Z-]+[^{]*\{\s*\}/g, '');
  
  // Clean up any remaining lines that only have whitespace
  unitCSS = unitCSS.replace(/^\s*$/gm, '');
  
  // Reduce multiple consecutive blank lines to maximum of 2
  unitCSS = unitCSS.replace(/\n\s*\n\s*\n+/g, '\n\n');
  
  console.log('Cleanup complete\n');

  // Add header comment
  const header = `/**
 * Unit Theme Customizations
 * Extracted from pl_unit sparkle.css
 * Auto-generated on ${new Date().toISOString().split('T')[0]}
 *
 * This file contains only unit theme-specific styles.
 * All pl_drupal base theme, Foundation 6.7.5, Drupal tabs, and Slick carousel styles have been removed.
 */

`;

  const output = header + unitCSS;

  // Write output
  console.log(`Writing to ${OUTPUT_FILE}...`);
  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');

  const stats = fs.statSync(OUTPUT_FILE);
  const lines = output.split('\n').length;
  console.log(`✓ Extraction complete!`);
  console.log(`  File: ${OUTPUT_FILE}`);
  console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`  Lines: ${lines.toLocaleString()}\n`);
}

// Run extraction
extract().catch(err => {
  console.error('ERROR:', err.message);
  console.error(err.stack);
  process.exit(1);
});
