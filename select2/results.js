'use strict';
var $ = require('jquery');
var _findIndex = require('lodash/findIndex')

function Results() {}

module.exports = Results;


/* Results Model paths:
     message
     loading
     results
     highlighted
*/
Results.prototype.view = __dirname + "/results.html";

Results.prototype.init = function(model) {
    this.core = this.parent; // alias to make it more obvious
    this.options = model.at("options");

    model.ref("options", this.core.model.at("options"));
    model.ref("results", this.core.model.at("results"));
    model.ref("selections", this.core.model.at("selections"));
};

// called on open
Results.prototype.create = function(model, dom) {
    this.$results = $(this.results);
    this.bind(this.core);

    this.ensureHighlightVisible();
};

/* A message can be a function and have arguments, so params is an object with attributes
message and args. */
Results.prototype.displayMessage = function(params) {
    this.hideLoading();

//    var message = this.options.get('translations').get(params.message);

    /*this.model.set("message", message(params.args));*/
    this.model.set("message", "nothing here");
};

Results.prototype.hideMessages = function() {
    this.model.del("message");
};


Results.prototype.highlightFirstItem = function () {
    var highlight;
    var selections = this.model.get('selections');

    // Check if there are any selected results
    if (selections.length > 0) {
        // If there are selected results, highlight the first
        highlight = selections[0];
    } else {
        // If there are no selected results, highlight the first option in the dropdown
        highlight = this.model.get('results')[0];
    }

    this.model.set('highlighted', highlight);
    this.ensureHighlightVisible();
};

Results.prototype.showLoading = function(params) {
    /*var loadingMore = this.options.get('translations').get('searching');
    this.model.set("loading", loadingMore(params));*/
    this.model.set("loading", "loading...");
};

Results.prototype.hideLoading = function() {
    this.model.del("loading");
};

Results.prototype.bind = function(core) {
    var self = this;

    var queryFn = function(params) {
        self.hideMessages();
        self.showLoading(params);
    };

    var queryEndFn = function(params) {
        self.hideLoading();
        self.highlightFirstItem();
    };

    // no real need for the following two--except to trigger mouseenter...
    var selectFn = function() {
        self.highlightFirstItem();
    };

    var unselectFn = function() {
        self.highlightFirstItem();
    };

    var results_previousFn = function() {
        var highlighted = self.model.get('highlighted');
        var results = self.model.get('results');

        var currentIndex = _findIndex(results, ['item', highlighted.item]);

        // If we are already at the top, don't move further
        if (currentIndex === 0) {
            return;
        }

        var nextIndex = currentIndex - 1;

        // If none are highlighted, highlight the first
        if (highlighted === undefined) {
            nextIndex = 0;
        }

        self.model.set('highlighted', results[nextIndex]);
        self.ensureHighlightVisible();
    };

    var results_nextFn = function() {
        var highlighted = self.model.get('highlighted');
        var results = self.model.get('results');

        var currentIndex = _findIndex(results, ['item', highlighted.item]);

        var nextIndex = currentIndex + 1;

        // If we are at the last option, stay there
        if (nextIndex >= results.length) {
            return;
        }

        self.model.set('highlighted', results[nextIndex]);
        self.ensureHighlightVisible();
    };

    var results_messageFn = function(params) {
        self.displayMessage(params);
    };

    var results_toggleFn = function() {
        var highlighted = self.model.get('highlighted');
        self.select(highlighted);
    };

    var results_selectFn = function() {
        var highlighted = self.model.get('highlighted');
        self.select(highlighted);
    };


    core.on('query', queryFn);
    core.on('queryEnd', queryEndFn);
    core.on('select', selectFn);
    core.on('unselect', unselectFn);
    core.on('results:previous', results_previousFn);
    core.on('results:next', results_nextFn);

    core.on('results:message', results_messageFn);

    core.on('results:toggle', results_toggleFn);
    core.on('results:select', results_selectFn);

    this.on('destroy', function () {
        core.removeListener('query', queryFn);
        core.removeListener('queryEnd', queryEndFn);
        core.removeListener('select', selectFn);
        core.removeListener('unselect', unselectFn);
        core.removeListener('results:previous', results_previousFn);
        core.removeListener('results:next', results_nextFn);

        core.removeListener('results:message', results_messageFn);

        core.removeListener('results:toggle', results_toggleFn);
        core.removeListener('results:select', results_selectFn);
    });
};

Results.prototype.select = function(data, evt) {
    if (!data || data.children || data.disabled) return;

    if (data.selected) {
        if (this.options.get('multiple')) {
            this.emit('unselect', {
                originalEvent: evt,
                item: data.item     // TODO: with duplicates we don't know pos, so choose the last
            });
        } else {
            this.emit('close', {}); // do nothing in single selection if already selected
        }
    } else {
        this.emit('select', {
            originalEvent: evt,     // TODO: check if originalEvent can actually be used (see CloseOnSelect)
            item: data.item
        });
    }
};

// data is the normalized item from "results" model path
Results.prototype.highlight = function(data, evt) {
    if (data.children || data.disabled) return;

    this.model.set("highlighted", data);
};


Results.prototype.ensureHighlightVisible = function(currentIndex) {
    var highlighted = this.model.get('highlighted');

    if (highlighted === undefined) {
        return;
    }

    if (currentIndex === undefined) {
        var results = this.model.get('results');
        var currentIndex = _findIndex(results, ['item', highlighted.item]);
    }

    if (currentIndex <= 2) {
        this.$results.scrollTop(0);
        return;
    }

    var $highlighted = this.$results.find('.select2-results__option--highlighted');

    var resultsOffset = this.$results.offset().top;
    var highlightedOffset = $highlighted.offset().top;

    // distance of $highlighted from top of visible dropdown area
    var offsetDelta = highlightedOffset - resultsOffset;


    if (offsetDelta > this.$results.outerHeight() - $highlighted.outerHeight(false) || offsetDelta < 0) {
        // scrollTop: number of hidden pixels of dropdown
        // nextOffset: setting scrollTop to this means the item will be the first in the dropdown
        var nextOffset = this.$results.scrollTop() + offsetDelta;

        // don't jump all the way to the top, keep the two previous elements visible
        nextOffset -= $highlighted.outerHeight(false) * 2;

        this.$results.scrollTop(nextOffset);
    }
};
