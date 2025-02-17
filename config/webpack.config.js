'use strict';

const { merge } = require('webpack-merge');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const webpack = require('webpack');

const common = require('./webpack.common.js');
const PATHS = require('./paths');

// Merge webpack configuration files
const config = (env, argv) =>
  merge(common, {
    entry: {
      popup: PATHS.src + '/popup.js',
      contentScript: PATHS.src + '/contentScript.js',
      background: PATHS.src + '/background.js',
      minifyHtml: PATHS.src + '/minifyHtml.js',
      flowHandler: PATHS.src + '/flowHandler.js',
      config: PATHS.src + '/config.js',
    },
    devtool: argv.mode === 'production' ? false : 'source-map',
    plugins: [
      new NodePolyfillPlugin(),
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
    ],
  });

module.exports = config;
