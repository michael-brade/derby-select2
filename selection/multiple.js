'use strict';

var path = require('path');
var util = require('util');

var BaseSelection = require('./base');
var MultipleReorderSelection = require('./multiplereorder');
var Utils = require('../utils');


function MultipleSelection() {
    MultipleSelection.super_.apply(this, arguments);
}

module.exports = MultipleSelection;

util.inherits(MultipleSelection, BaseSelection);


MultipleSelection.prototype.view = path.join(__dirname, 'multiple.html');

MultipleSelection.prototype.init = function(model) {
    MultipleSelection.super_.prototype.init.apply(this, arguments);

    Utils.decorateObject(this, MultipleReorderSelection);
}

MultipleSelection.prototype.create = function(model, dom) {
    MultipleSelection.super_.prototype.create.apply(this, arguments);

    var self = this;
    this.selection.addEventListener('mouseup', function(evt) {
        self.emit('toggle', {
            originalEvent: evt
        });
    });

    this.search.on('query', function(params) {
        self.emit('query', params);
    });

    this.search.on('unselect', function(params) {
        self.emit('unselect', params);
    });

    this.core.dataAdapter.on('unselected', function(params) {
        self.search.unselected(params);
    });


    this.core.on('select', function(params) {
        self.search.clearSearch();
    });

    this.core.on('unselect', function(params) {
        self.search.clearSearch();
    });
}

// called by the view when clicking the "x" of an item
MultipleSelection.prototype.unselect = function(evt, normalized, pos) {
    if (this.options.get('disabled')) {
        return;
    }

    this.emit('unselect', {
        originalEvent: evt,
        item: normalized.item,
        pos: pos
    });

    // TODO: make propagation configurable
    evt.stopPropagation();
}
