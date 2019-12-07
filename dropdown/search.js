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
        model.ref("highlighted", this.parent.model.at("highlighted"));
        this.options = this.parent.options;
    }

    create(model, dom) {
        this.$search = $(this.search);
        this.bind(this.parent.core);

        this.$search.attr('aria-controls', this.parent.core.id + '-results');

        this.$search.trigger('focus');
    }

    bind(core) {
        this.$search.on('keydown', evt => {
            this.emit('keypress', evt);

            this._keyUpPrevented = evt.isDefaultPrevented();
        });

        // Workaround for browsers which do not support the `input` event
        // This will prevent double-triggering of events for browsers which support
        // both the `keyup` and `input` events.
        this.$search.on('input', function(evt) {
            // Unbind the duplicated `keyup` event
            $(this).off('keyup');
        });

        this.$search.on('keyup input', evt => {
            this.handleSearch(evt);
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
        if (!this._keyUpPrevented) {
            var input = this.$search.val();

            this.emit('query', {
                term: input
            });
        }

        this._keyUpPrevented = false;
    }
}
