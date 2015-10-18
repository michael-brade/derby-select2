var $ = require('jquery');
var Utils = require('../utils');
var KEYS = require('../keys');

function BaseSelection($element, options) {
    this.$element = $element;
    this.options = options;

    BaseSelection.__super__.constructor.call(this);
}

module.exports = BaseSelection;

Utils.Extend(BaseSelection, Utils.Observable);

BaseSelection.prototype.view = __dirname + '/selection.html';


BaseSelection.prototype.create = function(model, dom) {
    /* TODO
    this._tabindex = 0;

    if (this.$element.data('old-tabindex') != null) {
        this._tabindex = this.$element.data('old-tabindex');
    } else if (this.$element.attr('tabindex') != null) {
        this._tabindex = this.$element.attr('tabindex');
    }

    $selection.attr('title', this.$element.attr('title'));
    $selection.attr('tabindex', this._tabindex);
    */

    this.$selection = $(this.selection);
};

BaseSelection.prototype.bind = function(container) {
    var self = this;

    var id = container.id + '-container';
    var resultsId = container.id + '-results';

    this.container = container;

    this.$selection.on('focus', function(evt) {
        self.trigger('focus', evt);
    });

    this.$selection.on('blur', function(evt) {
        self._handleBlur(evt);
    });

    this.$selection.on('keydown', function(evt) {
        self.trigger('keypress', evt);

        if (evt.which === KEYS.SPACE) {
            evt.preventDefault();
        }
    });

    container.on('results:focus', function(params) {
        self.$selection.attr('aria-activedescendant', params.data._resultId);
    });

    container.on('selection:update', function(params) {
        self.update(params.data);
    });

    container.on('open', function() {
        // When the dropdown is open, aria-expanded="true"
        self.$selection.attr('aria-expanded', 'true');
        self.$selection.attr('aria-owns', resultsId);

        self._attachCloseHandler(container);
    });

    container.on('close', function() {
        // When the dropdown is closed, aria-expanded="false"
        self.$selection.attr('aria-expanded', 'false');
        self.$selection.removeAttr('aria-activedescendant');
        self.$selection.removeAttr('aria-owns');

        self.$selection.focus();

        self._detachCloseHandler(container);
    });

    container.on('enable', function() {
        self.$selection.attr('tabindex', self._tabindex);
    });

    container.on('disable', function() {
        self.$selection.attr('tabindex', '-1');
    });
};

BaseSelection.prototype._handleBlur = function(evt) {
    var self = this;

    // This needs to be delayed as the active element is the body when the tab
    // key is pressed, possibly along with others.
    window.setTimeout(function() {
        // Don't trigger `blur` if the focus is still in the selection
        if (
            (document.activeElement == self.$selection[0]) ||
            ($.contains(self.$selection[0], document.activeElement))
        ) {
            return;
        }

        self.trigger('blur', evt);
    }, 1);
};

BaseSelection.prototype._attachCloseHandler = function(container) {
    var self = this;

    $(document.body).on('mousedown.select2.' + container.id, function(e) {
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

BaseSelection.prototype._detachCloseHandler = function(container) {
    $(document.body).off('mousedown.select2.' + container.id);
};

BaseSelection.prototype.destroy = function() {
    this._detachCloseHandler(this.container);
};

BaseSelection.prototype.update = function(data) {
    throw new Error('The `update` method must be defined in child classes.');
};
