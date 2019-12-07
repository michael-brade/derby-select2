import Sortable from 'sortablejs';

/**
 *  MultipleReorderSelection: allow reordering a selection via drag&drop
 */
export default (superclass) => class extends superclass
{
    create(model, dom) {
        if (super.create)
            super.create(model, dom);

        this.$selection.on('mousedown', '.select2-selection__choice', evt => {
            evt.stopPropagation();  // stop the event from being cancelled by core so that dragging becomes possible...
        });

        this.selection.addEventListener('mouseup', evt => {
            // ...but focus again on mouseup
            this.core.focus();
        });

        const sortable = Sortable.create(this.selection.getElementsByClassName('select2-selection__rendered')[0], {
            animation: 200,
            filter: '.select2-search',
            preventOnFilter: false,
            disabled: this.core.options.get('disabled'),
            onEnd: evt => {
                this.core.focus();
            },
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

        this.core.on('enable', () => sortable.option('disabled', false));
        this.core.on('disable', () => sortable.option('disabled', true));
    }
}
