function SelectOnClose() {}

SelectOnClose.prototype.bind = function(decorated, container) {
    var self = this;

    decorated.call(this, container);

    container.on('close', function() {
        self._handleSelectOnClose();
    });
};

SelectOnClose.prototype._handleSelectOnClose = function() {
    var $highlightedResults = this.getHighlightedResults();

    if ($highlightedResults.length < 1) {
        return;
    }

    this.trigger('select', {
        data: $highlightedResults.data('data')
    });
};

module.exports = SelectOnClose;
