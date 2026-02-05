# Drupal 10 Upgrade Migration

This document tracks the migration of the pl_drupal theme from Drupal 9 to Drupal 10, completed in January 2026.

## Overview

The theme has been upgraded to Drupal 10 compatibility with Pattern Lab completely removed. The theme is now named **"PL Drupal D10 (Post-Pattern Lab Era)"** version 10.0.0.

## Migration Timeline

### Phase 1: Pattern Lab Removal & Drupal 10 Compatibility

#### Commit 1: Pattern Lab Removal
- Removed all Pattern Lab dependencies and infrastructure
  - Deleted: `composer.json`, `composer.lock`, `vendor/`, `core/`, `config/`, `source/`, `scripts/build.sh`
  - Cleaned `package.json` and `gulpfile.js` of Pattern Lab packages
  - Updated theme name and version in `pl_drupal.info.yml`
- **Preserved**: Components module namespaces in `pl_drupal.info.yml` (required for Drupal Components module)
- Files removed: 1000+ Pattern Lab-specific files

### Commit 2: Drupal 10 Compatibility
- Updated `core_version_requirement: ^10` in `pl_drupal.info.yml`
- Removed deprecated `core/jquery.once` library dependency
- Added `core/once` dependency for new Drupal.once() API
- Replaced deprecated `{% apply spaceless %}` with `|spaceless` filter in Twig templates:
  - `templates/page--landing-page.html.twig`
  - `templates/paragraph/paragraph--custom-markup.html.twig`
- Converted all `jQuery.once()` calls to `Drupal.once()` API in `js/app.js`:
  - Used jQuery pattern: `$(once('key', 'selector', context)).each(function() {...})`
  - Converted 6 instances across multiple Drupal behaviors

#### Commit 3: Front-end Build Stabilization
- Added `.nvmrc` for Node v24
- Upgraded to Foundation Sites 6.9.0 (from 6.7.5)
- Updated build tooling:
  - Gulp 5.0.1 (from 4.0.2)
  - gulp-sass 6.0.1 with Dart Sass 1.69.0
  - Added browser-sync 3.0.3 for development
- Fixed `gulpfile.js`:
  - Configured to use Dart Sass: `require('gulp-sass')(require('sass'))`
  - Split CSS compilation into two tasks: `sass-foundation` and `sass-custom`
  - Added `copy-libs` task to copy npm libraries to `dest/libraries/`
  - Added `copy-images` task to copy images to `dest/images/`
  - Removed all Pattern Lab configuration and tasks
  - Removed core.js dependency (was Pattern Lab related)
  - Added error handling and Sass deprecation silencing
- Updated `scss/style.scss`:
  - Changed slick-carousel import to use node_modules path
  - Commented out Drupal-specific paths that don't exist during build
- **Result**: Build completes successfully with 0 npm vulnerabilities

### Phase 2: Front-End Library Consolidation

#### Commit 4: npm Library Migration
Migrated all front-end libraries from Composer's npm-asset and CDN sources to theme's npm management:

**Added to package.json:**
- `clipboard`: ^2.0.11 (previously CDN 1.5.10)
- `isotope-layout`: ^3.0.6 (previously CDN 2.2.2)
- `jquery.scrollto`: ^2.1.3 (previously CDN 2.1.0)

**Already in package.json (version bumps):**
- `foundation-sites`: ^6.9.0 (was ^6.5 in Composer)
- `motion-ui`: ^2.0.3 (was ^2.0 in Composer)
- `slick-carousel`: ^1.8.1 (was ^1.8 in Composer)

**Created npm copy scripts:**
- Added `copy-libs` script to copy library files from node_modules to dest/libraries/
- Added `postinstall` hook to automatically run after npm install
- Individual scripts for each library (copy-foundation, copy-motion-ui, etc.)

**Updated pl_drupal.libraries.yml:**
- Changed all library paths from `/libraries/*` and CDN URLs to `dest/libraries/*`
- All libraries now served from theme (no external dependencies)

**Benefits:**
- Single source of truth for front-end dependencies
- No CDN dependencies (better for offline dev, caching)
- Automatic file management via postinstall
- Latest stable versions with security updates

### Phase 3: Sparkle.css Migration to Foundation 6.9.0

#### Commit 5: Production CSS Customizations
Extracted all DU customizations from production sparkle.css and migrated to Foundation 6.9.0:

