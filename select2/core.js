var $ = require('jquery');

var Options = require('./options');
var Utils = require('./utils');
var KEYS = require('./keys');

// this is like index.js, the Select2 Derby component itself

/*
  Results gets the dataAdapter, it needs access to the data to display
  results view/components is embedded or used by the dropdown view
*/

Select2.prototype.view = __dirname + '/core.html';

Select2.prototype.components = [
    require('./selection/base')
    require('./results')
]


Select2.prototype.init = function(model) {
    // TODO...
    var DataAdapter = this.options.get('dataAdapter');
    this.dataAdapter = new DataAdapter($element, this.options);

    // Default view names (thus components)
    model.setNull("options.selectionAdapter", "selection")
    model.setNull("options.resultsAdapter", "results")

};

Select2.prototype.create = function(model, dom) {
    this.$container = $(this.container);

    // attach the select2 controller to the container to be able to identify it later and close
    // all the other dropdowns, for instance; selection/base uses it
    // TODO: is there a better way? Derby global events or so?
    this.$container.data('controller', this);


    // Bind the container to all of the adapters
    this._bindAdapters();

    // Register any internal event handlers
    this._registerDataEvents();
    this._registerSelectionEvents();
    this._registerResultsEvents();
    this._registerEvents();
};

// TODO: remove all destroy functions!! IMPORTANT, don't overwrite derby, use on('destroy') if really needed

// TODO: this should be the init() function - or the create() function....
// TODO: options
// TODO: put global defaults somewhere, accessible, changable

// TODO: click event should open; do it in the view instead of here?!
var Select2 = function(options) {
    options = options || {};
    this.options = new Options(options);

    Select2.__super__.constructor.call(this);


    // Set the initial state TODO: that should be automatic now!
    var self = this;
    this.dataAdapter.current(function(initialData) {
        self.trigger('selection:update', {
            data: initialData
        });
    });
};

module.exports = Select2;

Utils.Extend(Select2, Utils.Observable);



Select2.prototype._bindAdapters = function() {
    this.dataAdapter.bind(this, this.$container);
    this.selection.bind(this, this.$container);
    this.results.bind(this, this.$container);
};

Select2.prototype._registerDataEvents = function() {
    var self = this;

    this.dataAdapter.on('*', function(name, params) {
        self.trigger(name, params);
    });
};

Select2.prototype._registerSelectionEvents = function() {
    var self = this;
    var nonRelayEvents = ['toggle', 'focus'];

    this.selection.on('toggle', function() {
        self.toggleDropdown();
    });

    this.selection.on('focus', function(params) {
        self.focus(params);
    });

    this.selection.on('*', function(name, params) {
        if ($.inArray(name, nonRelayEvents) !== -1) {
            return;
        }

        self.trigger(name, params);
    });
};


// forward and emit results events as if from Select2
Select2.prototype._registerResultsEvents = function() {
    var self = this;

    this.results.on('*', function(name, params) {
        self.trigger(name, params);
    });
};

Select2.prototype._registerEvents = function() {
    var self = this;

    this.on('open', function() {
        self.$container.addClass('select2-container--open');
    });

    this.on('close', function() {
        self.$container.removeClass('select2-container--open');
    });

    this.on('enable', function() {
        self.$container.removeClass('select2-container--disabled');
    });

    this.on('disable', function() {
        self.$container.addClass('select2-container--disabled');
    });

    this.on('blur', function() {
        self.$container.removeClass('select2-container--focus');
    });

    this.on('query', function(params) {
        if (!self.isOpen()) {
            self.trigger('open', {});
        }

        this.dataAdapter.query(params, function(data) {
            self.trigger('results:all', {
                data: data,
                query: params
            });
        });
    });

    this.on('query:append', function(params) {
        this.dataAdapter.query(params, function(data) {
            self.trigger('results:append', {
                data: data,
                query: params
            });
        });
    });

    this.on('keypress', function(evt) {
        var key = evt.which;

        if (self.isOpen()) {
            if (key === KEYS.ESC || key === KEYS.TAB ||
                (key === KEYS.UP && evt.altKey)) {
                self.close();

                evt.preventDefault();
            } else if (key === KEYS.ENTER) {
                self.trigger('results:select', {});

                evt.preventDefault();
            } else if ((key === KEYS.SPACE && evt.ctrlKey)) {
                self.trigger('results:toggle', {});

                evt.preventDefault();
            } else if (key === KEYS.UP) {
                self.trigger('results:previous', {});

                evt.preventDefault();
            } else if (key === KEYS.DOWN) {
                self.trigger('results:next', {});

                evt.preventDefault();
            }
        } else {
            if (key === KEYS.ENTER || key === KEYS.SPACE ||
                (key === KEYS.DOWN && evt.altKey)) {
                self.open();

                evt.preventDefault();
            }
        }
    });
};

// TODO: need to close when select2 is set to disabled, need to trigger (emit) dis/enable
Select2.prototype._syncAttributes = function() {
    if (this.options.get('disabled')) {
        if (this.isOpen()) {
            this.close();
        }

        this.trigger('disable', {});
    } else {
        this.trigger('enable', {});
    }
};

/**
 * Override the trigger method to automatically trigger pre-events when
 * there are events that can be prevented.
 */
Select2.prototype.trigger = function(name, args) {
    var actualTrigger = Select2.__super__.trigger;
    var preTriggerMap = {
        'open': 'opening',
        'close': 'closing',
        'select': 'selecting',
        'unselect': 'unselecting'
    };

    if (name in preTriggerMap) {
        var preTriggerName = preTriggerMap[name];
        var preTriggerArgs = {
            prevented: false,
            name: name,
            args: args
        };

        actualTrigger.call(this, preTriggerName, preTriggerArgs);

        if (preTriggerArgs.prevented) {
            args.prevented = true;

            return;
        }
    }

    actualTrigger.call(this, name, args);
};

Select2.prototype.toggleDropdown = function() {
    if (this.options.get('disabled')) {
        return;
    }

    if (this.isOpen()) {
        this.close();
    } else {
        this.open();
    }
};

Select2.prototype.open = function() {
    if (this.isOpen()) {
        return;
    }

    this.trigger('query', {});
};

Select2.prototype.close = function() {
    if (!this.isOpen()) {
        return;
    }

    this.trigger('close', {});
};

Select2.prototype.isOpen = function() {
    return this.$container.hasClass('select2-container--open');
};

Select2.prototype.hasFocus = function() {
    return this.$container.hasClass('select2-container--focus');
};

Select2.prototype.focus = function(data) {
    // No need to re-trigger focus events if we are already focused
    if (this.hasFocus()) {
        return;
    }

    this.$container.addClass('select2-container--focus');
    this.trigger('focus', {});
};


Select2.prototype.destroy = function() {
    this.dataAdapter.destroy();
    this.selection.destroy();
    this.results.destroy();

    this.dataAdapter = null;
    this.selection = null;
    this.results = null;
};
