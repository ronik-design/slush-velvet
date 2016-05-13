'use strict';

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const clone = require('hoek').clone;

const loadConfig = function (configPath) {
  const filepath = path.resolve(__dirname, '..', configPath);
  const dirname = path.dirname(filepath);

  const rawConfig = yaml.safeLoad(fs.readFileSync(filepath, 'utf8'));

  const config = clone(rawConfig);

  config.base = path.resolve(__dirname, '..');
  config.source = path.resolve(dirname, rawConfig.source);
  config.destination = path.resolve(dirname, rawConfig.destination);
  config['build_dir'] = path.resolve(dirname, rawConfig['build_dir']);

  return config;
};

module.exports = loadConfig;
