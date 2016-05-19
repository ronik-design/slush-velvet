'use strict';

const webpack = require('webpack');

const config = {};

config.stats = {
  colors: true,
  reasons: false
};

// Bootstrap needs some window deps
config.plugins = [
  new webpack.ProvidePlugin({
    jQuery: 'jquery',
    'window.jQuery': 'jquery',
    'window.$': 'jquery',
    Tether: 'tether',
    'window.Tether': 'tether'
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
