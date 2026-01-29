#!/usr/bin/env node

/**
 * Extract DU Customizations from Sparkle CSS
 *
 * Parses sparkle.css, removes Foundation/Drupal/Slick library styles,
 * replaces hardcoded colors and fonts with SCSS variables,
 * outputs to _du-customizations-only.scss
 */

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const postcssScss = require('postcss-scss');

// File paths
const SPARKLE_CSS = path.join(__dirname, '../dest/sparkle.css');
const REFERENCE_CSS = path.join(__dirname, '.reference-libs.css');
const VARIABLES_SCSS = path.join(__dirname, '../scss/_variables.scss');
const OUTPUT_FILE = path.join(__dirname, '../scss/_du-customizations-only.scss');
const REMOVED_RULES_FILE = path.join(__dirname, '.removed-library-rules.css');

console.log('Extracting DU customizations from sparkle.css...\n');

// Check required files exist
const required = [
  { name: 'Sparkle CSS', path: SPARKLE_CSS },
  { name: 'Reference Libraries CSS', path: REFERENCE_CSS },
  { name: 'Variables SCSS', path: VARIABLES_SCSS }
];

const missing = required.filter(file => !fs.existsSync(file.path));
if (missing.length > 0) {
  console.error('ERROR: Missing required files:');
  missing.forEach(file => console.error(`  - ${file.name}: ${file.path}`));
  console.error('\nRun: npm run build to generate reference files first.');
  process.exit(1);
}

/**
 * Parse SCSS variables file to extract color and font mappings
 */
