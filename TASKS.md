# Drupal 10 Theme Migration - COMPLETED ✅

**Branch:** `d10-upgrade-aten`
**Migration Completed:** January 2026

## Migration Summary

Successfully migrated pl_drupal theme from Drupal 9 to Drupal 10 with complete Pattern Lab removal. Theme has been updated to use modern build tooling (Gulp 5, Dart Sass, Node v24), Foundation 6.9.0, and Drupal.once API. All front-end libraries now managed via npm. Theme is ready for testing and merge to main.

---

## 1. Remove Pattern Lab–specific dependencies ✅

- [x] Remove composer.json, composer.lock, vendor and any related PatternLab PHP Library files
- [x] Remove any NPM related Pattern Lab packages from package.json
- [x] Remove Pattern Lab infrastructure (core/, config/, scripts/build.sh)
- [x] Remove Pattern Lab code from gulpfile.js (configuration, tasks, core.js dependency)
- [x] Rename theme to "PL Drupal D10 (Post-Pattern Lab Era)" v10.0.0
- [x] Preserve Components module namespaces in pl_drupal.info.yml

**What Was Removed:**
- 1000+ Pattern Lab PHP library files
- Pattern Lab configuration and build scripts
- Pattern Lab npm packages
- Pattern Lab tasks and utilities from gulpfile.js

**What Was Preserved:**
- `source/_patterns/` directories (now used by Drupal Components module)
- Component namespace definitions in theme info file

---

## 2. Update the theme for Drupal 10 compatibility ✅

- [x] Update core_version_requirement to `^10` in pl_drupal.info.yml
- [x] Fix Twig deprecations
  - Replaced `{% apply spaceless %}` with `|spaceless` filter in 2 templates
  - templates/page--landing-page.html.twig
  - templates/paragraph/paragraph--custom-markup.html.twig
- [x] Migrate jQuery.once to Drupal.once API
  - Converted 6 instances in js/app.js
  - Pattern: `$(once('key', 'selector', context)).each(...)`
  - Added `core/once` dependency to pl_drupal.libraries.yml
  - Removed deprecated `core/jquery.once` dependency
- [x] Verify no other Drupal 10 deprecations exist

---

## 3. Modernize front-end build system ✅

- [x] Upgrade Node.js requirement to v24 (added .nvmrc)
- [x] Upgrade build tooling
  - Gulp 5.0.1 (from 4.x)
  - Dart Sass 1.69.0 (from Node Sass)
  - gulp-sass 6.0.1
  - browser-sync 3.0.3
- [x] Upgrade Foundation Sites to 6.9.0 (from 6.7.5)
- [x] Configure gulpfile.js for modern build
  - Use Dart Sass instead of Node Sass
  - Split CSS compilation: foundation.scss and style.scss
  - Add copy-libs task (copies npm libraries to dest/libraries/)
  - Add copy-images task (copies images to dest/images/)
  - Remove Pattern Lab configuration and tasks
  - Remove core.js dependency
- [x] Achieve 0 npm security vulnerabilities
- [x] Verify build completes successfully

**Build System:**
- Node: v24
- Gulp: 5.0.1
- Sass: Dart Sass 1.69.0
- Security: 0 vulnerabilities ✅

---

## 4. Migrate front-end libraries to npm ✅

- [x] Add missing libraries to package.json
  - clipboard: ^2.0.11 (previously CDN)
  - isotope-layout: ^3.0.6 (previously CDN)
  - jquery.scrollto: ^2.1.3 (previously CDN)
- [x] Update existing library versions
  - foundation-sites: ^6.9.0
  - motion-ui: ^2.0.8
  - slick-carousel: ^1.8.1
- [x] Create gulp copy-libs task
  - Copies npm libraries from node_modules to dest/libraries/
  - Runs as part of build process
- [x] Update pl_drupal.libraries.yml
  - Change all library paths to dest/libraries/*
  - Remove CDN dependencies
  - All libraries now served from theme
- [x] Verify 0 security vulnerabilities

**Result:**
- Single source of truth for front-end dependencies
- No external CDN dependencies
- All libraries managed via npm and copied during build

---

## 5. Create migration documentation ✅

- [x] Create D10_UPGRADE.md
  - Complete migration history and technical details
  - Breaking changes documentation
  - Drupal.once() migration patterns
  - Build workflow instructions
  - Testing checklist
  - Known issues and future improvements
- [x] Update README.md
  - Modern build process documentation
  - Development workflow
  - Theme structure overview
  - Accurate library versions and paths
  - Troubleshooting guide
- [x] Create/update TASKS.md
  - Migration task tracking
  - Completion status
- [x] Update .gitignore
  - Exclude node_modules
  - Exclude build artifacts as needed

---

## Testing & Deployment

### Before Merging to Main:

1. **Test in Drupal 10 environment:**
   - [ ] Enable theme without errors
   - [ ] Verify jQuery.once conversions work correctly
   - [ ] Test Foundation components (accordion, dropdown, tabs, reveal, sticky)
   - [ ] Check responsive layouts across breakpoints
   - [ ] Test Twig components render properly
   - [ ] Verify no console errors
   - [ ] Test custom JavaScript behaviors

2. **Build verification:**
   - [x] npm run build completes successfully
   - [x] Libraries copied to dest/libraries/
   - [x] CSS files compile (foundation.css, style.css)
   - [x] 0 npm security vulnerabilities

3. **Code review:**
   - [ ] Review all changes on branch
   - [ ] Verify documentation is accurate
   - [ ] Check that Pattern Lab remnants are removed

### Deployment:

```bash
# When testing is complete and approved
git checkout main
git merge d10-upgrade-aten
git push origin main
```

---

## References

- [Drupal 10 Upgrade Guide](https://www.drupal.org/docs/upgrading-drupal/drupal-10)
- [Components Module](https://www.drupal.org/project/components)
- [Foundation Sites 6.9.0](https://get.foundation/sites/docs/)
- [Drupal.once API](https://www.drupal.org/node/3158256)
