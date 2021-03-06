const closureBuilder = require('closure-builder'),
      cssnano = require('cssnano'),
      fs = require('fs'),
      fGlob = require('glob').Glob,
      glob = closureBuilder.globSupport(),
      minify = require('html-minifier').minify,
      path = require('path'),
      shell = require('shelljs');

shell.mkdir('-p', ['dist/css', 'dist/js', 'dist/partial']);

// closureBuilder works well for JS
closureBuilder.build({
  name: 'js_files',
  srcs: glob([
    'templates/sw.js'
  ]),
  compilation_level: 'ADVANCED_OPTIMIZATIONS',
  externs: [
    'build/externs/cache.js',
    'build/externs/clients.js',
    'build/externs/localstorage.js',
    'build/externs/idb.js'
  ],
  language_in: 'ECMASCRIPT6',
  language_out: 'ES6',
  out: 'dist/sw.js'
});

closureBuilder.build({
  name: 'js_files',
  srcs: glob([
    'templates/js/app.js'
  ]),
  compilation_level: 'ADVANCED_OPTIMIZATIONS',
  externs: [
    'build/externs/cache.js',
    'build/externs/clients.js',
    'build/externs/localstorage.js'
  ],
  out: 'dist/js/app.js'
});

closureBuilder.build({
  name: 'js_files',
  srcs: glob([
    'templates/js/recipe.js'
  ]),
  compilation_level: 'ADVANCED_OPTIMIZATIONS',
  externs: [
    'build/externs/cache.js',
    'build/externs/clients.js',
    'build/externs/localstorage.js'
  ],
  out: 'dist/js/recipe.js'
});

closureBuilder.build({
  name: 'js_files',
  srcs: glob([
    'templates/js/validate.js'
  ]),
  compilation_level: 'ADVANCED_OPTIMIZATIONS',
  externs: [
    'build/externs/cache.js',
    'build/externs/clients.js',
    'build/externs/localstorage.js'
  ],
  out: 'dist/js/validate.js'
});

closureBuilder.build({
  name: 'js_files',
  srcs: glob([
    'templates/js/push.js'
  ]),
  compilation_level: 'ADVANCED_OPTIMIZATIONS',
  externs: [
    'build/externs/cache.js',
    'build/externs/clients.js',
    'build/externs/localstorage.js'
  ],
  out: 'dist/js/push.js'
});



// cssnano for CSS
var cssPattern = 'templates/css/*.css',
    cssOpts = {
      calc: true,
      colormin: true,
      convertValues: true,
      core: true,
      discardComments: true,
      discardDuplicates: true,
      discardEmpty: true,
      filterOptimiser: true,
      functionOptimiser: true,
      mergeLonghand: true,
      mergeRules: true,
      minifyFontvalues: true,
      minifyGradients: true,
      minfyParms: true,
      minifySelectors: true,
      normalizeCharset: true,
      normalizeUrl: true,
      orderedValues: true,
      reduceBackgroundRepeat: true,
      reduceIndents: true,
      reduceInitial: true,
      reducePositions: true,
      reduceTransforms: true,
      svgo: true,
      uniqueSelectors: true,
      zindex: true

    };

fGlob(cssPattern, (_, matches) => {
  matches.map(file => {
    var fileName = path.basename(file);

    fs.readFile(file, 'utf-8', (err, data) => {
      cssnano.process(data, cssOpts).then(result => {
        fs.writeFile('dist/css/' + fileName, result.css);
      }).catch(err => {
        console.error(err);
      });
    });
  });
});

var htmlOpts = {
  collapseBooleanAttributes: true,
  collapseWhitespace: true,
  customAttrAssign: [/^\$\{.*\}$/],
  ignoreCustomFragments: [/^\$\{.*\}$/],
  includeAutoGeneratedTags: false,
  removeComments: true,
  removeScriptTypeAttributes: true,
  removeStyleTypeAttributes: true,
  sortAttributes: true,
  sortClassname: true
};

// // html-minifier
var appShellPattern = 'templates/app-shell.html';
new fGlob(appShellPattern, (_, matches) => {
  matches.map(file => {
    var fileName = path.basename(file);

    fs.readFile(file, 'utf-8', (_, data) => {
      var output = minify(data, htmlOpts);

      fs.writeFile('dist/' + fileName, output, function(err) {
        if (err)
          console.error('Error minifying' + fileName, err);
      });
    });
  });
});

var htmlPattern = 'templates/partial/*.html';
new fGlob(htmlPattern, (_, matches) => {
  matches.map(file => {
    var fileName = path.basename(file);

    fs.readFile(file, 'utf-8', (_, data) => {
      var output = minify(data, htmlOpts);

      fs.writeFile('dist/partial/' + fileName, output, function(err) {
        if (err)
          console.error('Error minifying' + fileName, err);
      });
    });
  });
});
