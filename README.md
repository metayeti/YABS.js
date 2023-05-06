![YABS.js](/logo.png?raw=true)

YABS.js is a lightweight JavaScript build system.

(  **Currently in development** -- NOT production ready )

## Dependencies

- [uglify-js](https://www.npmjs.com/package/uglify-js) ( install with "npm -g install uglify-js" )
- [preprocessor.js](https://www.npmjs.com/package/preprocessor) ( install with "npm -g install preprocessor" )

The preprocessor package is only needed if the build leverages the preprocessor.

## How it works

YABS.js takes a single JSON file containing build instructions as an input. It then verifies, prepares and invokes the build process.

## Basic usage

1) Drop `yabs.js` into your project root folder
2) Create a `build.json`
3) Execute with `node yabs.js`

YABS.js will default to `build.json` or `build_all.json` when no build instructions file is provided. If your build instructions file is named something else, use `node yabs.js mybuildfile.json`.

## Minimal example

To demonstrate basic usage, we will need a structure of a basic web application, and we will need a build instructions file. The build instructions file is a plain JSON file with a few entries, let's name it `build.json` and add the following into it: 

```JSON
{
  "source_dir": "./",
  "destination_dir": "build/",
  "html": "index.html",
  "sources": [
    "src/srcipt.js"
  ],
  "files": [
    "css/style.css",
    "img/*"
  ]
}
```

`source_dir` represents the source directory for the web application that we wish to build. The value `"./"` means the source directory is the same as the root directory where `yabs.js` resides.

`destination_dir` represents the build output directory. In this case, we will output everything into the `build` directory. If this directory doesn't exist, it will be automatically created.

`html` lists all HTML files associated with our web application. It can be a plain string or a list of files.

`sources` lists all associated JavaScript files.

`files` list all other file associated with the web application. Note the use of masks above: `"img/*"` means we wish to fetch all files in the `img/` directory.

The hierarchy of files for this minimal build will look like this:
```
📁 css
  📄 style.css
📁 img
  📄 cat.jpg
  📄 dog.png
📁 src
  📄 script.js
📄 build.json
📄 index.html
📄 yabs.js
```

For now, it doesn't really matter what these files contain. Let's imagine they contain some code.

To build, simply call `node yabs.js` from the root and the build output will appear in the `build` folder. We don't need any additional parameters because YABS.js will default to `build.json` if it exists.

This is all we need to do to build a simple web application. In the following sections, additional capabilities of the build instructions file will be explained.

## Build instructions file

There is more that we can accomplish with the build instructions file. Let's look at some examples.

### 1. Adding custom headers to scripts

Sometimes, we want to add copyright information or other relevant information in the minified output scripts.

To add a custom header to the output script, we can add a `header` entry to individual script files. We need to change the structure slightly, and wrap the listing into another object, where we refer to the script file with a `file` entry:

```JSON
  "sources": [
    {
      "file": "src/script.js",
      "header": "/* This is a minified script! */"
    }
  ]
```

We can make the header multiline:

```JSON
  "sources": [
    {
      "file": "src/script.js",
      "header": [
        "/* This is a",
        " * multiline header comment",
        " * in a minified script! */",
      ]
    }
  ]
```

If we want to use the same header across many output files, we can add a `headers` entry to the build instructions file:

```JSON
  "headers": {
    "some_header_key": [
      "/* this is a shared header */"
    ]
  }
```

Then we can refer to it using `use_header` inside `sources`:

```JSON
  "sources": [
    {
      "file": "src/script1.js",
      "use_header": "some_header_key"
    },
    {
      "file": "src/script2.js",
      "use_header": "some_header_key"
    }
  ]
```

### 2. Adding variables to custom headers

We can add variables to output sourcefiles' headers. These are extracted from JSDoc tags in the sourcefile:

At the top of the JS file, we will add something like this:

```JS
/**
 * @name Awesome sourcefile
 * @version 0.5.0
 * @author Scooby
 * @copyright_holder Big Corp
 * @license MIT
 */
```

We can now use these entries with our output headers using `%variable%` notation:

```JSON
  "sources": [
    {
      "file": "src/script.js",
      "header": [
        "/* Minified %name%, v%version%",
        " * Written by %author%, released under %license%",
        " * Copyright (c) $YEAR$ %copyright_holder% */",
      ]
    }
  ]
```

The header in the output sourcefile will be the following:
```JS
/* Minified Awesome sourcefile, v0.5.0
 * Written by Scooby, released under MIT
 * Copyright (c) 2023 Big Corp */
```

The variable names are arbitrary and can be anything, as long as they match the JSDoc tags in the sourcefile. They are required to be one single word without any spaces, and they are case-sensitive.

`$YEAR$` is a special variable that outputs the current year.

If there is a shared `headers` entry in the build instructions file and we use variables in those, those variables will be related to the individual scripts that use them. This means that every script that uses those headers should include the associated JSDoc tags at the top of the file.

### 3. Using the preprocessor

To use the preprocessor, first add a `variables` entry to the build instructions JSON, for example:

 ```JSON
  "variables": {
    "debug": [
      "DEBUG=true"
    ],
    "nodebug": [
      "DEBUG=false"
    ]
  }
```

Now, every time a `-debug` parameter is invoked via the command line, the preprocessor variables listed under the `debug` entry will be used for the build. Any number of variables can be listed and processed this way.

In the sourcefile, this might look something like this:

```JS
// #ifdef DEBUG
console.log('compiled with -debug');
// #else
console.log('compiled with -nodebug');
// #endif
```

### 4. Batch building

YABS.js can build in batch mode. To do so, create a `build_all.json` (it doesn't have to be called like that, but it's a useful convention) and add a single entry named `batch_build`. Inside, list all your build instructions files:

```JSON
  "batch_build": [
    "build_main.json",
    "build_other.json",
  ]
```

To start the build, use `node yabs.js build_all.json` (or just `node yabs.js` if you only have `build_all.json`, but not `build.json` in the root directory). This will start the `build_main.json` build first, and then the `build_other.json` build right after. Any number of build instructions files can be bundled into the batch build. Note that if any of the builds fail, all subsequent builds will stop. To prevent this, you can use `--nofail` when starting the build.

## License

Copyright (c) 2023 Danijel Durakovic

MIT License
