'use strict';

const webpack = require('webpack');
const config = require('./webpack.config.js');

config.cache = false;
config.debug = false;
config.devtool = false;

config.plugins.push(new webpack.DefinePlugin({
  'process.env.NODE_ENV': '\'production\'',
  '__DEV__': false
}));

config.plugins.push(new webpack.optimize.AggressiveMergingPlugin());

module.exports = config;
