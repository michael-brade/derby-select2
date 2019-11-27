import path from 'path';

import BaseSelection from './base';

export default class SingleSelection extends BaseSelection
{
    static view = {
        is: 'single',
        file: path.join(__dirname, 'single.html')
    }

    create(model, dom) {
        super.create(arguments);

        this.$selection.on('mousedown', evt => {
            // Only respond to left clicks
            if (evt.which !== 1) {
                return;
            }

            this.emit('toggle', {
                originalEvent: evt
            });
        });

        this.core.on('focus', evt => {
            if (!this.core.isOpen()) {
                this.$selection.focus();
            }
        });
    }
}
