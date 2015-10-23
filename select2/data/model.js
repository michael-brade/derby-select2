'use strict';
var $ = require('jquery');
var util = require('util');
var BaseAdapter = require('./base');


function ModelAdapter(select2, options) {
    ModelAdapter.super_.apply(this, arguments);

    this.select2 = select2;
    this.options = options;

    var model = select2.model;

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

    // TODO: implement filtering!
    // var filter = model.at("results").filter();
    //    model.ref("results", filter);
}

module.exports = ModelAdapter;

util.inherits(ModelAdapter, BaseAdapter);



ModelAdapter.prototype.select = function(params) {
    console.error("select not yet implemented");
};

ModelAdapter.prototype.unselect = function(params, callback) {
    console.error("unselect not yet implemented");
};
