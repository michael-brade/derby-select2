import $ from 'jquery';
import KEYS from '../keys';

// Base class for single and multiple selection components.
//
export default class BaseSelection
{
    init(model) {
        this.core = this.parent; // alias to make it more obvious
        this.options = this.core.model.at("options")

        model.ref("options", this.options);
        model.ref("open", this.core.model.at("open"));
        model.ref("focus", this.core.model.at("focus"));
        model.ref("selections", this.core.model.at("selections"));
        model.ref("highlighted", this.core.model.at("highlighted"));
    }

    create(model, dom) {
        this.$selection = $(this.selection);

        this.on('destroy', () => {
            this._detachCloseHandler(this.core);
        });
    }

    bind() {
        const core = this.core;

        core.on('open', () => {
            const resultsId = core.results.results.id;
            this.$selection.attr('aria-owns', resultsId);

            this._attachCloseHandler(core);
        });

        core.on('close', () => {
            this.$selection.removeAttr('aria-owns');

            this._detachCloseHandler(core);
        });
    }

    // TODO: this should go to core
    _attachCloseHandler(core) {
        $(document).on(`mousedown.select2.${core.id}`, e => {
            const $target = $(e.target);

            const $select = $target.closest('.select2');

            const $all = $('.select2.select2-container--open');

            $all.each(function() {
                if (this == $select[0]) {
                    return;
                }

                const controller = $(this).data('controller');
                controller.close();
            });
        });
    }

    _detachCloseHandler(core) {
        $(document).off(`mousedown.select2.${core.id}`);
    }
}
