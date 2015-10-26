'use strict';
var $ = require('jquery');
var util = require('util');
var BaseAdapter = require('./base');


function ModelAdapter(select2, options) {
    ModelAdapter.super_.apply(this, arguments);

    this.select2 = select2;
    this.options = options;

    var model = select2.model;

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
        this.select2.model.push("value", params.data.item);
    else
        this.select2.model.set("value", params.data.item);
};

ModelAdapter.prototype.unselect = function(params) {

    // value (output path) is always an array
    // remove from array at pos, or the last pos that item === pos
    var pos = params.pos;

    if (pos == undefined)
        pos =  this.select2.model.get("value").lastIndexOf(params.data);

    if (pos === -1) {
        console.error("cannot unselect ", params.data);
        return;
    }

    this.select2.model.remove("value", pos);
};
