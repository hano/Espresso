var Narcissus = require('../submodules/github/narcissus');
var htmlparser = require("../submodules/github/tautologistics/lib/htmlparser");
//var qs = require('querystring');
var ViewLibrary = require('./ViewLibrary').ViewLibrary;
var ccServer;
var sys = require('sys');
var server = require('../core/server.js').Server;
var Url = require('url');
var Utils = require('../lib/espresso_utils');

var tmpBuilderProxy = require('./TMPBuilderProxy').TMPBuilderProxy;

var CarbonCopy = exports.CarbonCopy = function (options) {
    var that = this;
    this.reservedURLs = {getASTLibrary:'getASTLibrary', setAbstractSyntaxTree:'setAbstractSyntaxTree', getAbstractSyntaxTree:'getAbstractSyntaxTree', application:'application' };
    this.abstractSyntaxTree = '';
    this.code = '';
    this.SourceCodeFiles = {};

    CarbonCopy.super_.call(this, options);

    this.loadJSONConfig();

    this.tmpbp = new tmpBuilderProxy(this.hostname, this.port, this.appName, this.tmpBuilderPath);
    this.initTMPApplication(options);
};

sys.inherits(CarbonCopy, server);

/********* overwrite */

CarbonCopy.prototype.loadJSONConfig = function (request, response) {
    var config = Utils.readConfig(this.applicationDirectory);
    if(config && config.builder && config.builder.TMPBuilderPath)
        this.tmpBuilderPath = config.builder.TMPBuilderPath;
    server.prototype.loadJSONConfig.call(this, request, response);
};

CarbonCopy.prototype.getNewApp = function (request, response) {

    var app = server.prototype.getNewApp.call(this, request, response);
    app.__getFiles__ = function (files) {
        var that = this;
        var ret = {};
        Object.keys(that.frameworks).forEach(function (a, b) {
            var fr = (that.frameworks[a].path.split('/').pop());
            if (files[fr]) {
                ret[fr] = (that.frameworks[a].files[0]);
            }
        });
        return ret;
    };
    return app;
};

CarbonCopy.prototype.proxyThat = function (request, response) {
    var that = this;
    var body = '';

    request.on('data', function (data) {
        body += data;
    });

    request.on('end', function () {
        var _path = Url.parse(request.url).pathname.slice(1);
        var _pr = _path.split('/')[0];
        if (_pr === 'tmpbuilder') {
            var file = _path.split('tmpbuilder/').join('');
            if (that.reservedURLs[file]) {
                console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ' + file);
                if (file === 'application') {
                    that.tmpbp.redirectToApplication(response);
                } else if (file === 'getASTLibrary') {
                    console.log(Object.keys(that.SourceCodeFiles));
                    var M = that.browserSimulation(that.SourceCodeFiles['core'].content, that.SourceCodeFiles['ui'].content);
                    var ASTLib = that.generateASTfromView(M);
                    that.tmpbp.sendFile(ASTLib, response);
                } else if (file === 'getAbstractSyntaxTree') {
                    console.log(that.SourceCodeFiles['app'].content);
                    try{
                        that.tmpbp.sendFile(Narcissus.parser.parse(that.SourceCodeFiles['app'].content), response);
                    }catch(e){
                        console.log('error parsing source');
                    }
                } else if (file === 'setAbstractSyntaxTree') {
                    //var post = qs.parse(body);
                    //that.SourceCodeFiles['app'].content = post.setAbstractSyntaxTree;
                    //var x = Narcissus.decompiler.pp(JSON.parse(post.setAbstractSyntaxTree));
                    //console.log(x);
                    //that.writeFile(x);
                    //that.writeFile(post.setAbstractSyntaxTree, 'JSON.js');
                }
            } else {
                that.tmpbp.deliver(response, _path);
            }
        } else {
            //TODO test if this is working
            server.prototype.proxyThat.call(this, request, response);
        }
    });
};

/********* own implementations */

