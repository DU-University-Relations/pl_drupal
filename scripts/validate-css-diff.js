#!/usr/bin/env node

/**
 * Validate CSS Differences
 *
 * Compares style.css.backup with style.css after extraction and variable replacement.
 * Ensures no visual changes occurred (only acceptable difference is hex color format).
 * Generates detailed report and exits with error if critical differences found.
 */

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

// File paths
const BACKUP_FILE = path.join(__dirname, '../dest/style.css.backup');
const CURRENT_FILE = path.join(__dirname, '../dest/style.css');
const REPORT_FILE = path.join(__dirname, 'extraction-diff-report.txt');

console.log('Validating CSS differences...\n');

// Check files exist
if (!fs.existsSync(BACKUP_FILE)) {
  console.error(`ERROR: Backup file not found: ${BACKUP_FILE}`);
  console.error('Run the extraction process to create a backup first.');
  process.exit(1);
}

if (!fs.existsSync(CURRENT_FILE)) {
  console.error(`ERROR: Current file not found: ${CURRENT_FILE}`);
  process.exit(1);
}

/**
 * Normalize hex colors to lowercase 6-digit format
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
 * Normalize CSS content for comparison
 * - Standardize hex colors to lowercase 6-digit format
 * - Preserve all other whitespace and formatting
 */
