﻿import references = require('references');
import assert = require('assert');
import _ = require('./util');
import pipeline = require('./pipeline');
import fiberPoolFix = require('./mods/fiberPoolFix');
import coroPool = require('./mods/coroPool');
import cpsKeyword = require('./mods/cpsKeyword');
import maxSlots = require('./mods/maxSlots');
import Mod = AsyncAwait.Mod;


/** Get or set global configuration values. */
export var config: AsyncAwait.Config = <any> function config() {

    // If called as a getter, return a reference to the options object.
    if (arguments.length === 0) return _options;

    // Reject operation if this subsystem is now locked.
    assert(!isLocked, 'config: cannot alter config after first async(...) call');

    // Merge the given value's own properties into the options object.
    _.mergeProps(_options, arguments[0]);
}


/** Register the specified mod and add its default options to current config. */
config.mod = function use(mod: Mod) {

    // Reject operation if this subsystem is now locked.
    assert(!isLocked, 'use: cannot register mods after first async(...) call');

    // Ensure mods are registered only once.
    assert(externalMods.indexOf(mod) === -1, 'use: mod already registered');

    // Add the mod to the list.
    externalMods.push(mod);

    // Incorporate the mod's default options, if any.
    _.mergeProps(_options, mod.defaultOptions);
}


/** Apply all registered mods and lock the subsystem against further changes. */
export function applyMods() {

    // Reject operation if this subsystem is now locked.
    assert(!isLocked, 'applyMods: mods already applied');

    // Create a combined mod list in the appropriate order.
    var allMods: Mod[] = externalMods.concat(internalMods);

    // Restore the pipeline to its default state.
    pipeline.restoreDefaults();

    // Apply all mods in reverse order of registration. This ensures that mods
    // registered earliest remain outermost in pipeline call chains, which is the
    // design intention.
    for (var i = allMods.length - 1; i >= 0; --i) {
        var mod = allMods[i];
        var pipelineBeforeMod = _.mergeProps({}, pipeline);
        var pipelineOverrides = (mod.overridePipeline || <any> _.empty)(pipelineBeforeMod, _options);
        _.mergeProps(pipeline, pipelineOverrides);
        if (mod.apply) mod.apply(_options);
    }

    // Lock the subsystem against further changes.
    isLocked = true;
}


/**
 *  Reset all registered mods and return the subsystem to an unlocked state. This
 *  method is primarily used for unit testing of mods and the extensibility system.
 */
export function resetMods() {

    // Call each registered mod's reset() function, if present.
    var allMods = externalMods.concat(internalMods);
    allMods.forEach(mod => { if (mod.reset) mod.reset(); });

    // Clear all external mod registrations.
    externalMods = [];

    // Restore options to its initial state.
    _options = { };
    internalMods.forEach(mod => _.mergeProps(_options, mod.defaultOptions));

    // Restore the default pipeline.
    pipeline.restoreDefaults();

    // Unlock the subsystem.
    isLocked = false;
}


/** Built-in mods that are always applied. Order is important. */
export var internalMods = [ cpsKeyword, maxSlots, coroPool, fiberPoolFix ];


/** Mods that have been explicitly registered via use(...). */
export var externalMods = [];


/**
 *  This flag is set to true when all mods have been applied. Once it is set
 *  subsequent mod/config changes are not allowed. Calling reset() sets this
 *  flag back to false.
 */
export var isLocked = false;


/** Global options hash accessed by the config() getter/getter function. */
//TODO: make this GLOBAL to prevent errors where process has multiple asyncawaits loaded
//TODO: then, pass options to both apply and reset, and have mods put ALL their state in there?
var _options = { };
internalMods.forEach(mod => _.mergeProps(_options, mod.defaultOptions));