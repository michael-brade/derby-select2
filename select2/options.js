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

    return this;
};

Options.prototype.get = function(key) {
    return this.options.get(key);
};

Options.prototype.set = function(key, val) {
    this.options.set(key, val);
};

module.exports = Options;
