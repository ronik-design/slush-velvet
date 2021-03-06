'use strict';

const path = require('path');

const config = {};

config.stats = {
  colors: true,
  reasons: false
};

config.module = {
  preLoaders: [
    {
      test: /\.js$/,
      exclude: /node_modules|vendor/,
      loader: 'eslint'
    }
  ],
  loaders: [
    {
      test: /\/vendor\//,
      loader: 'imports?this=>window'
    }, {
      test: /\.js$/,
      exclude: /node_modules|\/vendor\//,
      loader: 'babel',
      query: {
        cacheDirectory: true,
        presets: ['es2015-native-modules']
      }
    }
  ]
};

config.resolve = {
  modules: ['node_modules'],
  extensions: ['', '.js']
};

config.eslint = {
  configFile: path.join(__dirname, '.eslintrc')
};

module.exports = config;
