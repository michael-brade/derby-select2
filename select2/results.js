'use strict';
var $ = require('jquery');


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

    model.ref("options", this.core.model.at("options"));
    model.ref("results", this.core.model.at("results"));
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

    var message = this.options.get('translations').get(params.message);

    this.model.set("message", message(params.args));
};

Results.prototype.hideMessages = function() {
    this.model.del("message");
};


// hmm... maybe do it in selection base.js?
Results.prototype.selected = function(data, selections) {
    if (data.id && !data.children && !data.disabled) {
        if (data in selections) { // TODO
            return 'true';
        } else {
            return 'false';
        }
    }
};


Results.prototype.highlightFirstItem = function () {
    var $options = this.$results
        .find('.select2-results__option[aria-selected]');

    // TODO: do this on model change: data.on("all", ....) and selections.on...
    var $selected = $options.filter('[aria-selected=true]');

    // Check if there are any selected options
    if ($selected.length > 0) {
        // If there are selected options, highlight the first
        $selected.first().trigger('mouseenter');
    } else {
        // If there are no selected options, highlight the first option
        // in the dropdown
        $options.first().trigger('mouseenter');
    }

    this.ensureHighlightVisible();
};

Results.prototype.showLoading = function(params) {
    var loadingMore = this.options.get('translations').get('searching');
    this.model.set("loading", loadingMore(params));
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
        var options = self.model.get('results');

        var currentIndex = options.indexOf(highlighted);

        // If we are already at the top, don't move further
        if (currentIndex === 0) {
            return;
        }

        var nextIndex = currentIndex - 1;

        // If none are highlighted, highlight the first
        if (highlighted === null) {
            nextIndex = 0;
        }

        self.model.set('highlighted', options[nextIndex]);
        self.ensureHighlightVisible();
    };

    var results_nextFn = function() {
        var highlighted = self.model.get('highlighted');
        var options = self.model.get('results');

        var currentIndex = options.indexOf(highlighted);

        var nextIndex = currentIndex + 1;

        // If we are at the last option, stay there
        if (nextIndex >= options.length) {
            return;
        }

        self.model.set('highlighted', options[nextIndex]);
        self.ensureHighlightVisible();
    };

    var results_messageFn = function(params) {
        self.displayMessage(params);
    };

    var results_toggleFn = function() {
        var $highlighted = self.getHighlightedResults();

        if ($highlighted.length === 0) {
            return;
        }

        $highlighted.trigger('mouseup');
    };

    var results_selectFn = function() {
        var $highlighted = self.getHighlightedResults();

        if ($highlighted.length === 0) {
            return;
        }

        $highlighted.trigger('mouseup');
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
    if (data.children || data.disabled) return;

    // TODO use another way to determine selection status! use model,
    // then reuse this function for "results:select/toggle" above
    if ($(evt.target).attr('aria-selected') === 'true') {
        if (this.options.get('multiple')) {
            this.emit('unselect', {
                originalEvent: evt,
                data: data          // TODO: with duplicates we don't know pos, so choose the last
            });
        } else {
            this.emit('close', {}); // do nothing in single selection if already selected
        }
    } else if ($(evt.target).attr('aria-selected') === 'false') {
        this.emit('select', {
            originalEvent: evt,     // TODO: check if originalEvent can actually be used (see CloseOnSelect)
            data: data
        });
    }
};

Results.prototype.focus = function(data, evt) {
    if (data.children || data.disabled) return;

    this.model.set("highlighted", data);
};

Results.prototype.getHighlightedResults = function() {
    return this.$results.find('.select2-results__option--highlighted');
};

Results.prototype.ensureHighlightVisible = function() {
    var $highlighted = this.getHighlightedResults();

    if ($highlighted.length === 0) {
        return;
    }

    var $options = this.$results.find('[aria-selected]');

    var currentIndex = $options.index($highlighted);

    var currentOffset = this.$results.offset().top;
    var nextTop = $highlighted.offset().top;
    var nextOffset = this.$results.scrollTop() + (nextTop - currentOffset);

    var offsetDelta = nextTop - currentOffset;
    nextOffset -= $highlighted.outerHeight(false) * 2;

    if (currentIndex <= 2) {
        this.$results.scrollTop(0);
    } else if (offsetDelta > this.$results.outerHeight() || offsetDelta < 0) {
        this.$results.scrollTop(nextOffset);
    }
};