function normalizeCSS(css) {
  // Replace all hex colors with normalized versions
  return css.replace(/#[0-9a-fA-F]{3,8}/g, (match) => normalizeHex(match));
}

/**
 * Parse CSS and extract structured rule data for detailed comparison
 */
async function parseCSS(cssContent, filename) {
  const root = postcss.parse(cssContent, { from: filename });
  const rules = [];

  root.walkRules(rule => {
    const declarations = [];
    rule.walkDecls(decl => {
      declarations.push({
        prop: decl.prop,
        value: decl.value.replace(/\s+/g, ' ').trim()
      });
    });

    rules.push({
      selector: rule.selector.trim(),
      declarations: declarations
    });
  });

  return rules;
}

/**
 * Visual properties that affect rendering
 */
const VISUAL_PROPERTIES = new Set([
  'color', 'background', 'background-color', 'background-image', 'background-position',
  'background-size', 'background-repeat', 'border', 'border-color', 'border-width',
  'border-style', 'border-radius', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'font', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
  'text-align', 'text-decoration', 'text-transform', 'letter-spacing', 'word-spacing',
  'display', 'visibility', 'opacity', 'position', 'top', 'right', 'bottom', 'left',
  'float', 'clear', 'z-index', 'overflow', 'overflow-x', 'overflow-y',
  'flex', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-content',
  'grid', 'grid-template', 'grid-gap', 'gap',
  'transform', 'transition', 'animation',
  'box-shadow', 'text-shadow', 'outline', 'cursor'
]);

/**
 * Check if a property affects visual rendering
 */
function isVisualProperty(prop) {
  return VISUAL_PROPERTIES.has(prop) || prop.startsWith('--'); // Include CSS custom properties
}

/**
 * Compare two CSS files and generate detailed report
 */
async function compareCSS(backupContent, currentContent) {
  // Normalize both for exact comparison
  const normalizedBackup = normalizeCSS(backupContent);
  const normalizedCurrent = normalizeCSS(currentContent);

  // Quick check: if identical after normalization, we're done
  if (normalizedBackup === normalizedCurrent) {
    return {
      identical: true,
      differences: [],
      criticalDifferences: []
    };
  }

  // Parse both files for detailed comparison
  console.log('Parsing CSS files for detailed comparison...');
  const backupRules = await parseCSS(normalizedBackup, BACKUP_FILE);
  const currentRules = await parseCSS(normalizedCurrent, CURRENT_FILE);

  console.log(`Backup: ${backupRules.length} rules`);
  console.log(`Current: ${currentRules.length} rules\n`);

  // Build maps for comparison
  const backupMap = new Map();
  backupRules.forEach((rule, index) => {
    const key = rule.selector;
    if (!backupMap.has(key)) {
      backupMap.set(key, []);
    }
    backupMap.get(key).push({ rule, index });
  });

  const currentMap = new Map();
  currentRules.forEach((rule, index) => {
    const key = rule.selector;
    if (!currentMap.has(key)) {
      currentMap.set(key, []);
    }
    currentMap.get(key).push({ rule, index });
  });

  const differences = [];
  const criticalDifferences = [];

  // Check for removed selectors
  for (const [selector, items] of backupMap) {
    if (!currentMap.has(selector)) {
      const diff = {
        type: 'REMOVED_SELECTOR',
        selector: selector,
        ruleCount: items.length,
        critical: true
      };
      differences.push(diff);
      criticalDifferences.push(diff);
    }
  }

  // Check for added selectors
  for (const [selector, items] of currentMap) {
    if (!backupMap.has(selector)) {
      const diff = {
        type: 'ADDED_SELECTOR',
        selector: selector,
        ruleCount: items.length,
        critical: true
      };
      differences.push(diff);
      criticalDifferences.push(diff);
    }
  }

  // Check for changed declarations in matching selectors
  for (const [selector, backupItems] of backupMap) {
    if (currentMap.has(selector)) {
      const currentItems = currentMap.get(selector);

      // Compare declarations
      backupItems.forEach((backupItem, idx) => {
        if (idx < currentItems.length) {
          const currentItem = currentItems[idx];
          const backupDecls = new Map(backupItem.rule.declarations.map(d => [d.prop, d.value]));
          const currentDecls = new Map(currentItem.rule.declarations.map(d => [d.prop, d.value]));

          // Check for changed/removed properties
          for (const [prop, backupValue] of backupDecls) {
            if (!currentDecls.has(prop)) {
              const diff = {
                type: 'REMOVED_PROPERTY',
                selector: selector,
                property: prop,
                oldValue: backupValue,
                critical: isVisualProperty(prop)
              };
              differences.push(diff);
              if (diff.critical) {
                criticalDifferences.push(diff);
              }
            } else if (currentDecls.get(prop) !== backupValue) {
              const diff = {
                type: 'CHANGED_VALUE',
                selector: selector,
                property: prop,
                oldValue: backupValue,
                newValue: currentDecls.get(prop),
                critical: isVisualProperty(prop)
              };
              differences.push(diff);
              if (diff.critical) {
                criticalDifferences.push(diff);
              }
            }
          }

          // Check for added properties
          for (const [prop, currentValue] of currentDecls) {
            if (!backupDecls.has(prop)) {
              const diff = {
                type: 'ADDED_PROPERTY',
                selector: selector,
                property: prop,
                newValue: currentValue,
                critical: isVisualProperty(prop)
              };
              differences.push(diff);
              if (diff.critical) {
                criticalDifferences.push(diff);
              }
            }
          }
        }
      });
    }
  }

  return {
    identical: false,
    differences: differences,
    criticalDifferences: criticalDifferences,
    backupRules: backupRules.length,
    currentRules: currentRules.length
  };
}

/**
 * Generate human-readable report
 */
function generateReport(result, backupSize, currentSize) {
  const lines = [];

  lines.push('='.repeat(80));
  lines.push('CSS VALIDATION REPORT');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('='.repeat(80));
  lines.push('');

  lines.push('FILE INFORMATION:');
  lines.push(`  Backup:  ${BACKUP_FILE} (${(backupSize / 1024).toFixed(2)} KB)`);
  lines.push(`  Current: ${CURRENT_FILE} (${(currentSize / 1024).toFixed(2)} KB)`);
  lines.push('');

  if (result.identical) {
    lines.push('✓ VALIDATION PASSED');
    lines.push('');
    lines.push('The CSS files are identical after hex color normalization.');
    lines.push('No visual changes detected.');
  } else {
    lines.push(`RULE COUNT:`);
    lines.push(`  Backup:  ${result.backupRules.toLocaleString()} rules`);
    lines.push(`  Current: ${result.currentRules.toLocaleString()} rules`);
    lines.push('');

    if (result.criticalDifferences.length === 0) {
      lines.push('✓ NO CRITICAL DIFFERENCES');
      lines.push('');
      lines.push(`Found ${result.differences.length} non-critical differences (formatting/order only).`);
    } else {
      lines.push('✗ CRITICAL DIFFERENCES FOUND');
      lines.push('');
      lines.push(`Total differences: ${result.differences.length}`);
      lines.push(`Critical differences: ${result.criticalDifferences.length}`);
      lines.push('');
      lines.push('-'.repeat(80));
      lines.push('CRITICAL DIFFERENCES (affect visual rendering):');
      lines.push('-'.repeat(80));
      lines.push('');

      // Group by type
      const byType = new Map();
      result.criticalDifferences.forEach(diff => {
        if (!byType.has(diff.type)) {
          byType.set(diff.type, []);
        }
        byType.get(diff.type).push(diff);
      });

      for (const [type, diffs] of byType) {
        lines.push(`${type}: ${diffs.length} occurrences`);
        lines.push('');

        // Show first 20 of each type
        diffs.slice(0, 20).forEach(diff => {
          lines.push(`  Selector: ${diff.selector}`);
          if (diff.property) {
            lines.push(`  Property: ${diff.property}`);
          }
          if (diff.oldValue) {
            lines.push(`  Old: ${diff.oldValue}`);
          }
          if (diff.newValue) {
            lines.push(`  New: ${diff.newValue}`);
          }
          lines.push('');
        });

        if (diffs.length > 20) {
          lines.push(`  ... and ${diffs.length - 20} more\n`);
        }
      }
    }
  }

  lines.push('='.repeat(80));

  return lines.join('\n');
}

/**
 * Main validation process
 */
async function validate() {
  // Read files
  console.log('Reading CSS files...');
  const backupContent = fs.readFileSync(BACKUP_FILE, 'utf8');
  const currentContent = fs.readFileSync(CURRENT_FILE, 'utf8');

  const backupSize = fs.statSync(BACKUP_FILE).size;
  const currentSize = fs.statSync(CURRENT_FILE).size;

  // Compare
  console.log('Comparing CSS...\n');
  const result = await compareCSS(backupContent, currentContent);

  // Generate report
  const report = generateReport(result, backupSize, currentSize);

  // Write report
  fs.writeFileSync(REPORT_FILE, report, 'utf8');
  console.log(`Report saved to: ${REPORT_FILE}\n`);

  // Display summary
  console.log('='.repeat(80));
  if (result.identical) {
    console.log('✓ VALIDATION PASSED - Files are identical');
    console.log('='.repeat(80));
    process.exit(0);
  } else if (result.criticalDifferences.length === 0) {
    console.log('✓ VALIDATION PASSED - No critical differences');
    console.log(`  (${result.differences.length} non-critical differences found)`);
    console.log('='.repeat(80));
    process.exit(0);
  } else {
    console.log('✗ VALIDATION FAILED - Critical differences detected');
    console.log(`  Total differences: ${result.differences.length}`);
    console.log(`  Critical differences: ${result.criticalDifferences.length}`);
    console.log('');
    console.log('These differences may affect visual rendering.');
    console.log(`See ${REPORT_FILE} for details.`);
    console.log('='.repeat(80));
    process.exit(1);
  }
}

// Run validation
validate().catch(err => {
  console.error('ERROR:', err.message);
  console.error(err.stack);
  process.exit(1);
});
