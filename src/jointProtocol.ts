﻿import references = require('references');
import JointProtocol = AsyncAwait.JointProtocol;
export = jointProtocol;


//TODO: revise this comment
/**
 *  A hash of functions and properties that are used internally at various
 *  stages of async/await handling. The jointProtocol may be augmented by mods,
 *  which are loaded via the use(...) API method.
 */
var jointProtocol: JointProtocol = <any> { };