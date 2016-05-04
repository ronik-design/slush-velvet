'use strict';

const webpack = require('webpack');
const config = require('./webpack.config.js');

config.cache = true;
config.debug = true;
config.devtool = 'source-map';

config.plugins.push(new webpack.NoErrorsPlugin());
config.plugins.push(new webpack.DefinePlugin({
  '__DEV__': true
}));

module.exports = config;
