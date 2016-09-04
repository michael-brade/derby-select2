function SelectOnClose() {}

SelectOnClose.prototype.bind = function(decorated, container) {
    var self = this;

    decorated.call(this, container);

    container.on('close', function (params) {
        self._handleSelectOnClose(params);
    });
};

SelectOnClose.prototype._handleSelectOnClose = function (_, params) {
    if (params && params.originalSelect2Event != null) {
        var event = params.originalSelect2Event;

        // Don't select an item if the close event was triggered from a select or
        // unselect event
        if (event._type === 'select' || event._type === 'unselect') {
            return;
        }
    }

    var $highlightedResults = this.getHighlightedResults();

    // Only select highlighted results
    if ($highlightedResults.length < 1) {
        return;
    }

    var data = $highlightedResults.data('data');

    // Don't re-select already selected resulte
    if (
        (data.element != null && data.element.selected) ||
        (data.element == null && data.selected)
    ) {
        return;
    }

    this.emit('select', {
        data: data
    });
};

module.exports = SelectOnClose;
