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

Compiles SCSS and copies Foundation JS to `dest/` directory.

**Development build with watch:**
```bash
npm run watch
```

Watches for SCSS changes and recompiles automatically with sourcemaps.

### Build Output

- **CSS**: Compiled to `dest/style.css`
- **Foundation JS**: Bundled to `dest/foundation/js/`
- **Sourcemaps**: Generated during development builds

## Theme Structure

```
pl_drupal/
├── dest/              # Compiled CSS and bundled JS
├── du-resources/      # DU-specific SCSS (base, overrides, units, micro)
├── js/                # Custom JavaScript behaviors
├── scss/              # Main SCSS files
├── templates/         # Twig templates
│   ├── block/
│   ├── node/
│   ├── paragraph/
│   └── ...
└── gulpfile.js        # Build configuration
```

## Dependencies

### Theme Dependencies
- **Drupal Modules**:
  - `drupal:components` (provides Twig namespaces)
  - `drupal:twig_field_value`
  - `drupal:twig_tweak`

- **Core Libraries**:
  - `core/jquery`
  - `core/drupal`
  - `core/jquery.cookie`
  - `core/once`

### Front-end Dependencies
- Foundation Sites 6.9.0
- Motion UI 2.0.3
- Slick Carousel 1.8.1

## Migration from Pattern Lab

This theme was migrated from Drupal 9 with Pattern Lab to Drupal 10 without Pattern Lab. Key changes:

- Pattern Lab infrastructure completely removed
- Build system updated to Gulp 5 + Dart Sass
- Foundation upgraded to 6.9.0
- jQuery.once API replaced with Drupal.once
- Node.js v24 required

For complete migration details, see [D10_UPGRADE.md](D10_UPGRADE.md).

## Troubleshooting

**Build fails with Sass errors:**
- Ensure you're using Node v24: `nvm use`
- Delete `node_modules` and `package-lock.json`, then run `npm install`

**jQuery errors in console:**
- Verify `core/once` is loaded in libraries.yml
- Check that Drupal.once is being used instead of jQuery.once

**Foundation components not working:**
- Check that Foundation JS is properly bundled in `dest/foundation/js/`
- Verify library paths in `pl_drupal.libraries.yml`

## Contributing

When making changes:

1. Create a feature branch
2. Make your changes
3. Run `npm run build` to ensure build succeeds
4. Test in a Drupal environment
5. Commit with clear, descriptive messages

## Support

For questions or issues related to the Drupal 10 migration, see [D10_UPGRADE.md](D10_UPGRADE.md).

To install a specific StarterKit from GitHub type:

    php core/console --starterkit --install <starterkit-vendor/starterkit-name>

### Updating Pattern Lab

	composer update

## Other Documentation

These are crucial pieces that contains documentation that is good to understand:

- [`pattern-lab/patternengine-twig`](https://github.com/pattern-lab/patternengine-php-twig)
- [`aleksip/plugin-data-transform`](https://github.com/aleksip/plugin-data-transform)
- [Twig templating language](http://twig.sensiolabs.org/documentation)
