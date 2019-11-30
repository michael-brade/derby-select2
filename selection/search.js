import path from 'path';
import KEYS from '../keys';

/**
 * Component to input search queries. Simply not shown when core is disabled, and will delegate focus, so no tabindex
 * necessary.
 *
 * Emitted events: query, unselect
 */
export default class Search
{
    static view = {
        is: 'search',
        file: path.join(__dirname, 'search.html')
    }

    init(model) {
        model.ref("highlighted", this.parent.model.at("highlighted"));
        this.options = this.parent.options;
    }

    create(model, dom) {
        this.$search = $(this.search);
        this.bind(this.parent.core);
    }

    bind(core) {
        const focus = () => {
            this.search.focus();
        };

        const close = () => {
            this.$search.val('');
        };

        core.on('open', focus);
        core.on('focus', focus);
        core.on('close', close);

        this.on('destroy', () => {
            core.removeListener('open', focus);
            core.removeListener('focus', focus);
            core.removeListener('close', close);
        });


        this.search.addEventListener('keydown', evt => {
            const key = evt.which;

            if (key === KEYS.BACKSPACE && this.$search.val() === '') {
                evt.stopPropagation();
                evt.preventDefault();
                this.searchRemoveChoice();
            }
        });

        // input event: emitted only when query string has changed
        this.search.addEventListener('input', evt => {
            this.handleSearch();
        });
    }

    // this method will only be called by the placeholder decoration (if it is used)
    createPlaceholder(decorated, placeholder) {
        this.$search.attr('placeholder', placeholder.text);
    }

    clearSearch() {
        this.$search.val('');
        this.handleSearch();
    }

    handleSearch() {
        this.resizeSearch();

        this.emit('query', {
            term: this.$search.val()
        });
    }

    searchRemoveChoice() {
        this.emit('unselect', {
            // not passing any data removes the last choice and emits unselected
        });

        this.handleSearch();
    }

    // put the text representation of the last unselected item into the search
    unselected(normalized) {
        this.$search.val(normalized.text);
    }

    resizeSearch() {
        let width = '';

        // if (this.$search.attr('placeholder') !== '') {
        //     width = this.$selection.find('.select2-selection__rendered').innerWidth();
        // } else {
            const minimumWidth = this.$search.val().length + 1;

            width = `${minimumWidth * 0.75}em`;
        // }

        this.$search.css('width', width);

        // TODO: try this too:
        //this.$search.prop('size', this.$search.val().length);
    }
}
