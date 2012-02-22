var E = require('../core/e').E;
var TaskManager = require('../core/task_manager').TaskManager;
var Framework = require('../core/framework').Framework;
var Report = require('../core/report').Report;
var Resource = require('../core/resource').Resource;
var Utils = require('../lib/espresso_utils');
var HTML = Utils.HTML;

var sys = require('sys');
var app = require('../core/app.js').App;

var AppCopy = exports.AppCopy = function (options, server) {
	AppCopy.super_.call(this, options, server);
};

sys.inherits(AppCopy, app);

/********* overwrite */

/**
 * @description
 * Load the projects related files.
 * The project is equals the application.
 */
AppCopy.prototype.loadTheApplication = function () {
console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! LOAD THE APPLICATION !!!!!' );
  var that = this,
      _theApplication = [],
      _theApplicationResources,
      _i18n;

  _theApplication = ['app'].map(function (module) {
    var _frameworkOptions  = {};
    _frameworkOptions.path = that.applicationDirectory + '/' + module;
    _frameworkOptions.name = that.name + '_App';
    _frameworkOptions.frDelimiter = that.applicationDirectory + '/';
    _frameworkOptions.excludedFolders = ['resources'].concat(that.excludedFolders);
    _frameworkOptions.excludedFiles = ['.DS_Store'].concat(that.excludedFiles);
    _frameworkOptions.app = that;
    if (!that.eliminate) {
      _frameworkOptions.taskChain = new TaskManager([
        "preSort",
        "dependency",
        "merge",
        "minify",
        "contentType",
        "manifest"
      ]).getTaskChain();
    } else {
      _frameworkOptions.taskChain = new TaskManager([
        "preSort",
        "dependency",
        "analyze",
        "globalAnalyze",
        "eliminate",
        "merge",
        "minify",
        "contentType",
        "manifest"
      ]).getTaskChain();
    };
    return new Framework(_frameworkOptions);
  });
  this.addFrameworks(_theApplication);

  _theApplicationResources = ['app/resources'].map(function (module) {
    var _frameworkOptions  = {};
    _frameworkOptions.path = that.applicationDirectory + '/' + module;
    _frameworkOptions.name = that.name + '_AppResources';
    _frameworkOptions.frDelimiter = that.applicationDirectory+'/';
    _frameworkOptions.excludedFolders = that.excludedFolders;
    _frameworkOptions.excludedFiles = ['.DS_Store'].concat(that.excludedFiles);
    _frameworkOptions.app = that;
    _frameworkOptions.taskChain = new TaskManager([
      "contentType",
      "manifest"
    ]).getTaskChain();
    return new Resource(_frameworkOptions);
  });
  this.addFrameworks(_theApplicationResources);

  if (this.supportedLanguages.length >= 1) {
    _i18n = ['app/resources/i18n'].map(function (module) {
      var _frameworkOptions  = {};
      _frameworkOptions.path = that.applicationDirectory + '/' + module;
      _frameworkOptions.name = 'i18n';
      _frameworkOptions.frDelimiter = that.applicationDirectory+'/';
      _frameworkOptions.excludedFolders = that.excludedFolders;
      _frameworkOptions.excludedFiles = ['.DS_Store'].concat(that.excludedFiles);
      _frameworkOptions.app = that;
      _frameworkOptions.taskChain = new TaskManager([
        "contentType",
        "manifest"
      ]).getTaskChain();
      return new Framework(_frameworkOptions);
    });
    this.addFrameworks(_i18n);
  };
};