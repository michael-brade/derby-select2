import path from 'path';
import $ from 'jquery';

/**
 * Search input in the dropdown, usually only for single selection mode.
 * Since it is part of the dropdown, which shows directly on open, it cannot (doesn't need to) receive
 * an open event from core. Simply use create as open, destroy as close.
 */
export default class Search
{
    static view = {
        is: 'dropdown:search',
        file: path.join(__dirname, 'search.html')
    }

    init(model) {
        this.options = this.parent.options;
        model.ref("options",     this.parent.model.at("options"));
        model.ref("highlighted", this.parent.model.at("highlighted"));
    }

    create(model, dom) {
        this.$search = $(this.search);
        this.bind(this.parent.core);

        this.$search.attr('aria-controls', this.parent.core.id + '-results');

        this.$search.trigger('focus');
    }

    bind(core) {
        this.model.on('change', 'filter', (value, prev) => {
            if (value === prev) return;
            this.handleSearch();
        });

        // bind to core events

        const focus = () => {
            this.$search.trigger('focus');
        };

        core.on('focus', focus);

        this.on('destroy', () => {
            core.removeListener('focus', focus);
        });
    }

    handleSearch(evt) {
        this.emit('query', {
            term: this.model.get('filter')
        });
    }
}
