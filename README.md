![YABS.js](/logo.png?raw=true)

YABS.js is a lightweight JavaScript build system.

Version v0.0.0 (dev)

**⛔ WORK IN PROGRESS - NOT USABLE RIGHT NOW ⛔**

```
PROGRESS TOWARDS 1.0.0
[========= ] 95%
```

**⛔ WORK IN PROGRESS - NOT USABLE RIGHT NOW ⛔**

---

Please note that this is a "dumb" build system that only deals with individual files. It does not combine source files and it does not understand modules or `import`, `export` and `require` statements. What it does is roughly the following:

1. Clones the hierarchy of files provided, updating with newer files, into the output directory (typically "build/") as specified by the build instructions file.

2. Minifies (also optionally, preprocesses) provided JavaScript files, optionally attaches a custom header.

3. Matches `<script src="...">` attributes in the HTML files to the associated JS files, and updates those entries to match compiled filenames (basically changes extensions in those from .js to .min.js).

Please double (and triple) check your requirements to see if this featureset fits your needs and if it does not, use one of the more advanced build systems. It is unlikely that this system will be expanded beyond the scope of what it currently does.

---

## Dependencies

- [uglify-js](https://www.npmjs.com/package/uglify-js) ( install with "npm -g install uglify-js" )
- [preprocessor.js](https://www.npmjs.com/package/preprocessor) ( install with "npm -g install preprocessor" )

The preprocessor package is only needed if the build leverages the preprocessor in some way.

## How it works

YABS.js takes a single JSON file containing build instructions as an input. It then configures, prepares, and starts the build process. If the build is successful, you should see a "Build successful!" message at the end of the output.

## Basic usage

1. Drop `build.js` into your project root folder
2. Create a `build.json`
3. Execute with `node build.js`

YABS.js will default to `build.json` or `build_all.json` if the build instructions file is not explicitly provided as a parameter (meaning you can simply invoke the build with `node build.js`).

To pass a custom build instructions file, use a freestanding (not utilizing the `-` or `--` prefixes) parameter. The first such parameter is used as the build instructions file, for example: `node build.js mybuild.json`. Only one such parameter will be accepted - if you wish to build multiple things in one go, you can [use YABS.js in batch mode](#5-batch-building).

You can rename `build.js` to any arbitrary name, or you can use `yabs.js` with the full source instead.

## Minimal example

To demonstrate basic usage, we will need a structure of a basic web application, and we will need a build instructions file. The build instructions file is a plain JSON file with a few entries, let's name it `build.json` and add the following into it: 

```JSON
{
  "source_dir": "./",
  "destination_dir": "build/",
  "html": "index.html",
  "sources": [
    "src/script.js"
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

To add a custom header to the output script, we can add a `"header"` entry to individual `"sources"` entries. We need to change the structure slightly, and wrap the listing into another object, where we refer to the script file with a `"file"` entry:

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

We can add variables to output sourcefiles' headers. These are extracted from JSDoc tags in the sourcefile.

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

### 3. Using custom output filenames

You can use a custom output filename by adding a `"output_file"` entry into the `"sources"` listing. The `build_yabs.json` build instructions file demonstrates the use:

```JS
{
  "source_dir": "./",
  "destination_dir": "./",
  "sources": [
    {
      "file": "yabs.js",
      "output_file": "build.js",
      "header": [
        "/* YABS.js %version% (c) $YEAR$ %author%",
        " * https://github.com/pulzed/yabs.js",
        " * Licensed under the MIT license */"
      ]
    }
  ]
}
```

### 4. Using the preprocessor

To use preprocessor variables, first add a `"variables"` entry to individual `"sources"` entries in the build instructions JSON, for example:

 ```JSON
  "sources": [
    {
      "file": "src/script.js",
      "variables": {
        "debug": [
          "DEBUG=true"
        ]
      }
    }
  ]
```

Now, whenever the build is invoked with the `-debug` parameter, the preprocessor variables listed under `"debug"` entry will be applied when compiling `src/script1.js`. Any number of variables can be listed and processed this way. Same variables can be used across multiple source entries, in that case you can invoke the preprocessor for many sources at once with a single parameter.

Similarly to how the `"headers"` entry works, we can also add a global `"variables"` entry to the build instructions file that we can use across many different `"sources"` entries:

```JSON
  "variables": {
    "some_variables_key": {
      "debug": [
        "DEBUG=true"
      ]
    }
  }
```

Now we can refer to it using `"use_variables"` inside `"sources"`:

 ```JSON
  "sources": [
    {
      "file": "src/script.js",
      "use_variables": "some_variables_key"
    }
  ]
```

In the sourcefile, using the preprocessor might look something like this:

```JS
// #ifdef DEBUG
console.log('compiled with -debug');
// #else
console.log('not compiled with -debug');
// #endif
```

Note that `-debug` is not the actual variable, but an entry defined in the `"variables"` entry inside sources listing of the build instructions JSON. This entry defines the variables and their values used for this build.

Another feature you can use with the preprocessor are external file includes:

```JS
// #include "path/to/file.js"
```

By default, YABS.js will only run the preprocessor step whenever a variable group is both associated with a script file and invoked via the command line. If we want to leverage the preprocessor for includes only, we have to force the use of the preprocessor. We can do so by adding a `"preprocess"` entry to our source listing, and setting it to `true`:

```JS
  "sources": [
    {
      "file": "src/script.js",
      "preprocess": true
    }
  ]
```

This will force the compilation step for this particular source to always use the preprocessor.

### 5. Batch building

YABS.js can build in batch mode. To do so, create a `build_all.json` (you can name it anything, but this is a useful convention) and add a single entry named `"batch_build"`. Inside, list all your build instructions files in order you wish to have them built:

```JSON
  "batch_build": [
    "build_main.json",
    "build_other.json",
  ]
```

Any number of build instructions files can be bundled into the batch build. Note that if any of the builds in line fail, all subsequent builds will stop. To prevent this, use `--nofail` when invoking the build.

## Command line parameters

Available parameters are:

- `--nofail` - In a [batch build](#5-batch-building), keep going if one of the builds fails.

## Thanks

The [uglify-js](https://www.npmjs.com/package/uglify-js) and  [preprocessor.js](https://www.npmjs.com/package/preprocessor) packages.

## License

Copyright (c) 2023 Danijel Durakovic

MIT License
