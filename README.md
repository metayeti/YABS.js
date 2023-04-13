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

If your build instructions file is called something other than `build.json` or `build_all.json`, use `node yabs.js mybuildfile.json`.

## Minimal example

todo

## Build instructions JSON



## Using the preprocessor

To use the preprocessor, first add a `variables` entry to the build instructions JSON, for example:

 ```JSON
	"variables": {
		"debug": [
			"DEBUG=true"
		]
	}
```

Now, every time a `-debug` parameter is invoked via the command line, the preprocessor variables listed under the `debug` entry will be used for the build.

## Batch building

YABS.js can build in batch mode. To do so, create a `build_all.json` (it doesn't have to be called like that, but it's a useful convention) and add a single entry called `batch_build`. Inside, list all your build instructions files:

```JSON
	"batch_build": [
		"build_main.json",
		"build_other.json",
	]
```

To invoke, use `node yabs.js build_all.json`. This will invoke building `build_main.json` first, and then `build_other.json` right after. Any number of build instructions can be bundled into the batch build. Note that if any of the builds fail, the entire batch build will fail. To prevent this, you can use `--nofail` when invoking the build.

By default (unless specified otherwise via the command line), YABS.js will try to find `build.json` first. If it doesn't, it will try to find `build_all.json`. So you can make YABS.js default to `build_all.json` by simply having only that file in the root directory.

## License

Copyright (c) 2023 Danijel Durakovic

MIT License
