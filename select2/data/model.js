'use strict';

var util = require('util');
var BaseAdapter = require('./base');


/*
The simple model adapter takes input from model path "data" and filters and sorts it to
"results".

On selection events it copies the item to value, moves it, or deletes the item from value.

Last, it refs selections to value.
*/
function ModelAdapter(core, options) {
    ModelAdapter.super_.apply(this, arguments);

    this.core = core;
    this.options = options;

    var model = core.model;

/*
    // normalize
    var normalizeFn = this.options.get("normalizer");

    var normalizeAllFn = function(items) {
        var results = {};
        if ($.isArray(items)) {
            items.forEach(function(item) {
                var norm = normalizeFn(item)
                results[norm.id] = norm;
            });
        } else {
            alert("TODO");
        }
    };

    // watch data (input) as well as value (output) and map to results and selections, respectively
    model.start("results", "data", normalizeAllFn);
    model.start("selections", "value", normalizeAllFn);
*/

    model.fn('sort', this.options.get("sorter"));

    // results
    var results = model.at("data").sort('sort');//.filter();
    model.ref("results", results);

    // in case of array input - still needs sorting and filtering
    // model.ref("results", model.at("data"));

    // selections
    model.ref("selections", model.at("value"));
}

module.exports = ModelAdapter;

util.inherits(ModelAdapter, BaseAdapter);


ModelAdapter.prototype.select = function(params) {
    if (this.options.get("multiple"))
        this.core.model.push("value", params.data);
    else
        this.core.model.set("value", params.data);
};

ModelAdapter.prototype.move = function(params) {
    this.core.model.move('value', params.oldIndex, params.newIndex);
};

ModelAdapter.prototype.unselect = function(params) {

    // value (output path) is always an array
    // remove from array at pos, or the last pos that item === pos
    var pos = params.pos;

    if (pos == undefined)
        pos = this.core.model.get("value").lastIndexOf(params.data);

    if (pos === -1) {
        console.error("cannot unselect ", params.data);
        return;
    }

    this.core.model.remove("value", pos);
};
