import path from 'path';

import $ from 'jquery';

import KEYS from './keys';
import ModelAdapter from './data/model';

// subcomponents
import SingleSelection from './selection/single';
import MultipleSelection from './selection/multiple';
import Search from './selection/search';
import Results from './results';


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
    - results:select, results:toggle, results:previous, results:next, results:first, results:last
*/
export default class Select2
{
    // TODO: put global defaults somewhere, accessible, changable

    init(model) {
        this.options = model.at("options");

        // state is kept in the model: focus, open, highlighted
        model.setNull("focus", false);
        model.setNull("open", false);

        // enabled/disabled is kept in the options
        this.options.setNull("disabled", false);

        // default settings
        this.options.setNull("tabindex", 0);
        this.options.setNull("multiple", false);
        this.options.setNull("duplicates", false);

        // theme
        this.options.setNull("theme", "default");

        // default dataAdapter is ModelAdapter
        this.options.setNull("dataAdapter", ModelAdapter);

        // default view names (and thus default components)  TODO: rename to selectionView, selectionItemView, resultsView....
        this.options.setNull("selectionAdapter", this.options.get("multiple") ? "multiple" : "single");
        this.options.setNull("selectionTemplate", "selection-template");

        this.options.setNull("resultsAdapter", "results");
        this.options.setNull("resultsTemplate", "results-template");

        // instantiate data adapter
        this.dataAdapter = new (this.options.get('dataAdapter'))(this, this.options);
    }

    create(model, dom) {
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
    }

    _bindAdapters() {
        this.selection.bind(this);
        this.dataAdapter.bind(this);    // bind last because it can emit queryEnd immediately
    }

    _registerDataEvents() {
        const relayEvents = ['queryEnd'];

        relayEvents.forEach(evt => {
            this.dataAdapter.on(evt, params => {
                this.emit(evt, params);
            });
        });
    }

    _registerSelectionEvents() {
        const relayEvents = ['query', 'move', 'unselect'];

        // register toggle
        this.selection.on('toggle', () => {
            this.toggleDropdown();
        });

        // relay the rest
        relayEvents.forEach(evt => {
            this.selection.on(evt, params => {
                this.emit(evt, params);
            });
        });
    }

    // forward and emit results events as if from Select2
    _registerResultsEvents() {
        // TOOD: can also emit query/queryEnd with infiniteScroll - not implementd yet
        const relayEvents = ['select', 'unselect', 'close'];

        relayEvents.forEach(evt => {
            this.results.on(evt, params => {
                this.emit(evt, params);
            });
        });
    }

    _registerEvents() {
        // open the dropdown
        this.on('open', () => {
            this.model.set('open', true);
            this._registerResultsEvents();
        });

        this.on('close', () => {
            this.model.set('open', false);
        });

        this.on('query', () => {
            if (!this.isOpen()) {
                this.emit('open', {});
            }
        });


        this.model.on('change', 'focus', (value, prev) => {
            if (value === prev) return;

            if (value) {
                this.emit('focus', {});
            } else {
                this.emit('blur', {});
            }
        });


        this.options.on('change', 'disabled', (value, prev) => {
            if (value === prev) return;

            if (value) {
                if (this.isOpen()) {
                    this.close();
                }
                this.model.set("focus", false);
                this.emit('disable', {});
            } else {
                this.emit('enable', {});
                // if we have focus already, notify everything
                if (this.container == document.activeElement || $.contains(this.container, document.activeElement))
                    this.focus();
            }
        });


        /* focus/blur events */

        this.container.addEventListener('focus', evt => {
            this.focus();
        }, true);   // capturing phase, focus doesn't bubble

        this.container.addEventListener('blur', evt => {
            this.model.set("focus", false);
        }, true);   // capturing phase, blur doesn't bubble


        this.container.addEventListener('mousedown', evt => {
            // we don't blur if mousedown is prevented, and it is prevented if mousedown happens in the container
            evt.preventDefault();
            this.focus();
        });


        /* keyboard events */

        // handle keydown events that bubbled up because no one stopped and used them
        this.container.addEventListener('keydown', evt => {
            if (this.options.get('disabled')) {
                return;
            }

            const key = evt.which;

            if (this.isOpen()) {
                if (key === KEYS.ESC || (key === KEYS.UP && evt.altKey))
                {
                    this.close();
                    evt.preventDefault();
                    evt.stopPropagation();
                }
                else if (key === KEYS.TAB)
                {
                    this.close();
                }
                else if (key === KEYS.ENTER)
                {
                    this.emit('results:select', {});
                    evt.preventDefault();
                }
                else if ((key === KEYS.SPACE && evt.ctrlKey))
                {
                    this.emit('results:toggle', {});
                    evt.preventDefault();
                }
                else if (key === KEYS.HOME)
                {
                    this.emit('results:first', {});
                    evt.preventDefault();
                }
                else if (key === KEYS.UP)
                {
                    this.emit('results:previous', {});
                    evt.preventDefault();
                }
                else if (key === KEYS.DOWN)
                {
                    this.emit('results:next', {});
                    evt.preventDefault();
                }
                else if (key === KEYS.END)
                {
                    this.emit('results:last', {});
                    evt.preventDefault();
                }
            } else {
                if (key === KEYS.ENTER || key === KEYS.SPACE || (key === KEYS.DOWN && evt.altKey))
                {
                    this.open();
                    evt.preventDefault();
                }
            }
        });
    }

    /**
     * Override the emit method to automatically emit pre-events for events that can be prevented, e.g.:
     *   this.on('opening', function(evt) {
     *     evt.prevented = true;
     *   });
     */
    emit(name, args) {
        const actualEmit = this.__proto__.__proto__.emit;
        const preEmitMap = {
            'open': 'opening',
            'close': 'closing',
            'select': 'selecting',
            'unselect': 'unselecting'
        };

        if (args === undefined) {
          args = {};
        }

        if (name in preEmitMap) {
            const preEmitName = preEmitMap[name];
            const preEmitArgs = {
                prevented: false,
                name,
                args
            };

            actualEmit.call(this, preEmitName, preEmitArgs);

            if (preEmitArgs.prevented) {
                args.prevented = true;

                return;
            }
        }

        actualEmit.call(this, name, args);
    }

    toggleDropdown() {
        if (this.isOpen()) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (this.options.get('disabled') || this.isOpen())
            return;

        this.emit('open', {});

        if (this.isOpen())
            this.emit('query', {});
    }

    close() {
        if (!this.isOpen())
            return;

        this.emit('close', {});
    }

    isOpen() {
        return this.model.get('open');
    }

    hasFocus() {
        return this.model.get('focus');
    }

    focus(evt) {
        if (this.options.get('disabled')) {
            return;
        }

        this.model.set("focus", true);
    }
}


Select2.prototype.view = path.join(__dirname, '/core');
Select2.prototype.style = path.join(__dirname, '/index');

Select2.prototype.components = [
    SingleSelection,
    MultipleSelection,
    Search,
    Results
];

export { Select2 };
