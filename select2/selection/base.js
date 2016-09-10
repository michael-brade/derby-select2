'use strict';
var $ = require('jquery');
var KEYS = require('../keys');


function BaseSelection() {}

module.exports = BaseSelection;


// TODO: init is a good place to apply decorations
BaseSelection.prototype.init = function(model) {
    this.core = this.parent; // alias to make it more obvious
    this.options = this.core.model.at("options")

    model.ref("options", this.options);
    model.ref("focus", this.core.model.at("focus"));
    model.ref("selections", this.core.model.at("selections"));
};


BaseSelection.prototype.create = function(model, dom) {
    this.$selection = $(this.selection);

    this._tabindex = 0; // TODO: where to read it from now?
    this.$selection.attr('tabindex', this._tabindex);

    var self = this;
    this.on('destroy', function() {
        self._detachCloseHandler(this.core);
    });
};

BaseSelection.prototype.bind = function() {
    var self = this;
    var core = this.core;
    var resultsId = core.results.results.id;


    this.$selection.on('focus', function(evt) {
        self.emit('focus', evt);
    });

    this.$selection.on('blur', function(evt) {
        self._handleBlur(evt);
    });

    this.$selection.on('keydown', function(evt) {
        self.emit('keypress', evt);

        if (evt.which === KEYS.SPACE) {
            evt.preventDefault();
        }
    });

    core.on('results:focus', function(params) {
        self.$selection.attr('aria-activedescendant', params.data._resultId);
    });

    core.on('open', function() {
        // When the dropdown is open, aria-expanded="true"
        self.$selection.attr('aria-expanded', 'true');
        self.$selection.attr('aria-owns', resultsId);

        self._attachCloseHandler(core);
    });

    core.on('close', function() {
        // When the dropdown is closed, aria-expanded="false"
        self.$selection.attr('aria-expanded', 'false');
        self.$selection.removeAttr('aria-activedescendant');
        self.$selection.removeAttr('aria-owns');

        self.$selection.focus();

        self._detachCloseHandler(core);
    });

    core.on('enable', function() {
        self.$selection.attr('tabindex', self._tabindex);
    });

    core.on('disable', function() {
        self.$selection.attr('tabindex', '-1');
    });
};

BaseSelection.prototype._handleBlur = function(evt) {
    var self = this;

    // This needs to be delayed as the active element is the body when the tab
    // key is pressed, possibly along with others.
    window.setTimeout(function() {
        // Don't trigger `blur` if the focus is still in the selection
        // TODO: debug this
        if (
            (document.activeElement == self.selection) ||
            ($.contains(self.selection, document.activeElement))
        ) {
            return;
        }

        self.emit('blur', evt);
    }, 1);
};


// TODO: this should go to core
BaseSelection.prototype._attachCloseHandler = function(core) {
    var self = this;

    $(document.body).on('mousedown.select2.' + core.id, function(e) {
        var $target = $(e.target);

        var $select = $target.closest('.select2');

        var $all = $('.select2.select2-container--open');

        $all.each(function() {
            var $this = $(this);

            if (this == $select[0]) {
                return;
            }

            var controller = $this.data('controller');
            controller.close();
        });
    });
};

BaseSelection.prototype._detachCloseHandler = function(core) {
    $(document.body).off('mousedown.select2.' + core.id);
};
