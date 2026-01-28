'use strict';

const core = require('./core');
const exec = require('child_process').exec;
const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const sassGlob = require('gulp-sass-glob');
const join = require('path').join;
const consolePath = './core/console';
const notifier = require('node-notifier');

const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');
const glob = require('glob');

var done;

var config = {
    src: [
        './scss/**/*.scss',
        './source/_patterns/**/*.scss'
    ],
    css: {
        includePaths: [
            './node_modules'
        ]
    },

    patternLab: {
        enabled: true,
        configFile: 'config/config.yml',
        watchedExtensions: [
            'twig',
            'json',
            'yaml',
            'yml',
            'md',
            'jpg',
            'jpeg',
            'png',
        ],
        injectFiles: [],
        bowerBasePath: './',
        twigNamespaces: {
            addToDrupalThemeFile: true,
            sets: [
                {
                    namespace: 'atoms',
                    paths: ['source/_patterns/01-atoms/'],
                },  {
                    namespace: 'molecules',
                    paths: ['source/_patterns/02-molecules/'],
                },
                {
                    namespace: 'organisms',
                    paths: ['source/_patterns/03-organisms/'],
                }, {
                    namespace: 'templates',
                    paths: ['source/_patterns/04-templates/'],
                }, {
                    namespace: 'pages',
                    paths: ['source/_patterns/05-pages/'],
                }
            ],
        },

    },
    drupal: {
        enabled: true,
        themeFile: 'pl_drupal.info.yml',
        // when these files change
        watch: [
            'templates/**',
            '*.theme',
        ],
        // run this command
        command: 'drush cache-rebuild',
        // in this directory
        dir: './',
    },

};

let plConfig = yaml.safeLoad(
    fs.readFileSync(config.patternLab.configFile, 'utf8')
);


const plRoot = path.join(config.patternLab.configFile, '../..');
const plSource = path.join(plRoot, plConfig.sourceDir);
const plPublic = path.join(plRoot, plConfig.publicDir);
const plMeta = path.join(plSource, '/_meta');
const watchTriggeredTasks = [];


gulp.task('sass-dev', function () {
  return gulp.src(config.src)
    .pipe(sassGlob())
    .pipe(sourcemaps.init({
      debug: config.debug,
    }))
    .pipe(sass({
      includePaths: config.css.includePaths,
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dest'));
});

gulp.task('sass', function () {
  return gulp.src(config.src)
    .pipe(sassGlob())
    .pipe(sass({
      includePaths: config.css.includePaths,
    }))
    .pipe(gulp.dest('dest'));
});

gulp.task('pattern-lab', gulp.series(function buildPromise () {
  return new Promise(function (resolve, reject) {
    core.sh(`php ${consolePath} --generate`, true, (err) => {
      resolve();
    });
  });
}));

gulp.task('build', gulp.series('sass','pattern-lab'));

gulp.task('watch', gulp.series(function () {
    gulp.watch(['du-resources/**/*.scss', 'scss/**/*.scss', 'source/_patterns/**/*.scss'], gulp.series('sass-dev'));
}));


gulp.task('twigNamespaces', function () {

  return new Promise(function (resolve, reject) {
    addTwigNamespaceConfigToPl();
    if (config.patternLab.twigNamespaces.addToDrupalThemeFile) {
      addTwigNamespaceConfigToDrupal(done);
    }
    resolve();
  });
});



/******** Utility functions ******/



function getTwigNamespaceConfig(workingDir) {
    workingDir = workingDir || process.cwd(); // eslint-disable-line no-param-reassign
    const twigNamespaceConfig = {};
    config.patternLab.twigNamespaces.sets.forEach((namespaceSet) => {
        const pathArray = namespaceSet.paths.map((pathBase) => {
                const results = glob.sync(path.join(pathBase, '**/*.twig')).map((pathItem) => { // eslint-disable-line arrow-body-style
                        return path.relative(workingDir, path.dirname(pathItem));
});
results.unshift(path.relative(workingDir, pathBase));
return results;
});
twigNamespaceConfig[namespaceSet.namespace] = {
    paths: core.uniqueArray(core.flattenArray(pathArray)),
};
});
return twigNamespaceConfig;
}

function addTwigNamespaceConfigToDrupal(done) {
    const twigNamespaceConfig = getTwigNamespaceConfig(path.dirname(config.drupal.themeFile));
    const drupalThemeFile = yaml.safeLoad(
        fs.readFileSync(config.drupal.themeFile, 'utf8')
    );
   Object.assign(drupalThemeFile['component-libraries'], twigNamespaceConfig);
    const newThemeFile = yaml.safeDump(drupalThemeFile);
    fs.writeFileSync(config.drupal.themeFile, newThemeFile, 'utf8');
    // done();
}

function addTwigNamespaceConfigToPl(done) {
    const twigNamespaceConfig = getTwigNamespaceConfig(plRoot);
    plConfig = yaml.safeLoad(
        fs.readFileSync(config.patternLab.configFile, 'utf8')
    );
    if (!plConfig.plugins) {
        Object.assign(plConfig, {
            plugins: {
                twigNamespaces: { enabled: true, namespaces: {} },
            },
        });
    } else if (!plConfig.plugins.twigNamespaces) {
        Object.assign(plConfig.plugins, {
            twigNamespaces: { enabled: true, namespaces: {} },
        });
    } else if (!plConfig.plugins.twigNamespaces.namespaces) {
        plConfig.plugins.twigNamespaces.namespaces = {};
    }
    Object.assign(plConfig.plugins.twigNamespaces.namespaces, twigNamespaceConfig);
    const newConfigFile = yaml.safeDump(plConfig);
    fs.writeFileSync(config.patternLab.configFile, newConfigFile, 'utf8');
    // done();
}


