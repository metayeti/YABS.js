![YABS.js](/logo.png?raw=true)

YABS.js is a lightweight JavaScript build system.

( **Currently in development** -- NOT production ready )

## Prerequisites

- [uglify-js](https://www.npmjs.com/package/uglify-js) ( install with "npm -g install uglify-js" )
- [preprocessor.js](https://www.npmjs.com/package/preprocessor) ( install with "npm -g install preprocessor" ) - only needed if the build leverages the preprocessor


## How it works

YABS.js takes a single JSON file containing build instructions as an input. It then verifies, prepares and invokes the build process.

## Basic usage

1) Drop `yabs.js` into your project root folder
2) Create a `build.json`
3) Execute with `node yabs.js`

If your build instructions file is called something other than `build.json` or `build_all.json`, use `node yabs.js mybuildfile.json`.

## Minimal example

To demonstrate basic usage, we will need a structure of a (very) basic web application, and we will need a build instructions file.

The build instructions file is a plain JSON file with a few entries, let's name it `build.json` and put the following into it: 

```JSON
{
  "source_dir": ".",
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

`source_dir` represents the source directory for the webapp that we wish to build.

`destination_dir` represents the build output directory.

`html` lists all associated HTML files.

`sources` lists all associated JavaScript files.

`files` list every other file associated with the webapp. Note the use of masks above: `img/*` means we wish to fetch all files in `img/`.

The hierarchy of files for this minimal build will look like this:
```
📁 css
  📜 style.css
📁 img
  📄 cat.jpg
  📄 dog.png
📁 src
  📜 script.js
📄 index.html
📄 build.json
📄 yabs.js
```

For now, it doesn't really matter what these files contain. Let's imagine they contain some code.

To build, simply call `node yabs.js` from the root and the build output will appear in the `build` folder. We don't need any additional parameters because YABS.js will default to `build.json` if it exists.

This is all we need to do to build a simple web application. In the following sections, we will go deeper into the structure of the build instructions JSON file.

## Build instructions file

There is a lot more that we can do with the build instructions JSON. Let's look at some examples.

### 1. Adding custom headers to scripts

To add a custom header to the output script, we can add a `header` entry to individual script files:

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

If we want to use the same header across many output sourcefiles, we can add a `headers` entry to the build instructions JSON:

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

We can add variables to output sourcefiles' headers. These are extracted from JSDoc-like meta-tags in the sourcefile:

At the top of the JS file, we might have something like this:

```JS
/**
 * @name Awesome sourcefile
 * @version 0.5.0
 * @author Scooby
 * @copyright_holder Big Corp
 * @license MIT
 */
```

We can now use these entries with our output headers using the `%variable%` notation:

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

The variable names are arbitrary and can be anything, as long as it matches the JSDoc-like meta-tag in the original sourcefile. They are required to be one single word without any spaces. If the variable is not found, it will be substituted with blank.

`$YEAR$` is a special variable that will output the current year.

If we have a shared `headers` entry in the build instructions file and we leverage variables in one of the headers, those variables will be individual-script specific. This means that every script that uses those headers should include the JSDoc-like meta-headers at the top of the file.

### 3. Using the preprocessor

To use the preprocessor, first add a `variables` entry to the build instructions JSON, for example:

 ```JSON
  "variables": {
    "debug": [
      "DEBUG=true"
    ]
  }
```

Now, every time a `-debug` parameter is invoked via the command line, the preprocessor variables listed under the `debug` entry will be used for the build.

### 4. Batch building

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
