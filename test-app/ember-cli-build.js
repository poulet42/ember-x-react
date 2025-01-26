'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

const plugin = require('ember-x-react').buildBabelPlugin();

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    'ember-cli-babel': { enableTypeScriptTransform: true },
    autoImport: {
      watchDependencies: ['ember-x-react'],
    },
    babel: {
      plugins: [plugin],
    },
  });

  const { maybeEmbroider } = require('@embroider/test-setup');
  return maybeEmbroider(app, {
    packagerOptions: {
      webpackConfig: {
        module: {
          rules: [
            {
              test: /\.tsx$/,
              use: [
                {
                  loader: 'babel-loader',
                  options: {
                    presets: [
                      ['@babel/preset-react', { runtime: 'automatic' }],
                    ],
                  },
                },
              ],
            },
          ],
        },
      },
    },
  });
};
