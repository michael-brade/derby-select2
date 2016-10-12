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
    lodash: '4.x'
    jquery: '3.x'
    mixwith: '*'

devDependencies:
    'node-sass': '3.10.x'
    'uglify-js': '2.7.x'
    'html-minifier': '3.x'
    'babel-cli': '6.x'
    'babel-preset-es2015': '6.x'

peerDependencies:
    'derby': 'michael-brade/derby'



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
