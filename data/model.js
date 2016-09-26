import BaseAdapter from './base';

/* Simple Model Adapter

References:
    data -> results
        This model adapter takes the items from model path "data" (array) and normalizes, filters, and sorts it to "results" (array).

    value -> selections
        This model adapter takes input from model path "value" and normalizes it to "selections".

select/move/unselect:
    data -> value
        On selection events it copies the item to value, moves it, or deletes the item from value.


Normalization is internal to select2, and it means how to get those attributes: id, title, text, children, disabled.

results contains normalized items and is thus an array of objects with this structure:

    data: {
        item: ORIG_OBJECT,
        id: item.id,
        title: item.title,
        text: item.text,
        children: item.children,
        disabled: item.disabled,
        selected: true/false
    }

*/

export default class ModelAdapter extends BaseAdapter
{
    constructor(core, options) {
        super(core, options);

        const model = core.model;

        this.options = options;
        this.model = model;

        // default functions: filter, sorter, and normalizer

        // normalize an item; default case: expect item to be object with id, title, text, children, disabled.
        options.setNull("normalizer", item => ({
            // store original
            "item": item,

            "id": item.id,
            "title": item.title,
            "text": item.text,
            "children": item.children,
            "disabled": item.disabled
        }));

        options.setNull("filter", filter => item => item.text.search(filter) != -1);

        options.setNull("sorter", (itemA, itemB) => {
            if (itemA.text < itemB.text)
                return -1;
            if (itemA.text > itemB.text)
                return 1;

            return 0;
        });


        // TODO: derby: shouldn't it be possible to ref and map the single array elements?
        model.start("selections", "value", selected_items => {
            const results = [];
            // "value" (selected_items) is array if multiple, otherwise it's a single item
            if (options.get("multiple"))
                for (const id in selected_items) {
                    results.push(options.get("normalizer")(selected_items[id]));
                }
            else
                results.push(options.get("normalizer")(selected_items));

            return results;
        });


        // DON'T use model.fn(), it can only set ONE function with a particular name globally!
        this.normalizeResultsFn = (items, value, filter) => {
            // results needs to be an array, items may be any collection, value is item/array (not normalized)
            const results = [];

            // results: first normalize, then filter & sort (TODO: performance?! always normalize all items???)

            // normalize - adapt normalizer: add selected property for results
            const normalizeResultsFn = item => {
                const normalized = options.get("normalizer")(item);
                if (options.get("multiple"))
                    normalized["selected"] = value && undefined !== value.find(selected => selected === item);
                else
                    normalized["selected"] = value === item;
                return normalized;
            };

            for (const id in items) {
                results.push(normalizeResultsFn(items[id]));
            }

            // filter, sort
            return results
                .filter(options.get("filter")(filter))
                .sort(options.get("sorter"));
        };
    }

    // ** event callback implementations ** //


    // only start "results" after opening the dropdown
    start() {
        this.model.start("results", "data", "value", "filter", this.normalizeResultsFn);
    }

    stop() {
        this.model.stop("results");
    }

    query(query) {
        this.model.set("filter", query.term || "");
        setTimeout(() => { this.emit("queryEnd", {}); }, 1);
    }

    // select event:
    // params: {
    //      originalEvent,
    //      item
    // }
    select(params) {
        if (this.options.get("multiple")) {
            this.model.push("value", params.item);
        } else
            this.model.set("value", params.item);
    }

    // move event:
    // params: {
    //      originalEvent,
    //      oldIndex,
    //      newIndex
    // }
    move(params) {
        this.model.move('value', params.oldIndex, params.newIndex);
    }

    // unselect event:
    // params: {
    //      originalEvent,
    //      item,
    //      pos
    // }
    unselect(params) {
        // "value" (output path) is always an array

        // remove from array at pos
        let pos = params.pos;

        if (pos == undefined) {
            if (params.item == undefined) {
                // remove last item
                const item = this.model.pop("value");
                this.emit("unselected", this.options.get("normalizer")(item));
                return;
            }

            // remove last pos that item === pos
            pos = this.model.get("value").lastIndexOf(params.item);
        }

        if (pos === -1) {
            console.error("cannot unselect item: ", params.item);
            return;
        }

        this.model.remove("value", pos);
    }
}
