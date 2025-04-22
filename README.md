![YABS.js](/logo.png?raw=true)

YABS.js is a single-file, minimalistic, general-purpose and old-school to the bones build system for JavaScript projects.

v1.2.0

## tl;dr

This is a very specific build system which can come useful for historic codebases (that don't use modules). This build system can update your `<script>` elements in HTML files and it can do some processing on your script files, but it does not actually parse the code and look for import and export statements. It can be used in some very specific contexts, for example pure JS codebases which you simply want compiled and detached from the node ecosystem (even though this build system requires node, it can however exist entirely detached from your project given that its dependencies are installed globally and not locally).

If you're doing modern JS development, use esbuild, vite or similar. If you have very specific or legacy-bound needs, this system may work for you.

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
