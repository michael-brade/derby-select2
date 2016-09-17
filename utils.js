var $ = require('jquery');

var Utils = {};

function getMethods(theClass) {
    var proto = theClass.prototype;

    var methods = [];

    for (var methodName in proto) {
        var m = proto[methodName];

        if (typeof m !== 'function') {
            continue;
        }

        if (methodName === 'constructor') {
            continue;
        }

        methods.push(methodName);
    }

    return methods;
}


Utils.Decorate = function(SuperClass, DecoratorClass) {
    var decoratedMethods = getMethods(DecoratorClass);
    var superMethods = getMethods(SuperClass);

    function DecoratedClass() {
        var unshift = Array.prototype.unshift;

        var argCount = DecoratorClass.prototype.constructor.length;

        var calledConstructor = SuperClass.prototype.constructor;

        if (argCount > 0) {
            unshift.call(arguments, SuperClass.prototype.constructor);

            calledConstructor = DecoratorClass.prototype.constructor;
        }

        calledConstructor.apply(this, arguments);
    }

    DecoratorClass.displayName = SuperClass.displayName;

    function ctr() {
        this.constructor = DecoratedClass;
    }

    DecoratedClass.prototype = new ctr();

    for (var m = 0; m < superMethods.length; m++) {
        var superMethod = superMethods[m];

        DecoratedClass.prototype[superMethod] =
            SuperClass.prototype[superMethod];
    }

    var calledMethod = function(methodName) {
        // Stub out the original method if it's not decorating an actual method
        var originalMethod = function() {};

        if (methodName in DecoratedClass.prototype) {
            originalMethod = DecoratedClass.prototype[methodName];
        }

        var decoratedMethod = DecoratorClass.prototype[methodName];

        return function() {
            var unshift = Array.prototype.unshift;

            unshift.call(arguments, originalMethod);

            return decoratedMethod.apply(this, arguments);
        };
    };

    for (var d = 0; d < decoratedMethods.length; d++) {
        var decoratedMethod = decoratedMethods[d];

        DecoratedClass.prototype[decoratedMethod] = calledMethod(decoratedMethod);
    }

    return DecoratedClass;
};

Utils.decorateObject = function(theObject, DecoratorClass) {
    var decoratedMethods = getMethods(DecoratorClass);

    var calledMethod = function(methodName) {
        // Stub out the original method if it's not decorating an actual method
        var originalMethod = function() {};

        if (methodName in theObject) {
            originalMethod = theObject[methodName];
        }

        var decoratedMethod = DecoratorClass.prototype[methodName];

        // return new function with the original method as first argument
        return function() {
            var unshift = Array.prototype.unshift;
            unshift.call(arguments, originalMethod);

            return decoratedMethod.apply(this, arguments);
        };
    };

    for (var d = 0; d < decoratedMethods.length; d++) {
        var decoratedMethod = decoratedMethods[d];

        theObject[decoratedMethod] = calledMethod(decoratedMethod);
    }
};

Utils.hasScroll = function(index, el) {
    // Adapted from the function created by @ShadowScripter
    // and adapted by @BillBarry on the Stack Exchange Code Review website.
    // The original code can be found at
    // http://codereview.stackexchange.com/q/13338
    // and was designed to be used with the Sizzle selector engine.

    var $el = $(el);
    var overflowX = el.style.overflowX;
    var overflowY = el.style.overflowY;

    //Check both x and y declarations
    if (overflowX === overflowY &&
        (overflowY === 'hidden' || overflowY === 'visible')) {
        return false;
    }

    if (overflowX === 'scroll' || overflowY === 'scroll') {
        return true;
    }

    return ($el.innerHeight() < el.scrollHeight ||
        $el.innerWidth() < el.scrollWidth);
};

// Append an array of jQuery nodes to a given element.
Utils.appendMany = function($element, $nodes) {
    // jQuery 1.7.x does not support $.fn.append() with an array
    // Fall back to a jQuery object collection using $.fn.add()
    if ($.fn.jquery.substr(0, 3) === '1.7') {
        var $jqNodes = $();

        $.map($nodes, function(node) {
            $jqNodes = $jqNodes.add(node);
        });

        $nodes = $jqNodes;
    }

    $element.append($nodes);
};

module.exports = Utils;