CarbonCopy.prototype.initTMPApplication = function (options) {

    var that = this;
    var app = this.getNewApp(this, options.directory);

    app.offlineManifest = false;

    app.loadTheApplication();
    app.loadTheMProject();

    app.build(function (options) {
        var getFiles = {ui:true, core:true, app:true};
        var SourceCodeFiles = app.__getFiles__(getFiles);
        that.setSourceCodeFiles(SourceCodeFiles);
        Utils.log('Builder running at ' + that.hostname + ':' + that.port + '/tmpbuilder');
    });
};

CarbonCopy.prototype.setSourceCodeFiles = function (SourceCodeFiles) {
    this.SourceCodeFiles = SourceCodeFiles;
};

CarbonCopy.prototype.writeFile = function (obj, name) {

    var _name = name ? name : 'app/main.js'
    var fs = require('fs');

    fs.writeFile('' + _name, '', function (err) {
        if (err) throw err;
        fs.writeFile('' + _name, obj, function (err) {
            if (err) throw err;
            console.log('It\'s saved in ' + _name);
        });
    });
}

CarbonCopy.prototype.browserSimulation = function () {
    var jsdom = require("jsdom").jsdom;

    var jsdom = require("jsdom").jsdom,
            document = jsdom(null, null),
            window = document.createWindow();

    //var dom = jsdom(null, null);
    //var browser = jsdom.windowAugmentation(dom);
    //var document = browser.document;
    //var window = browser.window;
    //var self = browser.self;
    var navigator = {}//browser.navigator;
    var location = {}//browser.location;
    var localStorage = {};

    var code = '';
    var args = Array.prototype.slice.call(arguments);
    Object.keys(args).forEach(function (key) {
        code += (args[key]);
    });
    eval(code);

    return M;
};

CarbonCopy.prototype.generateASTfromView = function (M, asJSON) {

    var viewLib = new ViewLibrary(M);
    viewLib.tmpCode();

    var viewsAsAST = {};
    Object.keys(viewLib.lib).forEach(function (key) {
//        TODO IMPLEMENT MAPVIEW AND MapMarkerView!!!
        if (key === 'M.MapView' || key === 'M.MapMarkerView') {
            //console.log(viewLib.lib[key]);
        } else {
//            viewsAsAST[key] = (Narcissus.parser.parse(viewLib.lib[key]));
//            TODO MAKE NICE
            viewsAsAST[key] = Narcissus.parser.parse('content: M.ScrollView.design({label: ' + viewLib.lib[key] + ' });').children[0].target.expression.children[1].children[0].children[0].children[1];
        }

    });
//    TODO MAKE NICE
    viewsAsAST['childViewName'] = Narcissus.parser.parse('content: M.ScrollView.design({label: M.LabelView.design({value: "lala"})});').children[0].target.expression.children[1].children[0].children[0];

    return viewsAsAST;
};

CarbonCopy.prototype.getScript = function () {
    var script = 'var builder_ast_string = "";'
            + 'var builder_ast_object = "";'
            + '$(document).ready(function(){'
            + '$.ajax({'
            + 'type: "POST",'
            + ' url: "/CarbonCopy",'
            + ' data: "getAbstractSyntaxTree",'
            + 'success: function(msg) {'
            + 'builder_ast_string = msg;'
            + 'builder_ast_object = JSON.parse(msg);'
            + '/*console.log("Data received ", msg);*/'
            + '},'
            + 'error: function(msg) {'
            + 'console.log("error on AST sync", msg);'
            + '}'
            + '});'
            + '$.ajax({'
            + 'type: "POST",'
            + ' url: "/CarbonCopy",'
            + ' data: "getASTLibrary",'
            + 'success: function(msg) {'
            + 'builder_ast_lib = JSON.parse(msg);'
            + '},'
            + 'error: function(msg) {'
            + 'console.log("error on AST sync", msg);'
            + '}'
            + '});'
            + '});';
    return script;
};