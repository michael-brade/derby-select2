var BaseSelection = require('./base');
var Utils = require('../utils');

function MultipleSelection() {
}

module.exports = MultipleSelection;

Utils.Extend(MultipleSelection, BaseSelection);


MultipleSelection.prototype.create = function(model, dom) {
    MultipleSelection.__super__.create.apply(this, arguments);

    var self = this;
    this.selection.on('click', function(evt) {
        self.emit('toggle', {
            originalEvent: evt
        });
    });
}

MultipleSelection.prototype.unselect = function(evt, data) {
    if (this.options.get('disabled')) {
        return;
    }

    this.emit('unselect', {
        originalEvent: evt,
        data: data
    });

    // TODO: probably preventPropagation, otherwise unselect opens the dropdown
}
