#!/usr/bin/env bash

echo "Installing theme dependencies..."

cd $1/themes/custom/pl_drupal

npm rebuild node-sass
composer update
npm install
gulp sass
# php core/console --generate
exit $?
