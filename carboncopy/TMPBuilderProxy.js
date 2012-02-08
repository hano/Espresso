var fs = require('fs');
var path = require('path');

var TMPBuilderProxy = exports.TMPBuilderProxy = function () {
    this.ip = arguments[0];
    this.port = arguments[1];
    this.appName = arguments[2];
    this.appFile = this.appName + '_App.js';

    this.ASTLib = this.buildASTLib();
    this.abstractSyntaxTree = this.buildAbstractSyntaxTree();
};

TMPBuilderProxy.prototype.buildASTLib = function () {

    return {};
};

TMPBuilderProxy.prototype.buildAbstractSyntaxTree = function () {

    return {};
};

TMPBuilderProxy.prototype.redirectToApplication = function (response) {
    response.writeHead(302, {
        'Location':'http://' + this.ip + ':' + this.port + '/' + this.appName
    });
    response.end();
};

TMPBuilderProxy.prototype.sendFile = function (file, response) {
    response.write(JSON.stringify(file), encoding = 'utf8');
    response.end();
};

TMPBuilderProxy.prototype.deliver = function (response, _path) {

    var _pr = _path.split('/')[0];
    var file = _path.split('tmpbuilder/').join('');

//    console.log(file);
    var filePath = '/Users/mway/Dropbox/masterthesis/git/tmp-builder/';

//    console.log(_pr + ' !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

    var deliver;

    if (_pr == 'tmpbuilder' && file === 'tmpbuilder') {
        deliver = filePath + 'index.html';
    } else {
        deliver = filePath + '/tmpbuilder/' + file;
    }


    var extname = path.extname(deliver);
    var contentType = 'text/html';
    //console.log('extname ' + extname);
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
    }


    path.exists(deliver, function (exists) {
        //sconsole.log(deliver + ' ' + exists);
        if (exists) {
            fs.readFile(deliver, function (error, content) {
                if (error) {
                    console.log(error);
                    response.writeHead(500);
                    response.end();
                }
                else {
                    response.writeHead(200, { 'Content-Type':contentType });
                    response.end(content, 'utf-8');
                }
            });
        }
        else {
            response.writeHead(404);
            response.end();
        }
    });
}