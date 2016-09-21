var $ = require('jquery');

function ClickMask() {}

ClickMask.prototype.bind = function(decorate, container) {
    var self = this;

    decorate.call(this, container);

    this.$mask = $(
        '<div class="select2-close-mask"></div>'
    );

    this.$mask.on('mousedown touchstart click', function() {
        self.emit('close', {});
    });
};

ClickMask.prototype._attachCloseHandler = function(decorate, container) {
    $(document.body).append(this.$mask);
};

ClickMask.prototype._detachCloseHandler = function(deocrate, container) {
    this.$mask.detach();
};

module.exports = ClickMask;