function parseVariables(variablesContent) {
  const colorMap = new Map();
  const fontMap = new Map();

  // Match SCSS variable definitions: $var-name: value;
  const varPattern = /\$([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let match;

  while ((match = varPattern.exec(variablesContent)) !== null) {
    const varName = match[1];
    const value = match[2].trim();

    // Check if it's a color (hex format)
    if (value.match(/^#[0-9a-fA-F]{3,8}$/)) {
      const normalizedHex = normalizeHex(value);
      colorMap.set(normalizedHex, `$${varName}`);

      // Also add RGB equivalent for matching
      const rgb = hexToRgb(normalizedHex);
      if (rgb) {
        colorMap.set(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, `$${varName}`);
        colorMap.set(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`, `$${varName}`);
      }
    }
    // Check if it's a font family
    else if (value.includes('sans-serif') || value.includes('serif') || value.match(/["'][^"']+["']/)) {
      fontMap.set(value.replace(/["']/g, ''), `$${varName}`);
      fontMap.set(value, `$${varName}`);
    }
  }

  console.log(`Loaded ${colorMap.size} color mappings and ${fontMap.size} font mappings\n`);
  return { colorMap, fontMap };
}

/**
 * Normalize hex color to lowercase 6-digit format
 */
function normalizeHex(hex) {
  hex = hex.toLowerCase();
  // Expand 3-digit to 6-digit
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex;
}

/**
 * Convert hex to RGB object
 */
function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  const result = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
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
 * Build a Set of rule keys from reference libraries for exact matching
 */
async function buildReferenceSet(referenceContent) {
  const referenceSet = new Set();

  const root = postcss.parse(referenceContent, { from: REFERENCE_CSS });

  root.walkRules(rule => {
    const key = getRuleKey(rule);
    referenceSet.add(key);
  });

  console.log(`Built reference set with ${referenceSet.size} unique rules\n`);
  return referenceSet;
}

/**
 * Replace colors and fonts with SCSS variables
 */
function replaceWithVariables(css, colorMap, fontMap) {
  let replacements = 0;

  const root = postcss.parse(css, { from: OUTPUT_FILE });

  root.walkDecls(decl => {
    let value = decl.value;
    let modified = false;

    // Replace hex colors
    value = value.replace(/#[0-9a-fA-F]{3,8}/gi, (match) => {
      const normalized = normalizeHex(match);
      if (colorMap.has(normalized)) {
        replacements++;
        modified = true;
        return colorMap.get(normalized);
      }
      return match;
    });

    // Replace RGB/RGBA colors
    value = value.replace(/rgba?\([^)]+\)/gi, (match) => {
      const normalized = match.replace(/\s+/g, ' ').trim();
      if (colorMap.has(normalized)) {
        replacements++;
        modified = true;
        return colorMap.get(normalized);
      }
      return match;
    });

    // Replace font families
    if (decl.prop === 'font-family' || decl.prop === 'font') {
      for (const [font, variable] of fontMap) {
        if (value.includes(font)) {
          value = value.replace(new RegExp(font.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), variable);
          replacements++;
          modified = true;
        }
      }
      // Remove quotes around SCSS variables (e.g., "$icon-font" -> $icon-font)
      value = value.replace(/["'](\$[a-zA-Z0-9_-]+)["']/g, '$1');
    }

    if (modified) {
      decl.value = value;
    }
  });

  console.log(`Replaced ${replacements} color/font values with variables\n`);
  return root.toString();
}

/**
 * Main extraction process
 */
async function extract() {
  // Read files
  console.log('Reading input files...');
  const sparkleContent = fs.readFileSync(SPARKLE_CSS, 'utf8');
  const referenceContent = fs.readFileSync(REFERENCE_CSS, 'utf8');
  const variablesContent = fs.readFileSync(VARIABLES_SCSS, 'utf8');

  // Parse variables
  console.log('Parsing SCSS variables...');
  const { colorMap, fontMap } = parseVariables(variablesContent);

  // Build reference set
  console.log('Building reference library set...');
  const referenceSet = await buildReferenceSet(referenceContent);

  // Parse sparkle.css
  console.log('Parsing sparkle.css...');
  const sparkleRoot = postcss.parse(sparkleContent, { from: SPARKLE_CSS });

  // Filter out library rules
  console.log('Filtering library rules...');
  let removedCount = 0;
  let keptCount = 0;
  const removedRules = [];

  sparkleRoot.walkRules(rule => {
    const key = getRuleKey(rule);
    if (referenceSet.has(key)) {
      // Save the rule before removing it
      removedRules.push(rule.toString());
      rule.remove();
      removedCount++;
    } else {
      keptCount++;
    }
  });

  console.log(`Removed ${removedCount} library rules, kept ${keptCount} custom rules\n`);

  // Save removed rules for review
  if (removedRules.length > 0) {
    const removedHeader = `/**
 * Library Rules Removed During Extraction
 * Generated on ${new Date().toISOString().split('T')[0]}
 *
 * These ${removedCount} rules matched Foundation 6.7.5, Drupal tabs, or Slick carousel
 * and were filtered out as library code.
 *
 * Review this file to ensure no DU-specific customizations were accidentally removed.
 */\n\n`;
    const removedContent = removedHeader + removedRules.join('\n\n');
    fs.writeFileSync(REMOVED_RULES_FILE, removedContent, 'utf8');
    const removedStats = fs.statSync(REMOVED_RULES_FILE);
    console.log(`Saved removed rules to ${REMOVED_RULES_FILE} (${(removedStats.size / 1024).toFixed(2)} KB)\n`);
  }

  // Convert to string
  let customCSS = sparkleRoot.toString();

  // Replace with variables
  console.log('Replacing colors and fonts with SCSS variables...');
  customCSS = replaceWithVariables(customCSS, colorMap, fontMap);

  // Clean up empty structures
  console.log('Removing empty media queries and at-rules...');
  customCSS = customCSS
    .replace(/@media[^{]*\{\s*\}/g, '') // Empty media queries
    .replace(/@[a-zA-Z-]+[^{]*\{\s*\}/g, '') // Empty at-rules
    .replace(/^\s*$/gm, '') // Whitespace-only lines
    .replace(/\n\s*\n\s*\n+/g, '\n\n'); // Reduce multiple blank lines

  // Add header comment
  const header = `/**
 * DU Alumni Customizations
 * Extracted from sparkle.css (Foundation 6.7.5 based)
 * Auto-generated on ${new Date().toISOString().split('T')[0]}
 *
 * This file contains only DU-specific styles.
 * Foundation, Drupal tabs, and Slick carousel styles have been removed.
 * Colors and fonts have been replaced with SCSS variables where defined.
 */

`;

  const output = header + customCSS;

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
