var $ = require('jquery');
var BaseSelection = require('./base');
var Utils = require('../utils');

function MultipleSelection() {
    MultipleSelection.__super__.constructor.apply(this, arguments);
}

module.exports = MultipleSelection;

Utils.Extend(MultipleSelection, BaseSelection);


MultipleSelection.prototype.bind = function(container) {
    var self = this;

    MultipleSelection.__super__.bind.apply(this, arguments);

    this.$selection.on('click', function(evt) {
        self.emit('toggle', {
            originalEvent: evt
        });
    });

    this.$selection.on(
        'click',
        '.select2-selection__choice__remove',
        function(evt) {
            // Ignore the event if it is disabled
            if (self.options.get('disabled')) {
                return;
            }

            var $remove = $(this);
            var $selection = $remove.parent();

            var data = $selection.data('data');

            self.emit('unselect', {
                originalEvent: evt,
                data: data
            });
        }
    );
};

MultipleSelection.prototype.clear = function() {
    this.$selection.find('.select2-selection__rendered').empty();
};

MultipleSelection.prototype.display = function(data, container) {
    var template = this.options.get('templateSelection');
    var escapeMarkup = this.options.get('escapeMarkup');

    return escapeMarkup(template(data, container));
};

MultipleSelection.prototype.selectionContainer = function() {
    var $container = $(
        '<li class="select2-selection__choice">' +
        '<span class="select2-selection__choice__remove" role="presentation">' +
        '&times;' +
        '</span>' +
        '</li>'
    );

    return $container;
};

MultipleSelection.prototype.update = function(data) {
    this.clear();

    if (data.length === 0) {
        return;
    }

    var $selections = [];

    for (var d = 0; d < data.length; d++) {
        var selection = data[d];

        var $selection = this.selectionContainer();
        var formatted = this.display(selection, $selection);

        $selection.append(formatted);
        $selection.prop('title', selection.title || selection.text);

        $selection.data('data', selection);

        $selections.push($selection);
    }

    var $rendered = this.$selection.find('.select2-selection__rendered');

    Utils.appendMany($rendered, $selections);
};
