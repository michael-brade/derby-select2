import path from 'path';

import $ from 'jquery';
import _findIndex from 'lodash/findIndex';


/* Results Model paths:
     message
     loading
     results
     highlighted
*/
export default class Results
{
    static view = {
        is: 'results',
        file: path.join(__dirname, 'results.html')
    }

    init(model) {
        this.core = this.parent; // alias to make it more obvious
        this.options = model.at("options");

        model.ref("options", this.core.model.at("options"));
        model.ref("results", this.core.model.at("results"));
        model.ref("selections", this.core.model.at("selections"));
        model.ref("highlighted", this.core.model.at("highlighted"));
    }

    // called on open
    create(model, dom) {
        this.bind(this.core);

        this.ensureHighlightVisible();
    }

    /* A message can be a function and have arguments, so params is an object with attributes message and args. */
    displayMessage(params) {
        this.hideLoading();

        // var message = this.options.get('translations').get(params.message);

        /*this.model.set("message", message(params.args));*/
        this.model.set("message", "nothing here");
    }

    hideMessages() {
        this.model.del("message");
    }

    highlightFirstItem() {
        this.highlight(this.model.get('results')[0]);
        this.ensureHighlightVisible();
    }

    showLoading(params) {
        /*var loadingMore = this.options.get('translations').get('searching');
        this.model.set("loading", loadingMore(params));*/
        this.model.set("loading", "loading...");
    }

    hideLoading() {
        this.model.del("loading");
    }

    bind(core) {
        const queryFn = params => {
            this.hideMessages();
            this.showLoading(params);
        };

        const queryEndFn = params => {
            this.hideLoading();
            this.highlightFirstItem();
        };

        const selectFn = () => {
            this.highlightFirstItem();
        };

        const unselectFn = () => {
            this.highlightFirstItem();
        };

        const results_previousFn = () => {
            const highlighted = this.model.get('highlighted');
            const results = this.model.get('results');

            // If none are highlighted, highlight the first
            let nextIndex = 0;
            if (highlighted !== undefined) {
                const currentIndex = _findIndex(results, ['item', highlighted.item]);

                // If we are already at the top, don't move further
                if (currentIndex === 0) {
                    return;
                }

                nextIndex = currentIndex - 1;
            }

            this.highlight(results[nextIndex]);
            this.ensureHighlightVisible();
        };

        const results_nextFn = () => {
            const highlighted = this.model.get('highlighted');
            const results = this.model.get('results');

            // If none are highlighted, highlight the first
            let nextIndex = 0;
            if (highlighted !== undefined) {
                const currentIndex = _findIndex(results, ['item', highlighted.item]);

                nextIndex = currentIndex + 1;

                // If we are at the last option, stay there
                if (nextIndex >= results.length) {
                    return;
                }
            }

            this.highlight(results[nextIndex]);
            this.ensureHighlightVisible();
        };

        const results_firstFn = this.highlightFirstItem.bind(this);

        const results_lastFn = () => {
            const results = this.model.get('results');
            this.highlight(results[results.length-1]);
            this.ensureHighlightVisible();
        };

        const results_messageFn = params => {
            this.displayMessage(params);
        };

        const results_toggleFn = () => {
            const highlighted = this.model.get('highlighted');
            this.select(highlighted);
        };

        const results_selectFn = () => {
            const highlighted = this.model.get('highlighted');
            this.select(highlighted);
        };

        if (this.search)
            this.search.on('query', param => this.emit('query', param));

        core.on('query', queryFn);
        core.on('queryEnd', queryEndFn);
        core.on('select', selectFn);
        core.on('unselect', unselectFn);
        core.on('results:previous', results_previousFn);
        core.on('results:next', results_nextFn);
        core.on('results:first', results_firstFn);
        core.on('results:last', results_lastFn);

        core.on('results:message', results_messageFn);

        core.on('results:toggle', results_toggleFn);
        core.on('results:select', results_selectFn);

        this.on('destroy', () => {
            this.model.del('highlighted');
            core.removeListener('query', queryFn);
            core.removeListener('queryEnd', queryEndFn);
            core.removeListener('select', selectFn);
            core.removeListener('unselect', unselectFn);
            core.removeListener('results:previous', results_previousFn);
            core.removeListener('results:next', results_nextFn);
            core.removeListener('results:first', results_firstFn);
            core.removeListener('results:last', results_lastFn);

            core.removeListener('results:message', results_messageFn);

            core.removeListener('results:toggle', results_toggleFn);
            core.removeListener('results:select', results_selectFn);
        });
    }

    select(data, evt) {
        if (!data || data.children || data.disabled) return;

        if (!data.selected || this.options.get('multiple') && this.options.get('duplicates'))
        {
            this.emit('select', {
                originalEvent: evt,     // TODO: check if originalEvent can actually be used (see CloseOnSelect)
                item: data.item
            });
        }
        else if (!this.options.get('multiple'))
        {
            this.emit('close', {}); // do nothing in single selection if already selected
        }
        else if (!this.options.get('duplicates'))
        {
            this.emit('unselect', { // unselect if we can't have duplicates
                originalEvent: evt,
                item: data.item
            });
        }
    }

    // data is the normalized item from "results" model path
    highlight(data, evt) {
        if (!data || data.children || data.disabled) return;

        this.model.set("highlighted", data);
    }

    ensureHighlightVisible(currentIndex) {
        const highlighted = this.model.get('highlighted');

        if (highlighted === undefined) {
            return;
        }

        const $results = $(this.results);

        if (currentIndex === undefined) {
            const results = this.model.get('results');
            var currentIndex = _findIndex(results, ['item', highlighted.item]);
        }

        if (currentIndex <= 2) {
            $results.scrollTop(0);
            return;
        }

        const $highlighted = $results.find('.select2-results__option--highlighted');

        const resultsOffset = $results.offset().top;
        const highlightedOffset = $highlighted.offset().top;

        // distance of $highlighted from top of visible dropdown area
        const offsetDelta = highlightedOffset - resultsOffset;


        if (offsetDelta > $results.outerHeight() - $highlighted.outerHeight(false) || offsetDelta < 0) {
            // scrollTop: number of hidden pixels of dropdown
            // nextOffset: setting scrollTop to this means the item will be the first in the dropdown
            let nextOffset = $results.scrollTop() + offsetDelta;

            // don't jump all the way to the top, keep the two previous elements visible
            nextOffset -= $highlighted.outerHeight(false) * 2;

            $results.scrollTop(nextOffset);
        }
    }
}
