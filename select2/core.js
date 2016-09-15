'use strict';
var $ = require('jquery');

var Defaults = require('./defaults');
var KEYS = require('./keys');

var ModelAdapter = require('./data/model');

// this is like index.js, the Select2 Derby component itself
// TODO: rename to index.js/index.html?

/* Derby Select2 Component.

  Views:
    "core" is the main view, parent of all others.
    "multiple"/"single" is the selection view: it shows what has already been selected.
    "results" is the contents of the dropdown and shows the selectable options.
    "search" is used to filter the results (by dropdown and multiple)

  Model:

  input paths:
    - data

  for Select2 use:
    - focus (bool)
    - open (bool)
    - results (array)
    - selections (array)

  output paths:
    - value

  Events:
    - open, close, query, queryEnd, select, move, unselect, focus, blur, disable, enable
    - opening, closing, selecting, unselecting
    - results:select, results:toggle, results:previous, results:next
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

    // state is kept in the model: focus, open
    model.setNull("focus", false);
    model.setNull("open", false);

    // enabled/disabled is kept in the options
    this.options.setNull("disabled", false);

    // default dataAdapter is ModelAdapter
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

    // Register any internal event handlers first (because e.g. on open we need to create the results view before
    // being able to register results event handlers)
    this._registerEvents();
    this._registerDataEvents();
    this._registerSelectionEvents();

    // Bind the container to all of the adapters
    this._bindAdapters();
};


Select2.prototype._bindAdapters = function() {
    this.selection.bind(this);
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

    // open the dropdown
    this.on('open', function() {
        self.model.set('open', true);
        self._registerResultsEvents();
    });

    this.on('close', function() {
        self.model.set('open', false);
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
    if (this.options.get('disabled') || this.isOpen())
        return;

    this.emit('open', {});

    if (this.isOpen())
        this.emit('query', {});
};

Select2.prototype.close = function() {
    if (!this.isOpen())
        return;

    this.emit('close', {});
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
