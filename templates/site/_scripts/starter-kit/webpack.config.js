'use strict';

const webpack = require('webpack');

const config = {};

config.stats = {
  colors: true,
  reasons: false
};

// Some window deps
config.plugins = [
  new webpack.ProvidePlugin({
    ko: 'knockout',
    'window.ko': 'knockout'
  })
];

config.externals = {};

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

module.exports = config;
