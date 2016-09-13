'use strict';
var util = require('util');
var EventEmitter = require('events');

// A data adapter takes the available options and selections and turns them into a normalized list.
// It also handles selecting, moving, and deselecting items on the data level.
//
// A data adapter can emit "query" and "queryEnd". Needed in case of AJAX or racer model queries.


function BaseAdapter() {
    BaseAdapter.super_.call(this);
}

module.exports = BaseAdapter;

// Inherit functions from `EventEmitter`'s prototype
util.inherits(BaseAdapter, EventEmitter);


BaseAdapter.prototype.query = function(params) {
    // may be overridden in subclasses
    this.emit("queryEnd", {});
};

BaseAdapter.prototype.select = function(params) {
    throw new Error('The `select` method must be defined in child classes.');
};

BaseAdapter.prototype.move = function(params) {
    throw new Error('The `move` method must be defined in child classes.');
};

/*
    Unselect the item params.data at params.pos. If pos is not given, the last
    selected item equal to params.data is unselected. If neither is given, the
    last selected item is unselected; in that case, an event "unselected" with
    the unselected item as parameter should be fired.
*/
BaseAdapter.prototype.unselect = function(params) {
    throw new Error('The `unselect` method must be defined in child classes.');
};



/**
 * All adapters react to select and unselect events, some to query.
 */
BaseAdapter.prototype.bind = function(core) {
    var self = this;

    core.on('query', function(params) {
        self.query(params);
    });

    core.on('select', function(params) {
        self.select(params);
    });

    core.on('move', function(params) {
        self.move(params);
    });

    core.on('unselect', function(params) {
        self.unselect(params);
    });
};
