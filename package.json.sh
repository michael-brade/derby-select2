#!/usr/local/bin/lsc -cj

name: 'derby-select2'
description: 'Native DerbyJS replacement for jQuery Select2'
version: '0.3.0'

author:
    name: 'Michael Brade'
    email: 'brade@kde.org'

keywords:
    'derby'
    'select2'
    'jquery'
    'racer'

repository:
    type: 'git'
    url: 'michael-brade/derby-select2'

main: 'core.js'

style: 'index.css'

files:
    'css/'
    'data/base.js'
    'data/model.js'
    'dropdown/search.js'
    'dropdown/search.html'
    'selection/base.js'
    'selection/single.js'
    'selection/single.html'
    'selection/multiple.js'
    'selection/multiple.html'
    'selection/multiplereorder.js'
    'selection/search.js'
    'selection/search.html'
    'selection/template.html'
    'core.js'
    'core.html'
    'keys.js'
    'results.js'
    'results.html'
    'index.css'


dependencies:
    sortablejs: '1.10.x'

    # utils
    lodash: '4.17.x'
    jquery: '3.4.x'
    mixwith: '*'

devDependencies:
    'bootstrap-sass': '3.4.x'
    'sass': '1.23.x'
    'uglify-js': '3.7.x'
    'html-minifier': '4.x'

    '@babel/core': '7.7.x'
    '@babel/register': '7.7.x'
    '@babel/preset-env': '7.7.x'
    '@babel/plugin-proposal-class-properties': '7.7.x'

peerDependencies:
    'derby': 'michael-brade/derby'


babel:
    plugins:
        * '@babel/plugin-proposal-class-properties'
        ...
    presets:
        * '@babel/preset-env'
            targets:
                node: 'current'
                browsers: '> 0.5%, not dead'
        ...


eslintConfig:
    env:
        browser: true
        node: true
        jquery: true

    parserOptions:
        ecmaVersion: 2015
        sourceType: 'module'
        ecmaFeatures:
            impliedStrict: true


scripts:
    ## building

    # make sure a stash will be created and stash everything not committed
    # beware: --all would be really correct, but it also removes node_modules, so use --include-untracked instead
    prebuild: '
        npm run clean;
        touch .create_stash && git stash save --include-untracked "npm build stash";
        npm test || { npm run postbuild; exit 1; };
    '

    # build the distribution under dist: create directory structure, transpile, uglify
    build: "
        export DEST=dist;
        export SOURCES='*.js';
        export VIEWS='*.html';
        export ASSETS='.*\.scss|./README\.md|./package\.json';
        export IGNORE=\"./$DEST|./test|./node_modules|./docs\";

        echo \"\033[01;32mCompiling and minifying...\033[00m\";
        find -regextype posix-egrep -regex $IGNORE -prune -o -name \"$SOURCES\" -print0
        | xargs -n1 -P8 -0 sh -c '
            echo $0...;
            mkdir -p \"$DEST/`dirname $0`\";
            babel \"$0\" | uglifyjs -cm -o \"$DEST/$0\"';

        echo \"\033[01;32mMinifying views...\033[00m\";
        find -regextype posix-egrep -regex $IGNORE -prune -o -name \"$VIEWS\" -print0
        | xargs -n1 -P8 -0 sh -c '
            echo \"$0 -> $DEST/$0\";
            mkdir -p \"$DEST/`dirname $0`\";
            html-minifier --config-file .html-minifierrc -o \"$DEST/$0\" \"$0\"'
        | column -t -c 3;

        sass -I node_modules/bootstrap-sass/assets/stylesheets -I css index.scss -s compressed --no-source-map $DEST/index.css;

        echo \"\033[01;32mCopying assets...\033[00m\";
        find -regextype posix-egrep -regex $IGNORE -prune -o -regex $ASSETS -print0
        | xargs -n1 -0 sh -c '
            echo \"$0 -> $DEST/$0\";
            mkdir -p \"$DEST/`dirname \"$0\"`\";
            cp -a \"$0\" \"$DEST/$0\"'
        | column -t -c 3;

        echo \"\033[01;32mDone!\033[00m\";
    "
    # restore the original situation
    postbuild: 'git stash pop --index && rm .create_stash;'

    clean: "rm -rf dist;"   # the ; at the end is very important! otherwise "npm run clean ." would delete everything

    ## docs

    docs: "
        npm run build;
        export DEST=docs;
        cd dist; browserify -s Select2 core.js -o ../$DEST/select2.js; cd ..;
        cp dist/index.css $DEST/css/index.css;
        mkdir -p $DEST/selection $DEST/dropdown;
        cp -a selection/*.html $DEST/selection;
        cp -a dropdown/*.html $DEST/dropdown;
        cp -a core.html results.html $DEST;
    "

    ## testing

    test: 'echo "TODO: no tests specified yet";'

    ## publishing
    release: "npm run build; cd dist; npm publish;"

engines:
    node: '12.x'

license: 'MIT'

bugs:
    url: 'https://github.com/michael-brade/derby-select2/issues'

homepage: 'https://github.com/michael-brade/derby-select2#readme'
