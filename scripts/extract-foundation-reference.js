#!/usr/bin/env node

/**
 * Extract Foundation 6.7.5 Reference from Sparkle.css
 *
 * One-time script to extract pure Foundation 6.7.5 CSS from sparkle.css
 * and save it as a static reference file for extraction comparisons.
 *
 * Run this once to create: scripts/foundation-675-reference.css
 */

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const SPARKLE_CSS = path.join(__dirname, '../dest/sparkle.css');
const OUTPUT_FILE = path.join(__dirname, 'foundation-675-reference.css');

console.log('Extracting Foundation 6.7.5 reference from sparkle.css...\n');

if (!fs.existsSync(SPARKLE_CSS)) {
  console.error(`ERROR: Sparkle CSS not found: ${SPARKLE_CSS}`);
  process.exit(1);
}

// Read sparkle.css
const sparkleContent = fs.readFileSync(SPARKLE_CSS, 'utf8');

// Parse with PostCSS
const root = postcss.parse(sparkleContent, { from: SPARKLE_CSS });

// Extract Foundation rules by removing DU-specific selectors
// Foundation rules are identifiable by NOT containing DU-specific patterns
const duPatterns = [
  /\.du-/,
  /\.paragraph--type--/,
  /\.alumni/,
  /\.poverty-homelessness/,
  /\.clinics/,
  /\.unit-/,
  /\.site-name/,
  /\.site-prefix/,
  /\.header/,
  /#block-/,
  /#main-menu/,
  /\.sub-menu/,
  /\.mega-nav/,
  /\.hero-/
];

const foundationRoot = postcss.root();
let foundationRuleCount = 0;
let duRuleCount = 0;

root.walkRules(rule => {
  // Check if selector contains any DU-specific patterns
  const isDURule = duPatterns.some(pattern => pattern.test(rule.selector));

  if (!isDURule) {
    // This appears to be a Foundation rule
    foundationRoot.append(rule.clone());
    foundationRuleCount++;
  } else {
    duRuleCount++;
  }
});

// Also copy media queries and other at-rules that don't have DU patterns
root.walkAtRules(atRule => {
  // Check if at-rule contains DU patterns in params or has DU rules inside
  const hasDUPattern = duPatterns.some(pattern =>
    pattern.test(atRule.params) ||
    (atRule.toString().match(/\.du-|\.paragraph--type--|\.alumni/))
  );

  if (!hasDUPattern) {
    foundationRoot.append(atRule.clone());
  }
});

// Write output
const outputCSS = foundationRoot.toString();

const header = `/**
 * Foundation for Sites 6.7.5 Reference
 * Extracted from sparkle.css on ${new Date().toISOString().split('T')[0]}
 *
 * This is a static reference file used for extraction comparisons.
 * It contains Foundation 6.7.5 CSS with DU-specific customizations removed.
 */

`;

fs.writeFileSync(OUTPUT_FILE, header + outputCSS, 'utf8');

const stats = fs.statSync(OUTPUT_FILE);
console.log(`✓ Foundation 6.7.5 reference extracted successfully`);
console.log(`  Foundation rules: ${foundationRuleCount}`);
console.log(`  DU rules skipped: ${duRuleCount}`);
console.log(`  Output: ${OUTPUT_FILE}`);
console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB\n`);
console.log('NOTE: This is a one-time extraction. The reference file is now saved for future use.');
