'use strict';
var $ = require('jquery');

var Defaults = require('./defaults');
var KEYS = require('./keys');

var ModelAdapter = require('./data/model');

// this is like index.js, the Select2 Derby component itself

/*
  Results gets the dataAdapter, it needs access to the data to display
  results view/components is embedded or used by the dropdown view
*/

function Select2() {}

module.exports = Select2;

Select2.prototype.view = __dirname + '/core.html';
Select2.prototype.style = __dirname + '/../index.css';

Select2.prototype.components = [
    require('./selection/single'),
    require('./selection/multiple'),

    require('./results')
];

// TODO: put global defaults somewhere, accessible, changable
// TODO: click event should open; do it in the view instead of here?
// TODO: tab out of select2 doesn't work, i.e., focus is not lost anymore
// TODO: rename options to config

Select2.prototype.init = function(model) {
    this.options = model.at("options");

    // TODO: set options here
    //this.options = new Options(options);

    // default dataAdapter is ModelAdapter

    // default dataAdapter just refs, sort and filter happen in results
    this.options.setNull("dataAdapter", ModelAdapter);

    // Default view names (and thus default components)
    this.options.setNull("selectionAdapter", this.options.get("multiple") ? "multiple" : "single");
    this.options.setNull("selectionTemplate", "selection-template");

    this.options.setNull("resultsAdapter", "results");
    this.options.setNull("resultsTemplate", "results-template");

    this.options.setNull("theme", "default");

    this.options.setNull("sorter", function(a, b) {
        return a - b;
    });

    this.options.setNull("normalizer", function(item) {
        return {
            "id": item.toString(),
            "text": item.toString()
            //title
            //children
            //disabled
        };
    });


    var DataAdapter = this.options.get('dataAdapter');
    this.dataAdapter = new DataAdapter(this, this.options);
};

Select2.prototype.create = function(model, dom) {
    this.$container = $(this.container);

    // attach the select2 controller to the container to be able to identify it later and close
    // all the other dropdowns; selection/base uses it
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


Select2.prototype._bindAdapters = function() {
    this.selection.bind(this);
    this.results.bind(this);
    this.dataAdapter.bind(this);    // bind last because it can emit queryEnd immediately
};

Select2.prototype._registerDataEvents = function() {
    var self = this;
    var relayEvents = ['queryEnd'];

    relayEvents.forEach(function(evt) {
        self.dataAdapter.on(evt, function(params) {
            self.emit(evt, params);
        });
    });
};

Select2.prototype._registerSelectionEvents = function() {
    var self = this;
    var relayEvents = ['move', 'unselect', 'keypress', 'blur'];

    this.selection.on('toggle', function() {
        self.toggleDropdown();
    });

    this.selection.on('focus', function(params) {
        self.focus(params);
    });

    relayEvents.forEach(function(evt) {
        self.selection.on(evt, function(params) {
            self.emit(evt, params);
        });
    });
};


// forward and emit results events as if from Select2
Select2.prototype._registerResultsEvents = function() {
    var self = this;
    // TOOD: can also emit query/queryEnd with infiniteScroll - not implementd yet
    var relayEvents = ['select', 'unselect', 'close'];

    relayEvents.forEach(function(evt) {
        self.results.on(evt, function(params) {
            self.emit(evt, params);
        });
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

    this.on('keypress', function(evt) {
        var key = evt.which;

        if (self.isOpen()) {
            if (key === KEYS.ESC || key === KEYS.TAB ||
                (key === KEYS.UP && evt.altKey)) {
                self.close();

                evt.preventDefault();
            } else if (key === KEYS.ENTER) {
                self.emit('results:select', {});

                evt.preventDefault();
            } else if ((key === KEYS.SPACE && evt.ctrlKey)) {
                self.emit('results:toggle', {});

                evt.preventDefault();
            } else if (key === KEYS.UP) {
                self.emit('results:previous', {});

                evt.preventDefault();
            } else if (key === KEYS.DOWN) {
                self.emit('results:next', {});

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

        this.emit('disable', {});
    } else {
        this.emit('enable', {});
    }
};

/**
 * Override the emit method to automatically emit pre-events for events that can be prevented.
 * TODO: does this actually work?
 */
Select2.prototype.emit = function(name, args) {
    var actualEmit = this.__proto__.__proto__.emit;
    var preEmitMap = {
        'open': 'opening',
        'close': 'closing',
        'select': 'selecting',
        'unselect': 'unselecting'
    };

    if (args === undefined) {
      args = {};
    }

    if (name in preEmitMap) {
        var preEmitName = preEmitMap[name];
        var preEmitArgs = {
            prevented: false,
            name: name,
            args: args
        };

        actualEmit.call(this, preEmitName, preEmitArgs);

        if (preEmitArgs.prevented) {
            args.prevented = true;

            return;
        }
    }

    actualEmit.call(this, name, args);
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

    this.emit('open', {});
    this.emit('query', {});
};

Select2.prototype.close = function() {
    if (!this.isOpen()) {
        return;
    }

    this.emit('close', {});
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
    this.emit('focus', {});
};
