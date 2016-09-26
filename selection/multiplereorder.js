/**
 *  MultipleReorderSelection: allow reodering a selection via drag&drop
 */
export default (superclass) => class extends superclass {

    create(model, dom) {
        if (super.create)
            super.create(model, dom);

        const Sortable = require('Sortable');

        Sortable.create(this.selection.getElementsByClassName('select2-selection__rendered')[0], {
            animation: 200,
            filter: '.select2-search',
            onMove: evt => {
                return evt.related.className.indexOf('select2-search') === -1;
            },
            onSort: evt => {
                if (evt.oldIndex === evt.newIndex) {
                    return;
                }

                // temporarily undo Sortable changes...
                const parent = evt.item.parentElement;
                let sibling = parent.getElementsByClassName('select2-selection__choice')[evt.oldIndex];

                if (evt.oldIndex > evt.newIndex) {
                    sibling = sibling.nextSibling;
                }

                parent.insertBefore(evt.item, sibling);

                // ...now Derby will redo it natively
                this.emit('move', {
                    originalEvent: evt,
                    oldIndex: evt.oldIndex,
                    newIndex: evt.newIndex
                });
            }
        });
    }
}
