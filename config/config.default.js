'use strict';

var config = require('./config.webgme'),
    validateConfig = require('webgme/config/validator');

// Add/overwrite any additional settings here
// config.server.port = 8080;
// config.mongo.uri = 'mongodb://127.0.0.1:27017/webgme_my_app';

//TODO: remove this later
config.debug = true;

config.requirejsPaths['jointjs'] = './node_modules/jointjs/dist/joint.min';
//TODO: which of these (if any) are needed? vvv
config.requirejsPaths['lodash'] = './node_modules/lodash/lodash.min';
config.requirejsPaths['backbone'] = './node_modules/backbone/backbone-min';
// config.requirejsPaths['dagre'] = './node_modules/dagre/dist/dagre.min';
// config.requirejsPaths['graphlib'] = './node_modules/graphlib/dist/graphlib.min';
// config.requirejsPaths['jquery'] = './node_modules/jquery/dist/jquery.min';
config.requirejsPaths['jointjs.css'] = './node_modules/jointjs/dist/joint.min.css';
// config.requirejsPaths['jointjs.core.css'] = './node_modules/jointjs/dist/joint.core.min.css';
// config.requirejsPaths['jointjs.core'] = './node_modules/jointjs/dist/joint.core.min';
// config.requirejsPaths['underscore'] = './node_modules/lodash/lodash.min';
// config.requirejsPaths['jointjs.pn'] = './node_modules/jointjs/dist/joint.shapes.pn.min';
// config.requirejsPaths['vectorizer'] = './node_modules/jointjs/dist/vectorizer.min';
config.requirejsPaths['geometry'] = './node_modules/jointjs/dist/geometry.min';
// config.requirejsPaths['joint.nowrap'] = './node_modules/jointjs/dist/joint.nowrap.min';
config.requirejsPaths['he.js'] = './node_modules/he/he';

config.plugin.allowServerExecution = true;

validateConfig(config);
module.exports = config;
