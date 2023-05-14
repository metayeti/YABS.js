![YABS.js](/logo.png?raw=true)

YABS.js is a lightweight JavaScript build system.

Version v0.0.0

**(WORK IN PROGRESS - NOT USABLE RIGHT NOW)**

---

Please note that this is a "dumb" build system which only deals with individual files. It does not combine source files and it does not understand `import`, `export` or `require`. What it does is, roughly, the following:

1. Clones the hierarchy of files provided, updating only newer files into the output directory, typically "build/"

2. Minifies (and optionally, preprocesses) provided JavaScript files, optionally with a custom header

3. Matches the `<script src="...">` attributes in the provided HTML files to JS files and update theose entries (to .min.js)

---

Please double and triple check your requirements to see if this behavior and featureset fits your needs. If it does not, then use one of the more advanced build systems. It is unlikely that this system will be expanded beyond the scope of what it currently does, because it is a system specifically tailored to my personal needs. (You may use it as you see fit but please don't assume additional functionality to have a high chance of materializing.)

## Dependencies

- [uglify-js](https://www.npmjs.com/package/uglify-js) ( install with "npm -g install uglify-js" )
- [preprocessor.js](https://www.npmjs.com/package/preprocessor) ( install with "npm -g install preprocessor" )

The preprocessor package is only needed if the build leverages the preprocessor.

## How it works

YABS.js takes a single JSON file containing build instructions as an input. It then configures, verifies, and invokes the build process.

## Basic usage

1. Drop `build.js` into your project root folder
2. Create a `build.json`
3. Execute with `node build.js`

YABS.js will default to `build.json` or `build_all.json` if a build instructions file is not explicitly given via a parameter.

To pass a custom build instructions file use a freestanding (not utilizing the `-` or `--` prefixes) parameter. The first such parameter is used as the instructions file, for example: `node build.js mybuildfile.json`

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

- `"source_dir"` represents the source directory for the web application that we wish to build. The value `"./"` means the source directory is the same as the root directory which contains `build.js`.

- `"destination_dir"` represents the build output directory. In this case, we will output everything into the `build` directory. If this directory doesn't exist at build time, it will be created.

- `"html"` lists all HTML files associated with the web application. It can be a plain string or a list of files. Files listed in this entry will have their `<source>` tags appropriately matched and transformed to target sourcefiles (if you wish to skip this effect, then list the html files in `"files"` instead).

- `"sources"` lists all JavaScript files that we want to build and process. 

- `"files"` lists all other files associated with the web application. This can be a plain file list, or it can include basic pattern masks. In the example above, `"img/*"` means we wish to fetch everything in the `img/` directory. A `*` mask means we want to capture the contents of the directory plus all its subdirectories and their content. A `*.*` would only capture all files within the directory, skipping subdirectories. A `*.txt` would only capture files with `.txt` extension in the directory, skipping subdirectories. Please note that masks can only be used in the `"files"` entry.

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

To build, simply call `node build.js` from the root and the build output will appear in the `build` folder. We don't need any additional parameters because YABS.js will default to `build.json` if it exists.

This is all we need to do to build a simple web application. In the following sections, additional capabilities of the build instructions file will be explained.

## Build instructions file

There is more that we can accomplish with the build instructions file. Let's look at some examples.

### 1. Adding custom headers to scripts

Sometimes, we want to add copyright information or other relevant information in the minified output scripts.

To add a custom header to the output script, we can add a `"header"` entry to individual script files. We need to change the structure slightly, and wrap the listing into another object, where we refer to the script file with a `file` entry:

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

If we want to use the same header across many output files, we can add a `"headers"` entry to the build instructions file:

```JSON
  "headers": {
    "some_header_key": [
      "/* this is a shared header */"
    ]
  }
```

Then we can refer to it using `"use_header"` inside `"sources"`:

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

If there is a shared `"headers"` entry in the build instructions file and we use variables in those, those variables will be related to the individual scripts that use them. This means that every script that uses those headers should include the associated JSDoc tags at the top of the file.

### 3. Using the preprocessor

To use the preprocessor, first add a `"variables"` entry to the build instructions JSON, for example:

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

When the build is now invoked with the `-debug` parameter, the preprocessor variables listed under the `"debug"` entry will be applied to the build. Any number of variables can be listed and processed this way.

In the sourcefile, using the preprocessor might look something like this:

```JS
// #ifdef DEBUG
console.log('compiled with -debug');
// #else
console.log('compiled with -nodebug (or omitting -debug)');
// #endif
```

### 4. Batch building

YABS.js can build in batch mode. To do so, create a `build_all.json` (you can name it anything, but this is a useful convention) and add a single entry named `"batch_build"`. Inside, list all your build instructions files in order you wish to have them built:

```JSON
  "batch_build": [
    "build_main.json",
    "build_other.json",
  ]
```

Any number of build instructions files can be bundled into the batch build. Note that if any of the builds in line fail, all subsequent builds will stop. To prevent this, use `--nofail` when invoking the build.

## License

Copyright (c) 2023 Danijel Durakovic

MIT License
