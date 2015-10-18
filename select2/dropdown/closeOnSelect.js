function CloseOnSelect() {}

CloseOnSelect.prototype.bind = function(decorated, container) {
    var self = this;

    decorated.call(this, container);

    container.on('select', function(evt) {
        self._selectTriggered(evt);
    });

    container.on('unselect', function(evt) {
        self._selectTriggered(evt);
    });
};

CloseOnSelect.prototype._selectTriggered = function(_, evt) {
    var originalEvent = evt.originalEvent;

    // Don't close if the control key is being held
    if (originalEvent && originalEvent.ctrlKey) {
        return;
    }

    this.emit('close', {});
};

module.exports = CloseOnSelect;
