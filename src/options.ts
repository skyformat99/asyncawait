﻿import references = require('references');
import _ = require('./util');
export = options;


// TODO:...
function options(value?: any): any {

    //TODO: as getter...
    if (arguments.length === 0) return _options;

    //TODO: as setter...
    _.mergeProps(_options, value);
    // 1. merge
    // 2. reload all joint/async/await mods
}




//TODO: expose this as non-enum 'private' property on _options...
function clear() {
    _options = {};
}


// TODO: side-effect
clear();


// TODO: private impl
var _options;