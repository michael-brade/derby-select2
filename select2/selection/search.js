var $ = require('jquery');
var Utils = require('../utils');
var KEYS = require('../keys');

/* Decoration for multi-selection: search field in the selection display */
function Search() {}

module.exports = Search;

Search.prototype.create = function(decorated, model, dom) {
    decorated.call(this, model, dom);

    this.$search = $(this.search);
};

Search.prototype.bind = function(decorated, container) {
    this._transferTabIndex();

    var self = this;
    this.container = container;

    decorated.call(this, container);

    container.on('open', function() {
        self.$search.trigger('focus');
    });

    container.on('close', function() {
        self.$search.val('');
        self.$search.trigger('focus');
    });

    container.on('enable', function() {
        self.$search.prop('disabled', false);

        self._transferTabIndex();
    });

    container.on('disable', function() {
        self.$search.prop('disabled', true);
    });

    container.on('focus', function(evt) {
        self.$search.trigger('focus');
    });

    this.$selection.on('focusin', '.select2-search--inline', function(evt) {
        self.emit('focus', evt);
    });

    this.$selection.on('focusout', '.select2-search--inline', function(evt) {
        self._handleBlur(evt);
    });

    this.$selection.on('keydown', '.select2-search--inline', function(evt) {
        evt.stopPropagation();

        self.emit('keypress', evt);

        self._keyUpPrevented = evt.isDefaultPrevented();

        var key = evt.which;

        if (key === KEYS.BACKSPACE && self.$search.val() === '') {
            self.searchRemoveChoice();
            evt.preventDefault();
        }
    });

    // Workaround for browsers which do not support the `input` event
    // This will prevent double-triggering of events for browsers which support
    // both the `keyup` and `input` events.
    this.$selection.on(
        'input.searchcheck',
        '.select2-search--inline',
        function(evt) {
            // Try to detect the IE version should the `documentMode` property that
            // is stored on the document. This is only implemented in IE and is
            // slightly cleaner than doing a user agent check.
            // This property is not available in Edge, but Edge also doesn't have
            // this bug.
            var msie = document.documentMode;

            // IE will trigger the `input` event when a placeholder is used on a
            // search box. To get around this issue, we are forced to ignore all
            // `input` events in IE and keep using `keyup`.
            if (msie && msie <= 11) {
                self.$selection.off('input.search input.searchcheck');
                return;
            }

            // Unbind the duplicated `keyup` event
            self.$selection.off('keyup.search');
        }
    );

    this.$selection.on(
        'keyup.search input.search',
        '.select2-search--inline',
        function(evt) {
            var key = evt.which;

            // We can freely ignore events from modifier keys
            if (key == KEYS.SHIFT || key == KEYS.CTRL || key == KEYS.ALT) {
                return;
            }

            // Tabbing will be handled during the `keydown` phase
            if (key == KEYS.TAB) {
                return;
            }

            self.container.open();
            self.handleSearch(evt);
        }
    );
};

/**
 * This method will transfer the tabindex attribute from the rendered
 * selection to the search box. This allows for the search box to be used as
 * the primary focus instead of the selection container.
 *
 * @private
 */
Search.prototype._transferTabIndex = function(decorated) {
    this.$search.attr('tabindex', this.$selection.attr('tabindex'));
    this.$selection.attr('tabindex', '-1');
};

// this method will only be called by the placeholder decoration (if it is used)
Search.prototype.createPlaceholder = function(decorated, placeholder) {
    this.$search.attr('placeholder', placeholder.text);
};

Search.prototype.handleSearch = function() {
    this.resizeSearch();

    if (!this._keyUpPrevented && this.container.isOpen()) {
        var input = this.$search.val();

        this.emit('query', {
            term: input
        });
    }

    this._keyUpPrevented = false;
};

Search.prototype.searchRemoveChoice = function() {
    this.emit('unselect', {});  // not passing any data removes the last choice and emits unselected
    this.emit('open', {});

    this.handleSearch();
};

Search.prototype.unselected = function(decorated, item) {
    this.$search.val(item.text); // TODO  grmbl - normalize in general?
};

Search.prototype.resizeSearch = function() {
    this.$search.css('width', '25px');

    var width = '';

    if (this.$search.attr('placeholder') !== '') {
        width = this.$selection.find('.select2-selection__rendered').innerWidth();
    } else {
        var minimumWidth = this.$search.val().length + 1;

        width = (minimumWidth * 0.75) + 'em';
    }

    this.$search.css('width', width);
};
