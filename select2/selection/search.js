'use strict';

var $ = require('jquery');
var KEYS = require('../keys');

/**
 * Component to input search queries. Simply not shown when core is disabled, and will delegate focus, so no tabindex
 * neccessary.
 *
 * Emitted events: query, unselect
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


    this.search.addEventListener('keydown', function(evt) {
        var key = evt.which;

        if (key === KEYS.BACKSPACE && self.$search.val() === '') {
            evt.stopPropagation();
            evt.preventDefault();
            self.searchRemoveChoice();
        }
    });

    // input event: emitted only when query string has changed
    this.search.addEventListener('input', function(evt) {
        self.handleSearch();
    });
};


// this method will only be called by the placeholder decoration (if it is used)
Search.prototype.createPlaceholder = function(decorated, placeholder) {
    this.$search.attr('placeholder', placeholder.text);
};

Search.prototype.clearSearch = function() {
    this.$search.val('');
    this.handleSearch();
}

Search.prototype.handleSearch = function() {
    this.resizeSearch();

    this.emit('query', {
        term: this.$search.val()
    });
};

Search.prototype.searchRemoveChoice = function() {
    this.emit('unselect', {
        // not passing any data removes the last choice and emits unselected
    });

    this.handleSearch();
};

// put the text representation of the last unselected item into the search
Search.prototype.unselected = function(normalized) {
    this.$search.val(normalized.text);
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
