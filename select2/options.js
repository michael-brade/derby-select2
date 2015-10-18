var $ = require('jquery');
var Defaults = require('./defaults');
var Utils = require('./utils');

// options is the ChildModel.at "options"
function Options(options) {
    this.options = options;

    Defaults.apply(this.options);
}

Options.prototype.fromElement = function($e) {
    var excludedData = ['select2'];

    if (this.get('multiple') == null) {
        this.set('multiple', $e.prop('multiple'));
    }

    if (this.get('disabled') == null) {
        this.set('disabled', $e.prop('disabled'));
    }

    if (this.get('language') == null) {
        if ($e.prop('lang')) {
            this.set('language', $e.prop('lang').toLowerCase());
        } else if ($e.closest('[lang]').prop('lang')) {
            this.set('language', $e.closest('[lang]').prop('lang'));
        }
    }

    if (this.get('dir') == null) {
        if ($e.prop('dir')) {
            this.set('dir', $e.prop('dir'));
        } else if ($e.closest('[dir]').prop('dir')) {
            this.set('dir', $e.closest('[dir]').prop('dir'));
        } else {
            this.set('dir', 'ltr');
        }
    }

    $e.prop('disabled', this.get('disabled'));
    $e.prop('multiple', this.get('multiple'));


    var dataset = {};

    // TODO: what about this code?

    // Prefer the element's `dataset` attribute if it exists
    // jQuery 1.x does not correctly handle data attributes with multiple dashes
    if ($.fn.jquery && $.fn.jquery.substr(0, 2) == '1.' && $e[0].dataset) {
        dataset = $.extend(true, {}, $e[0].dataset, $e.data());
    } else {
        dataset = $e.data();
    }

    var data = $.extend(true, {}, dataset);

    data = Utils._convertData(data);

    for (var key in data) {
        if ($.inArray(key, excludedData) > -1) {
            continue;
        }

        if ($.isPlainObject(this.get(key))) {
            $.extend(this.get(key), data[key]);  //TODO where does extend write to??
        } else {
            this.set(key, data[key]);
        }
    }

    return this;
};

Options.prototype.get = function(key) {
    return this.options.get(key);
};

Options.prototype.set = function(key, val) {
    this.options.set(key, val);
};

module.exports = Options;
