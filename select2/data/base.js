'use strict';
var util = require('util');
var EventEmitter = require('events');

// A data adapter takes the available options and selections and turns them into a normalized list.
// It also handles selecting and deselecting items on the data level.
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

BaseAdapter.prototype.unselect = function(params) {
    throw new Error('The `unselect` method must be defined in child classes.');
};



/**
 * All adapters react to select and unselect events, some to query.
 */
BaseAdapter.prototype.bind = function(container) {
    var self = this;

    container.on('query', function(params) {
        self.query(params);
    });

    container.on('select', function(params) {
        self.select(params);
    });

    container.on('unselect', function(params) {
        self.unselect(params);
    });
};
