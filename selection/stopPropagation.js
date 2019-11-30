export default (superclass) => class extends superclass
{
    bind() {
        if (super.bind)
            super.bind(arguments);

        const stoppedEvents = [
            'blur',
            'change',
            'click',
            'dblclick',
            'focus',
            'focusin',
            'focusout',
            'input',
            'keydown',
            'keyup',
            'keypress',
            'mousedown',
            'mouseenter',
            'mouseleave',
            'mousemove',
            'mouseover',
            'mouseup',
            'search',
            'touchend',
            'touchstart'
        ];

        this.$selection.on(stoppedEvents.join(' '), evt => {
            evt.stopPropagation();
        });
    }
}
