/*!
 * command module for development server
 * @autor marco
 */


exports.description = 'Command to run the The-M-Project builder';

exports.name = 'builder';

exports.examples = [

];

exports.options = {

  manifest: {
    'description': 'Start the server in manifest mode. Enable generation of cache.manifest',
    'default': false
  },

  config: {
    'description': 'Specify a custom config',
    'hasargument': true
  },

  directory: {
    'description': 'Specify a custom project directory',
    'default': '$PWD',
    'hasargument': true
  },

  port: {
    'description': 'Specify a custom port',
    'default': 8000,
    'hasargument': true
  }

};

exports.run = function run(params) {
  var carbonCopy = require('../../carbonCopy/CarbonCopy');
  var server = new carbonCopy.CarbonCopy(params);

  server.run();
};
