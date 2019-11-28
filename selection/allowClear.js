import $ from 'jquery';
import KEYS from '../keys';

export default (superclass) => class extends superclass {
    bind(decorated, container) {
        decorated.call(this, container);

        if (this.placeholder == null) {
            if (this.options.get('debug') && window.console && console.error) {
                console.error(
                    'Select2: The `allowClear` option should be used in combination ' +
                    'with the `placeholder` option.'
                );
            }
        }

        this.$selection.on('mousedown', '.select2-selection__clear', evt => {
            this._handleClear(evt);
        });

        container.on('keypress', evt => {
            this._handleKeyboardClear(evt, container);
        });
    }

    _handleClear(_, evt) {
        // Ignore the event if it is disabled
        if (this.options.get('disabled')) {
            return;
        }

        const $clear = this.$selection.find('.select2-selection__clear');

        // Ignore the event if nothing has been selected
        if ($clear.length === 0) {
            return;
        }

        evt.stopPropagation();

        const data = $clear.data('data');

        for (let d = 0; d < data.length; d++) {
            const unselectData = {
                data: data[d]
            };

            // Trigger the `unselect` event, so people can prevent it from being
            // cleared.
            this.emit('unselect', unselectData);

            // If the event was prevented, don't clear it out.
            if (unselectData.prevented) {
                return;
            }
        }

        // TODO!
        this.$element.val(this.placeholder.id).trigger('change');

        this.emit('toggle', {});
    }

    _handleKeyboardClear(_, evt, container) {
        if (container.isOpen()) {
            return;
        }

        if (evt.which == KEYS.DELETE || evt.which == KEYS.BACKSPACE) {
            this._handleClear(evt);
        }
    }

    update(decorated, data) {
        decorated.call(this, data);

        if (this.$selection.find('.select2-selection__placeholder').length > 0 ||
            data.length === 0) {
            return;
        }

        const $remove = $(
            '<span class="select2-selection__clear">' +
            '&times;' +
            '</span>'
        );
        $remove.data('data', data);

        this.$selection.find('.select2-selection__rendered').prepend($remove);
    }
}
