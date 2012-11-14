var Style = require('../lib/color');

exports.log = function(message){
    console.log(Style.blue('debug message: ') + Style.yellow(message));
};

exports.getUrl = function(){
    return '__espresso_debug_console__';
};