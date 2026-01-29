# PL Drupal D10 Theme

**Drupal 10 compatible theme** - Pattern Lab dependencies removed as of January 2026.

This theme previously used Pattern Lab for component development but has been migrated to a standard Drupal 10 theme. See [D10_UPGRADE.md](D10_UPGRADE.md) for complete migration details.

## Prerequisites

- Node.js v24 (use `nvm use` to switch to the correct version)
- npm

## Installation

1. Clone this repository into your Drupal `themes/custom/` directory
2. Install Node dependencies:
   ```bash
   nvm use
   npm install
   ```
3. Build the theme assets:
   ```bash
   npm run build
   ```
4. Enable the theme in Drupal

## Development Workflow

### Build Commands

**Production build:**
```bash
npm run build
```

Compiles SCSS, copies npm libraries to `dest/libraries/`, and bundles images.

**Development build with watch:**
```bash
npm run watch
```

Watches for SCSS changes and recompiles automatically with sourcemaps.

**Extract DU customizations from sparkle.css:**
```bash
npm run extract-customizations
```

Regenerates `_du-customizations-only.scss` by extracting DU-specific styles from sparkle.css and removing Foundation library code.

**Extract unit theme customizations (pl_unit):**
```bash
npm run extract-unit-customizations
```

Extracts pl_unit theme-specific styles to `../pl_unit/dest/sparkle-unit.css` by comparing against pl_drupal base theme.

### Making Style Changes

**⚠️ IMPORTANT: Most style changes should be made to `scss/_du-customizations-only.scss`**

This file contains all DU-specific customizations (21,954 lines) extracted from production sparkle.css. This is where you should make changes for:

- Component styling (buttons, cards, navigation, etc.)
- Custom layouts and overrides
- DU-specific design implementations
- Production hotfixes and manual edits

**Other SCSS files:**
- `scss/_variables.scss` - DU brand colors and fonts (edit carefully)
- `scss/_settings.scss` - Foundation framework configuration (rarely change)
- `scss/foundation.scss` - Foundation framework entry point (don't edit)
- `scss/style.scss` - Imports for DU customizations (don't edit unless adding new files)

**Workflow for style changes:**
1. Edit `scss/_du-customizations-only.scss`
2. Run `npm run watch` to see changes live
3. Test in browser
4. Commit changes

### Build Output

- **CSS**: `dest/style.css` (DU customizations) and `dest/foundation.css` (Foundation framework)
- **Libraries**: npm packages copied to `dest/libraries/` (Foundation, Motion UI, Slick, etc.)
- **Images**: Copied to `dest/images/`
- **Sourcemaps**: Generated during development builds

## Theme Structure

```
pl_drupal/
├── dest/                    # Build output
│   ├── style.css           # DU customizations (compiled)
│   ├── foundation.css      # Foundation framework (compiled)
│   └── libraries/          # npm libraries copied here
├── scss/                    # Source SCSS
│   ├── _variables.scss     # DU brand colors & fonts
│   ├── _settings.scss      # Foundation 6.9.0 config
│   ├── _du-customizations-only.scss  # All DU custom styles (21,954 lines)
│   ├── foundation.scss     # Foundation entry point
│   └── style.scss          # DU customizations entry point
├── js/                      # Custom JavaScript behaviors
├── templates/               # Twig templates
├── source/_patterns/        # Component directories (for Drupal Components module)
└── gulpfile.js             # Build configuration
```

## Dependencies

### Theme Dependencies
- **Drupal Modules**:
  - `drupal:components` (provides Twig namespaces for source/_patterns/)
  - `drupal:twig_field_value`
  - `drupal:twig_tweak`

- **Core Libraries**:
  - `core/jquery`
  - `core/drupal`
  - `core/jquery.cookie`
  - `core/once` (Drupal.once API)

### Front-end Dependencies (npm)
- foundation-sites: ^6.9.0
- motion-ui: ^2.0.8
- slick-carousel: ^1.8.1
- clipboard: ^2.0.11
- isotope-layout: ^3.0.6
- jquery.scrollto: ^2.1.3

All libraries are copied to `dest/libraries/` during build and served from the theme (no CDN dependencies).

## Migration from Pattern Lab

This theme was migrated from Drupal 9 with Pattern Lab to Drupal 10 without Pattern Lab. Key changes:

- Pattern Lab infrastructure completely removed
- Build system updated to Gulp 5 + Dart Sass
- Foundation upgraded to 6.9.0
- jQuery.once API replaced with Drupal.once
- Node.js v24 required
- All front-end libraries managed via npm (no Composer npm-asset or CDN)
- Production sparkle.css customizations migrated to Foundation 6.9.0 base

For complete migration details, see [D10_UPGRADE.md](D10_UPGRADE.md).

## Troubleshooting

**Build fails with Sass errors:**
- Ensure you're using Node v24: `nvm use`
- Delete `node_modules` and `package-lock.json`, then run `npm install`

**jQuery errors in console:**
- Verify `core/once` is loaded in libraries.yml
- Check that Drupal.once is being used instead of jQuery.once

**Foundation components not working:**
- Check that Foundation JS is at `dest/libraries/foundation-sites/dist/js/foundation.min.js`
- Verify library paths in `pl_drupal.libraries.yml`

**Missing libraries after npm install:**
- Run `npm run build` to execute copy-libs and copy-images tasks

## Contributing

When making style changes:

1. Create a feature branch
2. **Edit `scss/_du-customizations-only.scss`** (this is where most changes go)
3. Run `npm run watch` during development
4. Test thoroughly in a Drupal environment
5. Run `npm run build` to verify production build succeeds
6. Commit with clear, descriptive messages

**Note:** Avoid editing Foundation framework files (`_settings.scss`, `foundation.scss`) unless you're intentionally changing the framework configuration.

## Support

For questions or issues related to the Drupal 10 migration, see [D10_UPGRADE.md](D10_UPGRADE.md).
