'use strict';
var util = require('util');
var BaseSelection = require('./base');
var MultipleReorderSelection = require('./multiplereorder');
var Utils = require('../utils');


function MultipleSelection() {
    MultipleSelection.super_.apply(this, arguments);
}

module.exports = MultipleSelection;

util.inherits(MultipleSelection, BaseSelection);


MultipleSelection.prototype.view = __dirname + '/multiple.html';

MultipleSelection.prototype.init = function(model) {
    MultipleSelection.super_.prototype.init.apply(this, arguments);

    Utils.decorateObject(this, MultipleReorderSelection);
}

MultipleSelection.prototype.create = function(model, dom) {
    MultipleSelection.super_.prototype.create.apply(this, arguments);

    var self = this;
    this.$selection.on('click', function(evt) {
        self.emit('toggle', {
            originalEvent: evt
        });
    });

    // register search events when search is shown (focus)
    this.core.on('focus', function() {
        self.search.on('query', function(params) {
            self.emit('query', params);
        });

        self.search.on('unselect', function(params) {
            self.emit('unselect', params);
        });
    });

    this.core.dataAdapter.on('unselected', function(params) {
        if (self.search)
            self.search.unselected(params);
    });


    this.core.on('select', function(params) {
        if (self.search) {
            self.search.clearSearch();
        }
    });

    this.core.on('unselect', function(params) {
        if (self.search) {
            self.search.clearSearch();
        }
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

    // TODO: probably preventPropagation, otherwise unselect opens the dropdown
}
