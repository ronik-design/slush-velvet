'use strict';

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const clonedeep = require('lodash.clonedeep');

const loadConfig = function (configPath) {
  const filepath = path.resolve(__dirname, '..', configPath);
  const dirname = path.dirname(filepath);

  const rawConfig = yaml.safeLoad(fs.readFileSync(filepath, 'utf8'));

  const config = clonedeep(rawConfig);

  config.base = path.resolve(__dirname, '..');
  config.source = path.resolve(dirname, rawConfig.source);
  config.destination = path.resolve(dirname, rawConfig.destination);
  config.build = path.resolve(dirname, rawConfig.build);

  return config;
};

module.exports = loadConfig;
