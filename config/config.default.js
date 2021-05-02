'use strict';

var config = require('./config.webgme'),
    validateConfig = require('webgme/config/validator');

config.requirejsPaths['jointjs'] = './node_modules/jointjs/dist/joint.min';
config.requirejsPaths['lodash'] = './node_modules/lodash/lodash.min';
config.requirejsPaths['backbone'] = './node_modules/backbone/backbone-min';
config.requirejsPaths['jointjs.css'] = './node_modules/jointjs/dist/joint.min.css';
config.requirejsPaths['geometry'] = './node_modules/jointjs/dist/geometry.min';
config.requirejsPaths['he.js'] = './node_modules/he/he';

config.plugin.allowServerExecution = true;

validateConfig(config);
module.exports = config;
