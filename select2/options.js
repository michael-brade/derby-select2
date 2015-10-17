var $ = require('jquery');
var Defaults = require('./defaults');
var Utils = require('./utils');

function Options(options, $element) {
    this.options = options;

    if ($element != null) {
        this.fromElement($element);
    }

    this.options = Defaults.apply(this.options);
}

Options.prototype.fromElement = function($e) {
    var excludedData = ['select2'];

    if (this.options.multiple == null) {
        this.options.multiple = $e.prop('multiple');
    }

    if (this.options.disabled == null) {
        this.options.disabled = $e.prop('disabled');
    }

    if (this.options.language == null) {
        if ($e.prop('lang')) {
            this.options.language = $e.prop('lang').toLowerCase();
        } else if ($e.closest('[lang]').prop('lang')) {
            this.options.language = $e.closest('[lang]').prop('lang');
        }
    }

    if (this.options.dir == null) {
        if ($e.prop('dir')) {
            this.options.dir = $e.prop('dir');
        } else if ($e.closest('[dir]').prop('dir')) {
            this.options.dir = $e.closest('[dir]').prop('dir');
        } else {
            this.options.dir = 'ltr';
        }
    }

    $e.prop('disabled', this.options.disabled);
    $e.prop('multiple', this.options.multiple);


    var dataset = {};

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

        if ($.isPlainObject(this.options[key])) {
            $.extend(this.options[key], data[key]);
        } else {
            this.options[key] = data[key];
        }
    }

    return this;
};

Options.prototype.get = function(key) {
    return this.options[key];
};

Options.prototype.set = function(key, val) {
    this.options[key] = val;
};

module.exports = Options;
