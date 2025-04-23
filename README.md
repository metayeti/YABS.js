![YABS.js](/logo.png?raw=true)

YABS.js is a single-file, minimalistic, general-purpose and old-school to the bones build system for JavaScript projects.

v1.2.0

## Overview

This is a very specific build system which may not find much use in most modern JS environments. It can however be useful for legacy, pre-modular codebases or certain special cases. This build system is capable of updating your `<script src="...">` lines across HTML files, and it can do some source processing like minifying, preprocessing or gluing codefiles together (it implements a primitive bundler), but it does not actually parse the code at any point, so it doesn't know about your import and export statements, which makes this build system suited mostly for non-modular codebases. This build system does not require your project to depend on node.js. The system itself does use node to run, but all its dependencies are installed globally and you can use it as you would any other utility script simply by invoking `node build`.

## tl;dr

For modern JS development prefer esbuild, vite or similar. If you have specific needs that are met by this system, or your project is legacy-bound and/or non-modular, then this system may work out for you.

## Features

- Delightfully easy to use: drop `build.js` into your project, describe your build with `build.json` and run your build with `node build`
- Script minification and bundling
- Can prepend info headers (with copyright and such) to compiled scripts
- Adds preprocessor superpowers
- Build events
- Batch building
- [And more!](/HOWTO.md)

## Reference

Please see [HOWTO.md](/HOWTO.md) for a detailed overview.

## Contribution

This program is currently not open to contributions (mainly because the author considers it feature-complete and would prefer to spend time working on other projects). It is unlikely that this system will be expanded beyond the scope of its current capabilities. If you need to extend or modify the featureset that this software provides, please consider forking this project.

## Credits

This project exists thanks to the [uglify-js](https://www.npmjs.com/package/uglify-js) and [MetaScript](https://www.npmjs.com/package/metascript) packages.

## License

Copyright © 2024 Danijel Durakovic

Licensed under the terms of the [MIT license](LICENSE).
