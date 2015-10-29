'use strict';

module.exports = MultipleReorderSelection

/**
 *  MultipleReorderSelection: allow reodering a selection via drag&drop
 */
function MultipleReorderSelection() {}

// MultipleReorderSelection.prototype.init = function(decorated, model) {
//     decorated.call(this, model);
// };

MultipleReorderSelection.prototype.create = function(decorated, model, dom) {
    decorated.call(this, model, dom);

    require('jquery.sortable');
    var $selection = this.$selection.find('.select2-selection__rendered');

    var _this = this;
    $selection.sortable({
        animation: 200,
        filter: '.select2-search',
        onStart: function(evt) {},
        onEnd: function(evt) {},
        onMove: function(evt) {
            return evt.related.className.indexOf('select2-search') === -1;
        },
        onUpdate: function(evt) {
            if (evt.oldIndex === evt.newIndex) {
                return;
            }

            _this.emit('move', {
                originalEvent: evt,
                oldIndex: evt.oldIndex,
                newIndex: evt.newIndex
            });
        }
    });
};
