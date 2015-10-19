var $ = require('jquery');
var Utils = require('./utils');

function Results(options, dataAdapter) {
    this.data = dataAdapter;
    this.options = options;
}

module.exports = Results;


/* Results interface:
    append() is now model path "results"

   Model paths:
     message
     results  (TODO)
     loading

  Needed parent model paths:
     selections
*/
Results.prototype.view = __dirname + "/results.html";

Results.prototype.init = function(model) {
    // TODO: set options here


    // TODO: model.sort, model.fn("sorter")
    Results.prototype.sort = function(data) {
        var sorter = this.options.get('sorter');

        return sorter(data);
    };

}

Results.prototype.create = function(model) {
    require('jquery.mousewheel');

    this.$results = $(this.results);
};


Results.prototype.displayMessage = function(params) {
    this.hideLoading();

    var message = this.options.get('translations').get(params.message);

    this.model.set("message", message(params.args));
};

Results.prototype.hideMessages = function() {
    this.model.del("message");
};

Results.prototype.append = function(data) {
    this.hideLoading();

    var $options = [];

    if (data.results == null || data.results.length === 0) {
        if (this.$results.children().length === 0) {
            this.emit('results:message', {
                message: 'noResults'
            });
        }

        return;
    }

    data.results = this.sort(data.results);

    for (var d = 0; d < data.results.length; d++) {
        var item = data.results[d];

        var $option = this.option(item);

        $options.push($option);
    }

    this.$results.append($options);
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
    });
};

Results.prototype.showLoading = function(params) {
    var loadingMore = this.options.get('translations').get('searching');
    this.model.set("loading", loadingMore(params));
};

Results.prototype.hideLoading = function() {
    this.model.del("loading");
};

// TODO: done, delete except for $.data(option, 'data', data);
Results.prototype.option = function(data) {
    var option = document.createElement('li');
    $.data(option, 'data', data);   // TODO: do that in the view
    return option;
};

Results.prototype.bind = function(container) {
    var self = this;

    // TODO: check all ids!
    var id = container.id + '-results';

    this.$results.attr('id', id);

    container.on('results:all', function(params) {
        self.clear();
        self.append(params.data);

        if (container.isOpen()) {
            self.setClasses();
            self.ensureHighlightVisible();
        }
    });

    container.on('results:append', function(params) {
        self.append(params.data);

        if (container.isOpen()) {
            self.setClasses();
        }
    });

    container.on('query', function(params) {
        self.hideMessages();
        self.showLoading(params);
    });

    container.on('select', function() {
        if (!container.isOpen()) {
            return;
        }

        self.setClasses();
    });

    container.on('unselect', function() {
        if (!container.isOpen()) {
            return;
        }

        self.setClasses();
    });

    container.on('open', function() {
        // When the dropdown is open, aria-expended="true"
        self.$results.attr('aria-expanded', 'true');
        self.$results.attr('aria-hidden', 'false');

        self.setClasses();
        self.ensureHighlightVisible();
    });

    container.on('close', function() {
        // When the dropdown is closed, aria-expended="false"
        self.$results.attr('aria-expanded', 'false');
        self.$results.attr('aria-hidden', 'true');
        self.$results.removeAttr('aria-activedescendant');
    });

    container.on('results:toggle', function() {
        var $highlighted = self.getHighlightedResults();

        if ($highlighted.length === 0) {
            return;
        }

        $highlighted.trigger('mouseup');
    });

    container.on('results:select', function() {
        var $highlighted = self.getHighlightedResults();

        if ($highlighted.length === 0) {
            return;
        }

        var data = $highlighted.data('data');

        if ($highlighted.attr('aria-selected') == 'true') {
            self.emit('close', {});
        } else {
            self.emit('select', {
                data: data
            });
        }
    });

    container.on('results:previous', function() {
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

    container.on('results:next', function() {
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

    container.on('results:focus', function(params) {
        params.element.addClass('select2-results__option--highlighted');
    });

    container.on('results:message', function(params) {
        self.displayMessage(params);
    });

    // TODO: is this code really needed???
    if ($.fn.mousewheel) {
        this.$results.on('mousewheel', function(e) {
            var top = self.$results.scrollTop();

            var bottom = (
                self.$results.get(0).scrollHeight -
                self.$results.scrollTop() +
                e.deltaY
            );

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

    this.$results.on('mouseup', '.select2-results__option[aria-selected]',
        function(evt) {
            var $this = $(this);

            var data = $this.data('data');

            if ($this.attr('aria-selected') === 'true') {
                if (self.options.get('multiple')) {
                    self.emit('unselect', {
                        originalEvent: evt,
                        data: data
                    });
                } else {
                    self.emit('close', {});
                }

                return;
            }

            self.emit('select', {
                originalEvent: evt,
                data: data
            });
        });

    this.$results.on('mouseenter', '.select2-results__option[aria-selected]',
        function(evt) {
            var data = $(this).data('data');

            self.getHighlightedResults()
                .removeClass('select2-results__option--highlighted');

            self.emit('results:focus', {
                data: data,
                element: $(this)
            });
        });
};

Results.prototype.getHighlightedResults = function() {
    var $highlighted = this.$results
        .find('.select2-results__option--highlighted');

    return $highlighted;
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
