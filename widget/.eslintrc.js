const neutrino = require('neutrino');

const eslintRc = neutrino().eslintrc();
eslintRc.plugins.push('prettier');

module.exports = eslintRc;
