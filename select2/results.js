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

Results.prototype.create = function(model) {
    require('jquery.mousewheel');

    this.$results = $(this.results);
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

// TODO: man, this should be done in the view, too! set aria-selected to true if
// in selection. But only if duplicates are not allowed.

Results.prototype.setClasses = function() {
    var self = this;

    this.data.current(function(selected) {
        var selectedIds = $.map(selected, function(s) {
            return s.id.toString();
        });

        var $options = self.$results
            .find('.select2-results__option[aria-selected]');

        $options.each(function() {
            var $option = $(this);

            var item = $.data(this, 'data');

            // id needs to be converted to a string when comparing
            var id = '' + item.id;

            if ((item.element != null && item.element.selected) ||
                (item.element == null && $.inArray(id, selectedIds) > -1)) {
                $option.attr('aria-selected', 'true');
            } else {
                $option.attr('aria-selected', 'false');
            }
        });

    });
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

    core.on('query', function(params) {
        self.hideMessages();
        self.showLoading(params);

        if (core.isOpen()) {
            self.setClasses();
        }
    });

    core.on('queryEnd', function(params) {
        self.hideLoading();

        if (core.isOpen()) {
            self.setClasses();
            self.highlightFirstItem();
        }
    });

    // no real need for the following two--except to trigger mouseenter...
    core.on('select', function() {
        if (!core.isOpen()) return;

        self.setClasses();
        self.highlightFirstItem();
    });

    core.on('unselect', function() {
        if (!core.isOpen()) return;

        self.setClasses();
        self.highlightFirstItem();
    });

    core.on('open', function() {
        // When the dropdown is open, aria-expended="true"
        self.$results.attr('aria-expanded', 'true');
        self.$results.attr('aria-hidden', 'false');

        self.setClasses();
        self.ensureHighlightVisible();
    });

    core.on('close', function() {
        // When the dropdown is closed, aria-expended="false"
        self.$results.attr('aria-expanded', 'false');
        self.$results.attr('aria-hidden', 'true');
        self.$results.removeAttr('aria-activedescendant');
    });

    core.on('results:previous', function() {
        var $highlighted = self.getHighlightedResults();

        var $options = self.$results.find('[aria-selected]');

        var currentIndex = $options.index($highlighted);

        // If we are already at te top, don't move further
        if (currentIndex === 0) {
            return;
        }

        var nextIndex = currentIndex - 1;

        // If none are highlighted, highlight the first
        if ($highlighted.length === 0) {
            nextIndex = 0;
        }

        var $next = $options.eq(nextIndex);

        $next.trigger('mouseenter');

        var currentOffset = self.$results.offset().top;
        var nextTop = $next.offset().top;
        var nextOffset = self.$results.scrollTop() + (nextTop - currentOffset);

        if (nextIndex === 0) {
            self.$results.scrollTop(0);
        } else if (nextTop - currentOffset < 0) {
            self.$results.scrollTop(nextOffset);
        }
    });

    core.on('results:next', function() {
        var $highlighted = self.getHighlightedResults();

        var $options = self.$results.find('[aria-selected]');

        var currentIndex = $options.index($highlighted);

        var nextIndex = currentIndex + 1;

        // If we are at the last option, stay there
        if (nextIndex >= $options.length) {
            return;
        }

        var $next = $options.eq(nextIndex);

        $next.trigger('mouseenter');

        var currentOffset = self.$results.offset().top +
            self.$results.outerHeight(false);
        var nextBottom = $next.offset().top + $next.outerHeight(false);
        var nextOffset = self.$results.scrollTop() + nextBottom - currentOffset;

        if (nextIndex === 0) {
            self.$results.scrollTop(0);
        } else if (nextBottom > currentOffset) {
            self.$results.scrollTop(nextOffset);
        }
    });

    core.on('results:message', function(params) {
        self.displayMessage(params);
    });

    // TODO: is this code really needed???
    if ($.fn.mousewheel) {
        this.$results.on('mousewheel', function(e) {
            var top = self.$results.scrollTop();

            var bottom = self.$results.get(0).scrollHeight - top + e.deltaY;

            var isAtTop = e.deltaY > 0 && top - e.deltaY <= 0;
            var isAtBottom = e.deltaY < 0 && bottom <= self.$results.height();

            if (isAtTop) {
                self.$results.scrollTop(0);

                e.preventDefault();
                e.stopPropagation();
            } else if (isAtBottom) {
                self.$results.scrollTop(
                    self.$results.get(0).scrollHeight - self.$results.height()
                );

                e.preventDefault();
                e.stopPropagation();
            }
        });
    }

    core.on('results:toggle', function() {
        var $highlighted = self.getHighlightedResults();

        if ($highlighted.length === 0) {
            return;
        }

        $highlighted.trigger('mouseup');
    });

    core.on('results:select', function() {
        var $highlighted = self.getHighlightedResults();

        if ($highlighted.length === 0) {
            return;
        }

        $highlighted.trigger('mouseup');
    });
};

Results.prototype.select = function(data, evt) {
    if (data.children) return;

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
    if (data.children) return;

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
