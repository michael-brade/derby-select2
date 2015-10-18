var $ = require('jquery');
var Utils = require('./utils');

function Dropdown($element, options) {
    this.$element = $element;
    this.options = options;

    Dropdown.__super__.constructor.call(this);
}

module.exports = Dropdown;

Utils.Extend(Dropdown, Utils.Observable);


Dropdown.prototype.view = __dirname + "/dropdown.html";

Dropdown.prototype.init = function(model) {
    // TODO: set options here
}

Dropdown.prototype.create = function(model) {
    this.$dropdown = $(this.dropdown);
};


Dropdown.prototype.bind = function() {
    // Should be implemented in subclasses
};

Dropdown.prototype.destroy = function() {
    // Remove the dropdown from the DOM
    this.$dropdown.remove();
};
