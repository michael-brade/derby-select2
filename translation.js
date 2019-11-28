var $ = require('jquery');

// just for browserify
function __do_not_call() {
    require('./i18n/*.js', {mode: 'expand', resolve: 'strip-ext'});
}

export default class Translation {

    static _cache = {}

    constructor(dict) {
        this.dict = dict || {};
    }

    all() {
        return this.dict;
    }

    get(key) {
        return this.dict[key];
    }

    extend(translation) {
        this.dict = $.extend({}, translation.all(), this.dict);
    }

    static loadPath(path) {
        if (!(path in Translation._cache)) {
            var translations = require(path);

            Translation._cache[path] = translations;
        }

        return new Translation(Translation._cache[path]);
    }
}