**Created scss/_du-customizations-only.scss (21,954 lines):**
- Extracted all custom styles from sparkle.css (Foundation 6.7.5 base removed)
- Contains all DU-specific component styles, overrides, and customizations
- Preserves production manual edits and hotfixes

**Removed obsolete files:**
- 133 SCSS files from du-resources/ directories
- scss/du-custom/ (failed extraction attempt)
- scss/unit_site/, scss-extracted/, css-migration/
- Migration scripts: extract-phase*.js, verify-css-diff.js, etc.
- Old files: _sparkle-full.scss, _custom-hotfixes.scss, _color-corrections.scss

**Final SCSS structure:**
- scss/style.scss - Main entry (Foundation 6.9.0 + Seven tabs + DU customizations)
- scss/_variables.scss - DU brand colors & fonts
- scss/_settings.scss - Foundation 6.9.0 configuration
- scss/_du-customizations-only.scss - All sparkle.css customizations

**Key customizations preserved:**
- Arrow pattern backgrounds removed (12 component files)
- DU brand colors in Foundation palette (primary, warning, alert)
- Button hover behaviors matching production
- Custom CSS rules from sparkle.css
- Follow-us background color corrections

**Output:**
- dest/style.css: 41,196 lines (Foundation 6.9.0 + DU customizations)
- All production customizations preserved from sparkle.css
- Uses modern Foundation 6.9.0 with DU brand styling

## Breaking Changes

### Removed
- Pattern Lab entirely (no longer needed for component development)
- `core/jquery.once` library dependency
- Old Node Sass (replaced with Dart Sass)
- Deprecated Twig `{% apply spaceless %}` tag

### Changed
- Theme name: "PL Drupal" → "PL Drupal D10 (Post-Pattern Lab Era)"
- Version: 3.x → 10.0.0
- Core requirement: `^8 || ^9 || ^10` → `^10`
- jQuery.once API → Drupal.once API
- Foundation: 6.7.5 → 6.9.0
- Motion UI: 2.0.3 → 2.0.8
- Node: Any version → v24 (specified in `.nvmrc`)
- Library management: Composer npm-asset/CDN → npm with gulp copy tasks

### Preserved
- Component namespaces in `pl_drupal.info.yml` (required for Components module)
- All Twig templates in `templates/` directory
- All custom SCSS in `scss/` and `du-resources/`
- All JavaScript behaviors in `js/`

## Technical Details

### Drupal.once() Migration Pattern

Old jQuery.once pattern:
```javascript
$('.selector').once('unique-id').on('click', function() {
  // handler
});
```

New Drupal.once pattern:
```javascript
$(once('unique-id', '.selector', context)).each(function() {
  $(this).on('click', function() {
    // handler
  });
});
```

### Build Workflow

```bash
# Use the correct Node version
nvm use

# Install dependencies
npm install

# Development build with sourcemaps
npm run watch

# Production build
npm run build
```

### Foundation JavaScript

Foundation JS files are copied from node_modules to `dest/libraries/foundation-sites/` during the build process. The theme's `pl_drupal.libraries.yml` references:

```yaml
/themes/custom/pl_drupal/dest/libraries/foundation-sites/dist/js/foundation.min.js
```

All npm libraries (Foundation, Motion UI, Slick, Clipboard, Isotope, ScrollTo) are copied to `dest/libraries/` by the `copy-libs` gulp task.

## Components Module Namespaces

The theme depends on the Drupal Components module and defines these Twig namespaces:

```yaml
components:
  namespaces:
    templates: source/_patterns/04-templates
    organisms: source/_patterns/03-organisms
    atoms: source/_patterns/01-atoms
    molecules: source/_patterns/02-molecules
    pages:
      - source/_patterns/05-pages
      - source/_patterns/05-pages/01-content-page
```

**Note**: These paths reference `source/_patterns/` which are no longer Pattern Lab files but regular Twig template directories used by the Drupal Components module. Pattern Lab infrastructure (composer.json, core/, config/, build scripts) was removed, but the template organization structure was preserved.

## Dependencies

