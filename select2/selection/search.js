'use strict';

var $ = require('jquery');
var KEYS = require('../keys');

/**
 * Component to input search queries. Simply not shown when core is disabled, and will delegate focus, so no tabindex
 * neccessary.
 *
 * Emitted events: keypress, query, unselect
 */
function Search() {}

module.exports = Search;

Search.prototype.view = __dirname + '/search.html';

Search.prototype.init = function(model) {
};

Search.prototype.create = function(model, dom) {
    this.$search = $(this.search);
    this.bind(this.parent.core);

    this.search.focus();
};

Search.prototype.bind = function(core) {
    var self = this;

    var focus = function() {
        self.search.focus();
    }

    var close = function() {
        self.$search.val('');
        self.$search.removeAttr('aria-activedescendant');
        if (core.hasFocus())
            self.search.focus();
    }

    var results_focus = function (params) {
        self.$search.attr('aria-activedescendant', params.id);
    }

    core.on('open', focus);
    core.on('focus', focus);
    core.on('close', close);
    core.on('results:focus', results_focus);


    this.on('destroy', function () {
        core.removeListener('open', focus);
        core.removeListener('focus', focus);
        core.removeListener('close', close);
        core.removeListener('results:focus', results_focus);
    });

    this.search.addEventListener('keypress', function(evt) {
        evt.stopPropagation();

        self.emit('keypress', evt);

        self._keyUpPrevented = evt.defaultPrevented;

        var key = evt.which;

        if (key === KEYS.BACKSPACE && self.$search.val() === '') {
            self.searchRemoveChoice();
            evt.preventDefault();
        }
    });

    this.search.addEventListener('input', function(evt) {
        var key = evt.which;

        // We can freely ignore events from modifier keys
        if (key == KEYS.SHIFT || key == KEYS.CTRL || key == KEYS.ALT) {
            return;
        }

        // Tabbing will be handled during the `keydown` phase
        if (key == KEYS.TAB) {
            return;
        }

        self.handleSearch();
    });
};


// this method will only be called by the placeholder decoration (if it is used)
Search.prototype.createPlaceholder = function(decorated, placeholder) {
    this.$search.attr('placeholder', placeholder.text);
};

Search.prototype.handleSearch = function() {
    this.resizeSearch();

    if (!this._keyUpPrevented) {
        var input = this.$search.val();

        console.log("search: emit query")
        this.emit('query', {
            term: input
        });
    }

    this._keyUpPrevented = false;
};

Search.prototype.searchRemoveChoice = function() {
    this.emit('unselect', {
        // not passing any data removes the last choice and emits unselected
    });

    this.handleSearch();
};

// TODO: not called by anyone! should only be called by Backspace unselection!
//
// put the text representation of the last unselected item into the search
Search.prototype.unselected = function(decorated, item) {
    this.$search.val(item.text); // TODO  grmbl - normalize in general?
};

Search.prototype.resizeSearch = function() {
    var width = '';

    // if (this.$search.attr('placeholder') !== '') {
    //     width = this.$selection.find('.select2-selection__rendered').innerWidth();
    // } else {
        var minimumWidth = this.$search.val().length + 1;

        width = (minimumWidth * 0.75) + 'em';
    // }

    this.$search.css('width', width);

    // TODO: try this too:
    //this.$search.prop('size', this.$search.val().length);
};
