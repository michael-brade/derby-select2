'use strict';
var util = require('util');
var BaseSelection = require('./base');


function MultipleSelection() {
    MultipleSelection.super_.apply(this, arguments);
}

module.exports = MultipleSelection;

util.inherits(MultipleSelection, BaseSelection);


MultipleSelection.prototype.view = __dirname + '/multiple.html';

MultipleSelection.prototype.create = function(model, dom) {
    MultipleSelection.super_.prototype.create.apply(this, arguments);

    var self = this;
    this.selection.on('click', function(evt) {
        self.emit('toggle', {
            originalEvent: evt
        });
    });
}

MultipleSelection.prototype.unselect = function(evt, data, pos) {
    if (this.options.get('disabled')) {
        return;
    }

    this.emit('unselect', {
        originalEvent: evt,
        data: data,
        pos: pos
    });

    // TODO: probably preventPropagation, otherwise unselect opens the dropdown
}
