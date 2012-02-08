var Narcissus = require('Narcissus');
var htmlparser = require("htmlparser");
var qs = require('querystring');
var ViewLibrary = require('./ViewLibrary').ViewLibrary;
var ccServer;


var CarbonCopy = exports.CarbonCopy = function (appName, hostName, port) {

    this.appName = appName ? appName : 'CarbonCopy';
    this.appFile = this.appName + '_App.js';
    this.hostName = hostName ? hostName : '127.0.0.1';
    this.port = port ? port : 8000;
    this.http = require('http');
    this.ASTLib = {};

    this.abstractSyntaxTree = '';
    this.code = '';

    var that = this;

    this.server();

    this.doRequests(that.appFile, function(resp) {
        that.code = resp[that.appFile];
        that.abstractSyntaxTree = Narcissus.parser.parse(that.code);
    });

    this.doRequests('core.js', function(resp) {

        var coreJs = resp['core.js'];

        that.doRequests('ui.js', function(resp) {
            var uiJs = resp['ui.js'];
            var M = that.browserSimulation(coreJs, uiJs);
            that.ASTLib = that.generateASTfromView(M);
        });
    });
};
/**
 * requests all files through the given string or array and calls on success the callback function
 * with all responses in one var
 *
 */
CarbonCopy.prototype.doRequests = function(requests, callback) {
    var that = this,
        responseCounter = 0,
        _requests = [],
        _response = {};

    if (typeof(requests) === 'string') {
        _requests[0] = requests;
    } else {
        _requests = requests
    }
    var sync = function(counter) {
        if (counter >= _requests.length) {
            callback(_response);
        }
    }
    _requests.forEach(function(url, c) {
//            /tmp_builder/Rules.js
        var options = {
            host: that.hostName,
            port: that.port,
            path: '/' + that.appName + '/' + url
        };

//        console.log(options.host);
//        console.log(options.port);
//        console.log(options.path);

        that.http.get(options,
            function(res) {
                var content = '';
                res.setEncoding('utf-8');
                res.on('data', function(chunk) {
                    content += chunk;
                });
                res.on('end', function() {
                    _response[url] = content;
                    responseCounter += 1;
                    sync(responseCounter);
                });
            }).on('error', function(e) {
                console.log("Got error: " + e.message);
            });
    });
}


CarbonCopy.prototype.server = function () {
//    if a server runs close it
    if (ccServer)  ccServer.close();

    var that = this;

    ccServer = this.http.createServer(function (request, response) {

        var body = '';

        request.on('data', function(data) {
            body += data;
        });

        request.on('end', function() {
            var post = qs.parse(body);
            if (body === 'getASTLibrary') {
                if (that.ASTLib) {
                    var btn = that.ASTLib['M.LabelView'];
                    response.write(JSON.stringify(that.ASTLib), encoding = 'utf8');
                } else {
                    response.write('ASTLIB NOT READY YET', encoding = 'utf8');
                }
            } else if (body === 'getCode') {
                response.write(that.code, encoding = 'utf8');
            } else if (body === 'getAbstractSyntaxTree') {

                a = that.abstractSyntaxTree;

                var ast = JSON.stringify(a);
                var _a = JSON.parse(ast);
//                console.log(_a.children[0].expression.children);
                response.write(ast, encoding = 'utf8');
            } else if (post.setAbstractSyntaxTree) {
                var x = Narcissus.decompiler.pp(JSON.parse(post.setAbstractSyntaxTree));
                console.log(x);
                that.writeFile(x);
                that.writeFile(post.setAbstractSyntaxTree, 'JSON.js');
            }
            response.end();
        });

    });

    var port = this.port,
        that = this;

    port += 1;
    ccServer.listen(port, function () {
        console.log('Server running at http://' + that.hostName + ':' + port + '/');
    });
}

CarbonCopy.prototype.writeFile = function(obj, name) {

    var _name = name ? name : 'app/new_main.js'
    var fs = require('fs');

    fs.writeFile('' + _name, '', function (err) {
        if (err) throw err;
        fs.writeFile('' + _name, obj, function (err) {
            if (err) throw err;
            console.log('It\'s saved in ' + _name);
        });
    });
}


CarbonCopy.prototype.browserSimulation = function() {
    var jsdom = require("jsdom").jsdom;

    var jsdom  = require("jsdom").jsdom,
        document    = jsdom(null, null),
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
    Object.keys(args).forEach(function(key) {
        code += (args[key]);
    });
    eval(code);
    
    return M;
}

CarbonCopy.prototype.generateASTfromView = function(M, asJSON) {

    var viewLib = new ViewLibrary(M);
    viewLib.tmpCode();

    var viewsAsAST = {};
    Object.keys(viewLib.lib).forEach(function(key) {
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
}

CarbonCopy.prototype.getScript = function(){
    var script = 'var builder_ast_string = "";'
n[0]    + 'var builder_ast_object = "";'
n[0]    + '$(document).ready(function(){'
n[0]    +   '$.ajax({'
n[0]    +       'type: "POST",'
n[0]    +       ' url: "/CarbonCopy",'
n[0]    +       ' data: "getAbstractSyntaxTree",'
n[0]    +       'success: function(msg) {'
n[0]    +           'builder_ast_string = msg;'
n[0]    +           'builder_ast_object = JSON.parse(msg);'
n[0]    +           '/*console.log("Data received ", msg);*/'
n[0]    +       '},'
n[0]    +       'error: function(msg) {'
n[0]    +           'console.log("error on AST sync", msg);'
n[0]    +       '}'
n[0]    +   '});'
n[0]    +   '$.ajax({'
n[0]    +       'type: "POST",'
n[0]    +       ' url: "/CarbonCopy",'
n[0]    +       ' data: "getASTLibrary",'
n[0]    +       'success: function(msg) {'
n[0]    +           'builder_ast_lib = JSON.parse(msg);'
n[0]    +       '},'
n[0]    +       'error: function(msg) {'
n[0]    +           'console.log("error on AST sync", msg);'
n[0]    +       '}'
n[0]    +   '});'
n[0]    + '});';
    return script;
}