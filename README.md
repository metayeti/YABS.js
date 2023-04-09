![YABS.js](/logo.png?raw=true)

YABS.js is a lightweight JavaScript build system.

( **Currently in development** -- NOT production ready )

## Prerequisites

- [uglify-js](https://www.npmjs.com/package/uglify-js) ( install with "npm -g install uglify-js" )
- [preprocessor.js](https://www.npmjs.com/package/preprocessor) ( install with "npm -g install preprocessor" ) - only needed if the build leverages the preprocessor


## How it works

YABS.js takes a single JSON file containing the build instructions as an input. It then verifies, prepares and invokes the build process.

## Basic usage

1) Drop `yabs.js` into your project root folder
2) Create a `build.json`
3) Execute with `node yabs.js`

If your build instructions file is called something other than `build.json` or `build_all.json`, use `node yabs.js mybuild.json`.

## Minimal example

todo

## License

Copyright (c) 2023 Danijel Durakovic

MIT License
