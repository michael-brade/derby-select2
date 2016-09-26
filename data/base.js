import EventEmitter from 'events';

// A data adapter takes the available options and selections and turns them into a normalized list.
// It also handles selecting, moving, and deselecting items on the data level.
//
// A data adapter can emit "query" and "queryEnd". Needed in case of AJAX or racer model queries.


export default class BaseAdapter extends EventEmitter
{
    constructor() {
        super();
    }

    start(params) {
        throw new Error('The `start` method must be defined in child classes.');
    }

    stop(params) {
        throw new Error('The `stop` method must be defined in child classes.');
    }

    query(params) {
        // may be overridden in subclasses
        setTimeout(() => { this.emit("queryEnd", {}); }, 1);
    }

    select(params) {
        throw new Error('The `select` method must be defined in child classes.');
    }

    move(params) {
        throw new Error('The `move` method must be defined in child classes.');
    }

    /*
        Unselect the item params.data at params.pos. If pos is not given, the last
        selected item equal to params.data is unselected. If neither is given, the
        last selected item is unselected; in that case, an event "unselected" with
        the unselected item as parameter should be fired with a normalized string
        parameter.
    */
    unselect(params) {
        throw new Error('The `unselect` method must be defined in child classes.');
    }


    /**
     * All adapters react to select and unselect events, some to query.
     */
    bind(core) {
        core.on('open', params => {
            this.start(params);
        });

        core.on('close', params => {
            this.stop(params);
        });

        core.on('query', params => {
            this.query(params);
        });

        core.on('select', params => {
            this.select(params);
        });

        core.on('move', params => {
            this.move(params);
        });

        core.on('unselect', params => {
            this.unselect(params);
        });
    }
}
