'use strict';
var util = require('util');
var BaseSelection = require('./base');


function SingleSelection() {
    SingleSelection.super_.apply(this, arguments);
}

module.exports = SingleSelection;

util.inherits(SingleSelection, BaseSelection);


SingleSelection.prototype.view = __dirname + '/single.html';

SingleSelection.prototype.create = function(model, dom) {
    SingleSelection.super_.prototype.create.apply(this, arguments);

    var self = this;
    this.$selection.on('mousedown', function(evt) {
        // Only respond to left clicks
        if (evt.which !== 1) {
            return;
        }

        self.emit('toggle', {
            originalEvent: evt
        });
    });

    container.on('focus', function (evt) {
        if (!container.isOpen()) {
            self.$selection.focus();
        }
    });
}
