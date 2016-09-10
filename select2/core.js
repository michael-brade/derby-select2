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
    require('./selection/search'),
    require('./results')
];

// TODO: put global defaults somewhere, accessible, changable
// TODO: click event should open; do it in the view instead of here?
// TODO: rename options to config

Select2.prototype.init = function(model) {
    this.options = model.at("options");

    // model should hold state! not CSS classes. So: added open, enabled, focus to model
    model.setNull("focus", false);
    model.setNull("open", false);

    this.options.setNull("disabled", false);

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
    this.$dropdown = $(this.dropdown);

    // attach the select2 controller to the container to be able to identify it later and close
    // all the other dropdowns; selection/base uses it
    // TODO: is there a better way? Derby global events or so?
    $(this.container).data('controller', this);

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
    var relayEvents = ['open', 'query', 'move', 'unselect', 'keypress', 'blur'];

    // register toggle and focus
    this.selection.on('toggle', function() {
        self.toggleDropdown();
    });

    this.selection.on('focus', function(params) {
        self.focus(params);
    });

    // relay the rest
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


    this.model.on('change', 'open', function(value, prev) {
        if (value === prev) return;

        if (value) {
            self.emit('open', {});
            self.emit('query', {});
        } else {
            self.emit('close', {});
        }
    });

    this.model.on('change', 'focus', function(value, prev) {
        if (value === prev) return;

        if (value) {
            self.emit('focus', {});
        } else {
            self.emit('blur', {});
        }
    });


    this.options.on('change', 'disabled', function(value, prev) {
        if (value === prev) return;

        if (value) {
            if (self.isOpen()) {
                self.close();
            }
            self.model.set("focus", false);
            self.emit('disable', {});
        } else {
            self.emit('enable', {});
            // if we have focus already, notify everything
            if (self.container == document.activeElement || $.contains(self.container, document.activeElement))
                self.focus();
        }
    });


    /* focus/blur events */

    this.container.addEventListener('blur', function(evt) {

        // This needs to be delayed as the active element is the body when the tab
        // key is pressed, possibly along with others.
        setTimeout(function() {
            // Don't trigger `blur` if the focus is still in the selection
            if (self.container == document.activeElement || $.contains(self.container, document.activeElement))
            {
                return;
            }

            self.model.set("focus", false);
        }, 1);

    }, true);   // capturing phase, blur doesn't bubble

    this.container.addEventListener('focus', function(evt) {
        self.focus();
    }, true);   // capturing phase, focus doesn't bubble


    /* keyboard events */

    // handle keydown events that bubbled up because no one stopped and used them
    this.container.addEventListener('keydown', function(evt) {
        if (self.options.get('disabled')) {
            return;
        }

        var key = evt.which;

        if (self.isOpen()) {
            if (key === KEYS.ESC || (key === KEYS.UP && evt.altKey)) {
                self.close();

                evt.preventDefault();
            } else if (key === KEYS.TAB) {
                self.close();
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

/**
 * Override the emit method to automatically emit pre-events for events that can be prevented, e.g.:
 *   this.on('opening', function(evt) {
 *     evt.prevented = true;
 *   });
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
    if (this.isOpen()) {
        this.close();
    } else {
        this.open();
    }
};

Select2.prototype.open = function() {
    if (this.options.get('disabled')) {
        return;
    }

    this.model.set('open', true);
};

Select2.prototype.close = function() {
    this.model.set('open', false);
};

Select2.prototype.isOpen = function() {
    return this.model.get('open');
};

Select2.prototype.hasFocus = function() {
    return this.model.get('focus');
};

Select2.prototype.focus = function(evt) {
    if (this.options.get('disabled')) {
        return;
    }

    // this needs a delay, otherwise the changes in the view will prevent the click event from firing
    var self = this;
    setTimeout(function() {
        self.model.set("focus", true);
    }, 200);
};
