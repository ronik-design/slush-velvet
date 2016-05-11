'use strict';

const webpack = require('webpack');

const config = {};

config.stats = {
  colors: true,
  reasons: false
};

config.module = {
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
    }, {
      test: /\.js$/,
      exclude: /node_modules|\/vendor\//,
      loader: 'eslint'
    }
  ]
};

config.resolve = {
  modules: ['local_modules', 'node_modules'],
  extensions: ['', '.js']
};

module.exports = config;
