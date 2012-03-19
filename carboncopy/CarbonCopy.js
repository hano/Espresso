//var Narcissus = require('../submodules/github/narcissus');
var Narcissus = require('narcissus');
//var htmlparser = require("../submodules/github/tautologistics/lib/htmlparser");
var qs = require('../submodules/github/querystring');
var ViewLibrary = require('./ViewLibrary').ViewLibrary;
var ccServer;
var sys = require('sys');
var server = require('../core/server.js').Server;
var Url = require('url');
var Utils = require('../lib/espresso_utils');
var io = '';
var AppCopy = require('./AppCopy').AppCopy;

var tmpBuilderProxy = require('./TMPBuilderProxy').TMPBuilderProxy;

//TODO use require('path') for os compatibility

var CarbonCopy = exports.CarbonCopy = function (options) {
    var that = this;
    this.reservedURLs = {getViewLib: 'getViewLib', getASTLibrary:'getASTLibrary', setAbstractSyntaxTree:'setAbstractSyntaxTree', getAbstractSyntaxTree:'getAbstractSyntaxTree', application:'application', stopEspresso: 'stopEspresso' };
    this.abstractSyntaxTree = '';
    this.code = '';
    this.SourceCodeFiles = {};
    this.socket = '';
    //TODO is the / working on not unix systems?  look at require('path')
    this.applicationSourcePath = options.directory ? options.directory + '/' : '';
    //console.log(this.applicationSourcePath);

    CarbonCopy.super_.call(this, options);

    this.loadJSONConfig();

	this.viewLib = '';
	this.ASTLib = '';
	this.AST = {};

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

/**
  * overwrite this to get the dependencyTrees and so all files to build the AST
  *
*/
CarbonCopy.prototype.getNewApp = function (request, response) {

	var that = this;
    //var app = server.prototype.getNewApp.call(this, request, response);
	var app  = new AppCopy({ directory: that.applicationDirectory }, that);
	this.hostedApps.push(app); /* saving the app in local array */
  	
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
            console.log(file + '!!!!!!!!');
            if (that.reservedURLs[file]) {
                if (file === 'application') {
                    that.tmpbp.redirectToApplication(response);
                    if(!io){
                        //io = require('socket.io').listen(8800);
                        //io.sockets.on('connection', function (socket) {
                        //    that.socket = socket;
                        //});
                    }
                } else if (file === 'getViewLib') {
						if(that.viewLib){
							that.tmpbp.sendFile(that.viewLib, response);
						}	
                } else if (file === 'getASTLibrary') {
                    //console.log(Object.keys(that.SourceCodeFiles));
					if(that.ASTLib){
						that.tmpbp.sendFile(that.ASTLib, response);
					}
                } else if (file === 'getAbstractSyntaxTree') {
                    //console.log('GET getAbstractSyntaxTree');
                    //console.log(that.SourceCodeFiles['app'].content);
                    try{
						//old implementation with the complete sourcecode
                        //that.tmpbp.sendFile(Narcissus.parser.parse(that.SourceCodeFiles['app'].content), response);
						that.tmpbp.sendFile(that.AST, response);
                    }catch(e){
                        console.log('error parsing source');
                    }
                } else if (file === 'setAbstractSyntaxTree') {
                    var post = qs.parse(body);
                    that.decompileASTFromBuilderApp(post.setAbstractSyntaxTree);
					response.write(JSON.stringify({'code': 1, 'output': 'wrote succ'}), encoding = 'utf8');
					response.end();
                } else if (file === 'reloadApplication') {
                    that.socket.emit('espresso', { hello: 'world' });
                } else if (file === 'stopEspresso') {
                    response.write(JSON.stringify({'code': 2, 'output': 'closed connection'}), encoding = 'utf8');
                    response.end();
                    that.appServer.close();
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

CarbonCopy.prototype.decompileASTFromBuilderApp = function(data){
	var that = this;
	var dependences = JSON.parse(data);
	
	//TODO: response end erst senden wenn das schreiben succ. war ansonsten err - ist write sync oder async?
	Object.keys(dependences).forEach(function(path){
		var sourceCode = Narcissus.decompiler.pp(dependences[path]);
		//TODO is an update of the sourcefiles needfull?
		//if not espresso must be restarted to refresh them. but espresso is writing the source from ast - should be the same - so no refrehsing of the sourcefiles are needed - but to be secure it would be good
		that.writeFile(sourceCode, path);	
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
		that.buildASTFromDependencyTree();
        Utils.log('Builder running at ' + that.hostname + ':' + that.port + '/tmpbuilder');
    });
};

CarbonCopy.prototype.setSourceCodeFiles = function (SourceCodeFiles) {
	this.SourceCodeFiles = SourceCodeFiles;
	//console.log(this.SourceCodeFiles['app'].framework.dependencyTrees);
	this.setASTLib();
};

CarbonCopy.prototype.buildASTFromDependencyTree = function(){
	//here is all the sourcecode to build a good AST
	if(this.SourceCodeFiles && this.SourceCodeFiles['app'] && this.SourceCodeFiles['app'].framework && this.SourceCodeFiles['app'].framework.dependencyTrees){
		var tree = this.SourceCodeFiles['app'].framework.dependencyTrees;
		var astObjects = {};
		tree.forEach(function(file){
			//console.log(file.name);
			var data = file.file.content;
			var sourcecode = data.toString("utf8", 0, data.length);
			astObjects[file.name] = Narcissus.parser.parse(sourcecode);
		});
		this.AST = astObjects;
	}
	
};

CarbonCopy.prototype.setASTLib = function(){
	var M = this.browserSimulation(this.SourceCodeFiles['core'].content, this.SourceCodeFiles['ui'].content);
	this.ASTLib = this.generateASTfromView(M);
};

CarbonCopy.prototype.writeFile = function (obj, name) {

    var that = this;
    var _name = name ? name : 'app/main.js'
    var fs = require('fs');

    fs.writeFile(that.applicationSourcePath + _name, '', function (err) {
        if (err) throw err;
        fs.writeFile(that.applicationSourcePath + _name, obj, function (err) {
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
	this.viewLib = viewLib.lib;

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