### npm (package.json)
- foundation-sites: ^6.9.0
- motion-ui: ^2.0.8
- slick-carousel: ^1.8.1
- clipboard: ^2.0.11
- isotope-layout: ^3.0.6
- jquery.scrollto: ^2.1.3
- gulp: ^5.0.1
- gulp-sass: ^6.0.1 (with Dart Sass)
- sass: ^1.69.0
- browser-sync: ^3.0.3

### Drupal (pl_drupal.info.yml)
- drupal:components
- drupal:twig_field_value
- drupal:twig_tweak

### Libraries (pl_drupal.libraries.yml)
- core/jquery
- core/drupal
- core/jquery.cookie
- core/once

## Testing Checklist

- [ ] Verify theme enables without errors
- [ ] Test jQuery.once conversions work correctly:
  - [ ] Button click handlers
  - [ ] Resource reset functionality
  - [ ] Site search input
  - [ ] No-result search input
  - [ ] Resource list auto-submit
- [ ] Verify Foundation JavaScript components work:
  - [ ] Accordion
  - [ ] Dropdown
  - [ ] Tabs
  - [ ] Reveal (modals)
  - [ ] Sticky navigation
- [ ] Check responsive layouts with Foundation grid
- [ ] Test Twig components render correctly
- [ ] Verify SCSS compiles without errors
- [ ] Check for console errors

## DU Brand Customizations

### Foundation Palette (_settings.scss)
Updated Foundation color variables to use DU brand colors:
- `primary: #D5D2C5` (light beige) - was #1779ba
- `warning: #A89968` (gold) - was #ffae00
- `alert: #BA0C2F` (crimson) - was #cc4b37

### Custom Variables (_variables.scss)
```scss
$primary-font: neue-haas-unica, sans-serif;
$accent-font: "BreveText", sans-serif;
$headline-font: "BreveSlabTitle", sans-serif;
$cta-font: "Acto", sans-serif;
```

DU Brand Colors:
- Crimson shades: #560d20, #760626, #98012e, #BA0C2F, etc.
- Gold shades: #765b3a, #876f4f, #b8a162, #A89968, etc.
- Neutral colors: Black to white scale

### Production Manual Edits Preserved
All manual CSS edits from production sparkle.css have been migrated:
- ✅ Arrow pattern backgrounds removed (12 component files)
- ✅ Button hover behaviors (filter: brightness(0.8), hardcoded teal #375060)
- ✅ Custom dropdown arrow colors (#D5D2C5, #A89968)
- ✅ Follow-us background (#BA0C2F instead of #8c2332)
- ✅ Semantic font/spacing fixes (slide-content, feature-video, news-category, elevate-course)

### Foundation 6.9.0 Format Differences
The compiled CSS shows format changes from 6.7.5 to 6.9.0 (functionally identical):
- Bracket style changes
- Hex colors converted to RGB (mathematically equal)
- Selector alphabetization
- Attribute quote normalization

## Known Issues / Technical Debt

1. **Component namespace paths**: Still reference `source/_patterns/` directories which no longer contain Pattern Lab infrastructure - just Twig templates used by Drupal Components module. Consider renaming to `templates/components/` for clarity.

2. **Deprecated Sass functions**: Foundation 6.9.0 uses deprecated `darken()` and `scale-color()` functions. Warnings silenced with `silenceDeprecations: ['import']`.

3. **Large monolithic customizations file**: _du-customizations-only.scss is 21,954 lines. Consider splitting into logical components when stable.

4. **Build process consolidation**: The `copy-libs` task copies all npm libraries on every build. Consider optimizing to only copy when package.json changes.

## Future Improvements

1. **Break down monolithic customizations**: Split _du-customizations-only.scss into logical component files for easier maintenance
2. **Extract variables**: Replace hardcoded colors (#375060, #BA0C2F, etc.) with SCSS variables
3. **Component namespace cleanup**: Rename `source/_patterns/` to `templates/components/`
4. **Modern Sass functions**: Update Foundation variables to use modern color functions (once Foundation updates)
5. **Automated testing**: Add JavaScript behavior tests
6. **Foundation optimization**: Document which Foundation JS plugins are actually used

## Support

For questions about this migration, contact the development team or reference:
- [Drupal 10 Upgrade Guide](https://www.drupal.org/docs/upgrading-drupal/drupal-10)
- [Components Module Documentation](https://www.drupal.org/project/components)
- [Foundation Sites Documentation](https://get.foundation/sites/docs/)
