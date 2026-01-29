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
 * Normalize CSS selector for consistent comparison
 */
function normalizeSelector(selector) {
  return selector
    .trim()
    // Normalize whitespace around combinators
    .replace(/\s*([>+~])\s*/g, '$1')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    // Lowercase for case-insensitive comparison
    .toLowerCase();
}

/**
 * Normalize CSS value for consistent comparison
 */
function normalizeValue(value) {
  return value
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
    // Normalize 3-digit hex to 6-digit (#fff → #ffffff)
    .replace(/#([0-9a-fA-F]{3})\b/g, (match, hex) => {
      return '#' + hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    })
    // Lowercase all hex colors
    .replace(/#[0-9a-fA-F]{6}/gi, (match) => match.toLowerCase())
    // Normalize zero values (0px, 0em, 0rem → 0)
    .replace(/\b0(px|em|rem|%|vh|vw|pt|cm|mm|in)\b/g, '0')
    // Normalize calc() spacing
    .replace(/calc\(\s*/g, 'calc(')
    .replace(/\s*\)/g, ')')
    // Normalize rgba/rgb spacing
    .replace(/rgba?\(\s*/g, (match) => match.replace(/\s+/g, ''))
    .replace(/,\s*/g, ',');
}

/**
 * Create a unique key for a CSS rule (selector + declarations)
 * Uses normalization to catch rules with formatting variations
 */
function getRuleKey(rule) {
  const selector = normalizeSelector(rule.selector || '');
  const declarations = [];

  rule.walkDecls(decl => {
    const value = normalizeValue(decl.value);
    declarations.push(`${decl.prop}:${value}`);
  });

  return `${selector}|${declarations.sort().join('|')}`;
}

/**
 * Build a Set of rule keys from reference libraries for exact matching
 */
async function buildReferenceSet(referenceContent) {
  const referenceSet = new Set();

  // Strip important comments that Sass preserves (/*! ... */)
  const cleaned = referenceContent.replace(/\/\*![\s\S]*?\*\//g, '');

  const root = postcss.parse(cleaned, { from: REFERENCE_CSS });

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
  // Strip important comments that Sass preserves (/*! ... */)
  const cleanedSparkle = sparkleContent.replace(/\/\*![\s\S]*?\*\//g, '');
  const sparkleRoot = postcss.parse(cleanedSparkle, { from: SPARKLE_CSS });

  // Filter out library rules
  console.log('Filtering library rules...');
  let removedCount = 0;
  let keptCount = 0;
  let patternRemovedCount = 0;
  const removedRules = [];

  // Known Foundation patterns to remove (catches rules with different settings)
  const foundationPatterns = [
    // Foundation grid system
    /^\.grid-container\b/,
    /^\.grid-x\b/,
    /^\.grid-y\b/,
    /^\.grid-margin-x\b/,
    /^\.grid-margin-y\b/,
    /^\.grid-padding-x\b/,
    /^\.grid-padding-y\b/,
    /^\.grid-frame\b/,
    /^\.cell\b/,
    /^\.small-\d+\b/,
    /^\.medium-\d+\b/,
    /^\.large-\d+\b/,
    /^\.xlarge-\d+\b/,
    /^\.xxlarge-\d+\b/,
    /^\.xxxlarge-\d+\b/,
    // normalize.css browser fixes (Firefox <4, Safari/Chrome <2011)
    /^\[type=["']?(button|reset|submit|checkbox|radio|number|search|file)["']?\]/,
    /::-moz-focus-inner/,
    /::-moz-focusring/,
    /::-webkit-(inner-spin-button|outer-spin-button|search-decoration)/,
    /^\[data-what(input|intent)=/,
    /^div,\s*dl,\s*dt,\s*dd,/,
    // Foundation components (base library code)
    /^\.tooltip\.(bottom|top|left|right)::before/,
    /^\.switch-(paddle|active|inactive)/,
    /^\.drilldown/,
    /^\.is-drilldown-submenu/,
    /^\.js-drilldown-back/,
    /^\.clearfix::(before|after)/,
    /^\.tabs::(before|after)/,
  ];

  function isFoundationPattern(selector) {
    if (!selector) return false;
    
    // Split by comma and check each part
    const selectors = selector.split(',').map(s => s.trim());
    return selectors.every(sel => {
      // Check if the selector matches any pattern directly
      if (foundationPatterns.some(pattern => pattern.test(sel))) {
        return true;
      }
      
      // For class-based patterns, extract the base class
      const baseClass = sel.match(/\.([\w-]+)/);
      if (baseClass) {
        const className = '.' + baseClass[1];
        return foundationPatterns.some(pattern => pattern.test(className));
      }
      
      return false;
    });
  }

  sparkleRoot.walkRules(rule => {
    const key = getRuleKey(rule);
    let shouldRemove = false;
    let reason = '';

    // Check exact match first
    if (referenceSet.has(key)) {
      shouldRemove = true;
      reason = 'exact';
    }
    // Check Foundation pattern match
    else if (isFoundationPattern(rule.selector)) {
      shouldRemove = true;
      reason = 'pattern';
      patternRemovedCount++;
    }

    if (shouldRemove) {
      removedRules.push(rule.toString());
      rule.remove();
      removedCount++;
    } else {
      keptCount++;
    }
  });

  console.log(`Removed ${removedCount} library rules (${removedCount - patternRemovedCount} exact, ${patternRemovedCount} pattern), kept ${keptCount} custom rules\n`);

  // Save removed rules for review
  if (removedRules.length > 0) {
    const removedHeader = `/**
 * Library Rules Removed During Extraction
 * Generated on ${new Date().toISOString().split('T')[0]}
 *
 * These ${removedCount} rules matched Foundation, Drupal tabs, or Slick carousel
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

  // Clean up empty structures and Foundation comments
  console.log('Removing empty media queries and at-rules...');
  customCSS = customCSS
    .replace(/@media[^{]*\{\s*\}/g, '') // Empty media queries
    .replace(/@[a-zA-Z-]+[^{]*\{\s*\}/g, '') // Empty at-rules
    // Remove Foundation version comment blocks
    .replace(/\/\*\*[\s\S]*?Foundation for Sites[\s\S]*?Version[\s\S]*?Licensed[\s\S]*?\*\//g, '')
    .replace(/^\s*$/gm, '') // Whitespace-only lines
    .replace(/\n\s*\n\s*\n+/g, '\n\n'); // Reduce multiple blank lines

  // Add header comment
  const header = `/**
 * DU Alumni Customizations
 * Extracted from sparkle.css
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
