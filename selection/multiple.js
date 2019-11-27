import path from 'path';
import { mix } from 'mixwith';

import BaseSelection from './base';
import MultipleReorderSelection from './multiplereorder';


export default class MultipleSelection extends mix(BaseSelection).with(MultipleReorderSelection)
{
    static view = {
        is: 'multiple',
        file: path.join(__dirname, 'multiple.html')
    }

    create(model, dom) {
        super.create(arguments);

        this.selection.addEventListener('mouseup', evt => {
            this.emit('toggle', {
                originalEvent: evt
            });
        });

        this.search.on('query', params => {
            this.emit('query', params);
        });

        this.search.on('unselect', params => {
            this.emit('unselect', params);
        });

        this.core.dataAdapter.on('unselected', params => {
            this.search.unselected(params);
        });


        this.core.on('select', params => {
            this.search.clearSearch();
        });

        this.core.on('unselect', params => {
            this.search.clearSearch();
        });
    }

    // called by the view when clicking the "x" of an item
    unselect(evt, normalized, pos) {
        if (this.options.get('disabled')) {
            return;
        }

        this.emit('unselect', {
            originalEvent: evt,
            item: normalized.item,
            pos
        });

        // TODO: make propagation configurable
        evt.stopPropagation();
    }
}
