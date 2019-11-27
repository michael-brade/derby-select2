#!/usr/local/bin/lsc -cj

name: 'derby-select2'
description: 'Native Derby JS replacement for jQuery Select2'
version: '0.2.3'

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

dependencies:
    # utils
    lodash: '4.17.x'
    jquery: '3.4.x'
    mixwith: '*'

devDependencies:
    'node-sass': '4.13.x'
    'uglify-js': '3.6.x'
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
    # TODO: compile scss to dist/css
    build: "
        export DEST=dist;
        export SOURCES='*.js';
        export VIEWS='*.html';
        export ASSETS='.*\.scss|./README\.md|./package\.json';
        export IGNORE=\"./$DEST|./test|./node_modules\";

        echo \"\033[01;32mCompiling and minifying...\033[00m\";
        find -regextype posix-egrep -regex $IGNORE -prune -o -name \"$SOURCES\" -print0
        | xargs -n1 -P8 -0 sh -c '
            echo $0...;
            mkdir -p \"$DEST/`dirname $0`\";
            babel \"$0\" | uglifyjs - -cm -o \"$DEST/$0\"';

        echo \"\033[01;32mMinifying views...\033[00m\";
        find -regextype posix-egrep -regex $IGNORE -prune -o -name \"$VIEWS\" -print0
        | xargs -n1 -P8 -0 sh -c '
            echo \"$0 -> $DEST/$0\";
            mkdir -p \"$DEST/`dirname $0`\";
            html-minifier --config-file .html-minifierrc -o \"$DEST/$0\" \"$0\"'
        | column -t -c 3;

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

    ## testing

    test: 'echo "TODO: no tests specified yet";'

    ## publishing
    release: "npm run build; cd dist; npm publish;"

engines:
    node: '6.x'

license: 'MIT'

bugs:
    url: 'https://github.com/michael-brade/derby-select2/issues'

homepage: 'https://github.com/michael-brade/derby-select2#readme'
