'use strict';

var util = require('util');
var BaseAdapter = require('./base');


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
function ModelAdapter(core) {
    ModelAdapter.super_.apply(this, arguments);

    var options = core.options;
    var model = core.model;

    this.options = options;
    this.model = model;

    // default functions: filter, sorter, and normalizer

    // normalize an item; default case: expect item to be object with id, title, text, children, disabled.
    options.setNull("normalizer", function(item) {
        return {
            "item": item,   // store original

            "id": item.id,
            "title": item.title,
            "text": item.text,
            "children": item.children,
            "disabled": item.disabled,
        };
    });

    options.setNull("filter", function(filter) {
        return function(item) {
            return item.text.search(filter) != -1;
        };
    });

    options.setNull("sorter", function(itemA, itemB) {
        if (itemA.text < itemB.text)
            return -1;
        if (itemA.text > itemB.text)
            return 1;

        return 0;
    });


    // TODO: derby: shouldn't it be possible to ref and map the single array elements?
    model.start("selections", "value", function(selected_items) {
        var results = [];
        for (var item of selected_items) {
            results.push(options.get("normalizer")(item));
        }
        return results;
    });



    var normalizeResultsFn = function(item) {
        var normalized = options.get("normalizer")(item);
        normalized["selected"] = undefined !== model.get('selections').find(function(selected) { return selected.item === item; });
        return normalized;
    }

    // results: first normalize, then filter & sort (TODO: performance?! always normalize all items???)
    model.fn("normalizeResultsFn", function(items, filter) {
        // results needs to be an array, items is a CollectionData
        var results = [];

        // normalize
        for (var id in items) {
            results.push(normalizeResultsFn(items[id]));
        }

        // filter, sort
        return results
            .filter(options.get("filter")(filter))
            .sort(options.get("sorter"));
    });
}

module.exports = ModelAdapter;

util.inherits(ModelAdapter, BaseAdapter);


// ** event callback implementations ** //


// only start "results" after opening the dropdown
ModelAdapter.prototype.start = function() {
    // TODO: input "data" should be an array!? maybe even in correct order already!

    this.model.start("results", "data", "filter", "normalizeResultsFn");
};

ModelAdapter.prototype.stop = function() {
    this.model.stop("results");
};


ModelAdapter.prototype.query = function(query) {
    var self = this;
    this.model.set("filter", query.term || "");
    setTimeout(function() {
        self.emit("queryEnd", {});
    }, 1);
};

// select event:
// params: {
//      originalEvent,
//      item
// }
ModelAdapter.prototype.select = function(params) {
    if (this.options.get("multiple")) {
        this.model.push("value", params.item);
    } else
        this.model.set("value", params.item);
};

// move event:
// params: {
//      originalEvent,
//      oldIndex,
//      newIndex
// }
ModelAdapter.prototype.move = function(params) {
    this.model.move('value', params.oldIndex, params.newIndex);
};

// unselect event:
// params: {
//      originalEvent,
//      item,
//      pos
// }
ModelAdapter.prototype.unselect = function(params) {

    // value (output path) is always an array
    // remove from array at pos, or the last pos that item === pos
    var pos = params.pos;

    if (pos == undefined) {
        if (params.item == undefined) {
            // TODO instead: this.emit("unselected", data.text);
            console.error("ModelAdapter: unselect: no item or pos given: params=", params);
            return;
        }

        pos = this.model.get("value").lastIndexOf(params.item);
    }

    if (pos === -1) {
        console.error("cannot unselect item: ", params.item);
        return;
    }

    var data = this.model.remove("value", pos);
};
