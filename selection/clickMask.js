import $ from 'jquery';

/* lays a mask over the document to catch clicks anywhere but on the dropown */
export default class ClickMask {
    bind(decorate, container) {
        const self = this;

        decorate.call(this, container);

        this.$mask = $(
            '<div class="select2-close-mask"></div>'
        );

        this.$mask.on('mousedown touchstart click', () => {
            self.emit('close', {});
        });
    }

    _attachCloseHandler(decorate, container) {
        $(document.body).append(this.$mask);
    }

    _detachCloseHandler(deocrate, container) {
        this.$mask.detach();
    }
}
