import $ from 'jquery';


function hasScroll(index, el) {
    // Adapted from the function created by @ShadowScripter
    // and adapted by @BillBarry on the Stack Exchange Code Review website.
    // The original code can be found at
    // http://codereview.stackexchange.com/q/13338
    // and was designed to be used with the Sizzle selector engine.

    const $el = $(el);
    const overflowX = el.style.overflowX;
    const overflowY = el.style.overflowY;

    //Check both x and y declarations
    if (overflowX === overflowY &&
        (overflowY === 'hidden' || overflowY === 'visible')) {
        return false;
    }

    if (overflowX === 'scroll' || overflowY === 'scroll') {
        return true;
    }

    return ($el.innerHeight() < el.scrollHeight ||
        $el.innerWidth() < el.scrollWidth);
}


export default class AttachBody {
    constructor(decorated, options) {
        this.$dropdownParent = options.get('dropdownParent') || $(document.body);

        decorated.call(this, options);
    }

    bind(decorated, container) {
        let setupResultsEvents = false;

        decorated.call(this, container);

        container.on('open', () => {
            this._showDropdown();
            this._attachPositioningHandler(container);

            if (!setupResultsEvents) {
                setupResultsEvents = true;

                container.on('results:all', () => {
                    this._positionDropdown();
                    this._resizeDropdown();
                });

                container.on('results:append', () => {
                    this._positionDropdown();
                    this._resizeDropdown();
                });
            }
        });

        container.on('close', () => {
            this._hideDropdown();
            this._detachPositioningHandler(container);
        });

        this.$dropdownContainer.on('mousedown', evt => {
            evt.stopPropagation();
        });
    }

    // TODO: this would actually have to be done in on('destroy')
    destroy(decorated) {
        decorated.call(this);

        this.$dropdownContainer.remove();
    }

    position(decorated, $dropdown, $container) {
        // Clone all of the container classes
        $dropdown.attr('class', $container.attr('class'));

        $dropdown.removeClass('select2');
        $dropdown.addClass('select2-container--open');

        $dropdown.css({
            position: 'absolute',
            top: -999999
        });

        this.$container = $container;
    }

    render(decorated) {
        const $container = $('<span></span>');

        const $dropdown = decorated.call(this);
        $container.append($dropdown);

        this.$dropdownContainer = $container;

        return $container;
    }

    _hideDropdown(decorated) {
        this.$dropdownContainer.detach();
    }

    _attachPositioningHandler(decorated, container) {
        const scrollEvent = `scroll.select2.${container.id}`;
        const resizeEvent = `resize.select2.${container.id}`;
        const orientationEvent = `orientationchange.select2.${container.id}`;

        const $watchers = this.$container.parents().filter(hasScroll);
        $watchers.each(function() {
            $(this).data('select2-scroll-position', {
                x: $(this).scrollLeft(),
                y: $(this).scrollTop()
            });
        });

        $watchers.on(scrollEvent, function(ev) {
            const position = $(this).data('select2-scroll-position');
            $(this).scrollTop(position.y);
        });

        $(window).on(`${scrollEvent} ${resizeEvent} ${orientationEvent}`,
            e => {
                this._positionDropdown();
                this._resizeDropdown();
            });
    }

    _detachPositioningHandler(decorated, container) {
        const scrollEvent = `scroll.select2.${container.id}`;
        const resizeEvent = `resize.select2.${container.id}`;
        const orientationEvent = `orientationchange.select2.${container.id}`;

        const $watchers = this.$container.parents().filter(hasScroll);
        $watchers.off(scrollEvent);

        $(window).off(`${scrollEvent} ${resizeEvent} ${orientationEvent}`);
    }

    _positionDropdown() {
        const $window = $(window);

        const isCurrentlyAbove = this.$dropdown.hasClass('select2-dropdown--above');
        const isCurrentlyBelow = this.$dropdown.hasClass('select2-dropdown--below');

        let newDirection = null;

        const offset = this.$container.offset();

        offset.bottom = offset.top + this.$container.outerHeight(false);

        const container = {
            height: this.$container.outerHeight(false)
        };

        container.top = offset.top;
        container.bottom = offset.top + container.height;

        const dropdown = {
            height: this.$dropdown.outerHeight(false)
        };

        const viewport = {
            top: $window.scrollTop(),
            bottom: $window.scrollTop() + $window.height()
        };

        const enoughRoomAbove = viewport.top < (offset.top - dropdown.height);
        const enoughRoomBelow = viewport.bottom > (offset.bottom + dropdown.height);

        const css = {
            left: offset.left,
            top: container.bottom
        };

        // Determine what the parent element is to use for calciulating the offset
        let $offsetParent = this.$dropdownParent;

        // For statically positoned elements, we need to get the element
        // that is determining the offset
        if ($offsetParent.css('position') === 'static') {
            $offsetParent = $offsetParent.offsetParent();
        }

        const parentOffset = $offsetParent.offset();

        css.top -= parentOffset.top;
        css.left -= parentOffset.left;

        if (!isCurrentlyAbove && !isCurrentlyBelow) {
            newDirection = 'below';
        }

        if (!enoughRoomBelow && enoughRoomAbove && !isCurrentlyAbove) {
            newDirection = 'above';
        } else if (!enoughRoomAbove && enoughRoomBelow && isCurrentlyAbove) {
            newDirection = 'below';
        }

        if (newDirection == 'above' ||
            (isCurrentlyAbove && newDirection !== 'below')) {
            css.top = container.top - parentOffset.top - dropdown.height;
        }

        if (newDirection != null) {
            this.$dropdown
                .removeClass('select2-dropdown--below select2-dropdown--above')
                .addClass(`select2-dropdown--${newDirection}`);
            this.$container
                .removeClass('select2-container--below select2-container--above')
                .addClass(`select2-container--${newDirection}`);
        }

        this.$dropdownContainer.css(css);
    }

    _resizeDropdown() {
        const css = {
            width: `${this.$container.outerWidth(false)}px`
        };

        if (this.options.get('dropdownAutoWidth')) {
            css.minWidth = css.width;
            css.position = 'relative';
            css.width = 'auto';
        }

        this.$dropdown.css(css);
    }

    _showDropdown(decorated) {
        this.$dropdownContainer.appendTo(this.$dropdownParent);

        this._positionDropdown();
        this._resizeDropdown();
    }
}
