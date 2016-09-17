'use strict';

module.exports = MultipleReorderSelection

/**
 *  MultipleReorderSelection: allow reodering a selection via drag&drop
 */
function MultipleReorderSelection() {}


MultipleReorderSelection.prototype.create = function(decorated, model, dom) {
    decorated.call(this, model, dom);
    var _this = this;

    var Sortable = require('Sortable');

    Sortable.create(this.selection.getElementsByClassName('select2-selection__rendered')[0], {
        animation: 200,
        filter: '.select2-search',
        onStart: function(evt) {},
        onEnd: function(evt) {},
        onMove: function(evt) {
            return evt.related.className.indexOf('select2-search') === -1;
        },
        onUpdate: function(evt) {
        },
        onSort: function(evt) {
            if (evt.oldIndex === evt.newIndex) {
                return;
            }

            // temporarily undo Sortable changes...
            var parent = evt.item.parentElement;
            var sibling = parent.getElementsByClassName('select2-selection__choice')[evt.oldIndex];

            if (evt.oldIndex > evt.newIndex) {
                sibling = sibling.nextSibling;
            }

            parent.insertBefore(evt.item, sibling);

            // ...now Derby will redo it natively
            _this.emit('move', {
                originalEvent: evt,
                oldIndex: evt.oldIndex,
                newIndex: evt.newIndex
            });
        }
    });
};
