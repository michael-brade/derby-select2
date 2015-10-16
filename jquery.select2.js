var $ = require('jquery')
var Select2 = require('./select2/core')
var Defaults = require('./select2/defaults')


if ($.fn && $.fn.select2 == null) {
    // Force jQuery.mousewheel to be loaded if it hasn't already
    require('jquery.mousewheel');
    
    // All methods that should return the element
    var thisMethods = ['open', 'close', 'destroy'];

    $.fn.select2 = function(options) {
        options = options || {};

        if (typeof options === 'object') {
            this.each(function() {
                var instanceOptions = $.extend({}, options, true);

                var instance = new Select2($(this), instanceOptions);
            });

            return this;
        } else if (typeof options === 'string') {
            var instance = this.data('select2');

            if (instance == null && window.console && console.error) {
                console.error(
                    'The select2(\'' + options + '\') method was called on an ' +
                    'element that is not using Select2.'
                );
            }

            var args = Array.prototype.slice.call(arguments, 1);

            var ret = instance[options].apply(instance, args);

            // Check if we should be returning `this`
            if ($.inArray(options, thisMethods) > -1) {
                return this;
            }

            return ret;
        } else {
            throw new Error('Invalid arguments for Select2: ' + options);
        }
    };

    if ($.fn.select2.defaults == null) {
        $.fn.select2.defaults = Defaults;
    }
}

module.exports = Select2;
