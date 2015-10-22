var BaseSelection = require('./base');
var Utils = require('../utils');

function SingleSelection() {
}

module.exports = SingleSelection;

Utils.Extend(SingleSelection, BaseSelection);

SingleSelection.prototype.view = __dirname + '/single.html';

SingleSelection.prototype.create = function(model, dom) {
    SingleSelection.__super__.create.apply(this, arguments);

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
}

// TODO: this should be done in create!
SingleSelection.prototype.bind = function(container) {
    SingleSelection.__super__.bind.apply(this, arguments);

    // TODO check ids
    var id = container.id + '-container';

    this.$selection.find('.select2-selection__rendered').attr('id', id);
    this.$selection.attr('aria-labelledby', id);
};
