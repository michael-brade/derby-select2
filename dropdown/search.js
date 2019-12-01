import path from 'path';
var $ = require('jquery');

export default class Search
{
    static view = {
        is: 'dropdown:search',
        file: path.join(__dirname, 'search.html')
    }

    init(model) {
        this.options = this.parent.options;
    }

    create(model, dom) {
        this.$search = $(this.search);
        this.$searchContainer = $(this.searchContainer);
        this.bind(this.parent.core);
    }

    bind(core) {
        var self = this;

        var resultsId = core.id + '-results';

        this.$search.on('keydown', function(evt) {
            self.emit('keypress', evt);

            self._keyUpPrevented = evt.isDefaultPrevented();
        });

        // Workaround for browsers which do not support the `input` event
        // This will prevent double-triggering of events for browsers which support
        // both the `keyup` and `input` events.
        this.$search.on('input', function(evt) {
            // Unbind the duplicated `keyup` event
            $(this).off('keyup');
        });

        this.$search.on('keyup input', function(evt) {
            self.handleSearch(evt);
        });

        core.on('open', function() {
            self.$search.attr('tabindex', 0);
            self.$search.attr('aria-controls', resultsId);

            self.$search.trigger('focus');

            window.setTimeout(function() {
                self.$search.trigger('focus');
            }, 0);
        });

        core.on('close', function() {
            self.$search.attr('tabindex', -1);
            self.$search.removeAttr('aria-controls');
            self.$search.removeAttr('aria-activedescendant');

            self.$search.val('');
            self.$search.trigger('blur');
        });

        core.on('focus', function() {
            if (!core.isOpen()) {
                self.$search.trigger('focus');
            }
        });

        core.on('results:all', function(params) {
            if (params.query.term == null || params.query.term === '') {
                var showSearch = self.showSearch(params);

                if (showSearch) {
                    self.$searchContainer.removeClass('select2-search--hide');
                } else {
                    self.$searchContainer.addClass('select2-search--hide');
                }
            }
        });

        core.on('results:focus', function(params) {
            if (params.data._resultId) {
                self.$search.attr('aria-activedescendant', params.data._resultId);
            } else {
                self.$search.removeAttr('aria-activedescendant');
            }
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

    showSearch(_, params) {
        return true;
    }
}
