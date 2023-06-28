![YABS.js](/logo.png?raw=true)

YABS.js is a lightweight JavaScript build system.

Version v1.1.0

## Dependencies

- [uglify-js](https://www.npmjs.com/package/uglify-js) ( install with "npm -g install uglify-js" )
- [MetaScript](https://www.npmjs.com/package/metascript) ( install with "npm -g install metascript" )

The MetaScript package is only needed if the build leverages the preprocessor in some way, otherwise you can ignore it.

## How it works

YABS.js takes a single JSON file containing build instructions as an input. It then configures, prepares, and starts the build process. If the build is successful, you should see a "Build finished!" message at the end of the output.

Please note that this is a "dumb" build system that only deals with files and not source code (apart from the mangling and compressing capacity provided by uglify-js). This system does not understand modules, `import`, `export` and `require` statements. What it does is roughly the following:

1. Clones the hierarchy of files provided, updating with newer files, into the output directory (typically "build/") as specified by the build instructions file.

2. Minifies (also optionally, preprocesses) provided JavaScript files and optionally attaches a custom header to minified outputs.

3. Matches `<script src="...">` attributes in the HTML files to the associated JS files and updates those entries to match compiled filenames (in practice this usually means the extensions .js get converted to .min.js, but you can also specify custom output filenames or bundle multiple scripts into one).

Please double check your requirements to see if this featureset fits your needs and if it does not, use one of the more advanced build systems. It is unlikely that this system will be expanded beyond the scope of what it currently does as it is purpose-built for my own projects. This software is provided as-is and as free and open source, but it is not currently open for contributions (mainly because the author considers it feature-complete and would rather spend time working on other projects). If you need to extend or modify the featureset that this software provides, consider forking this project.

## Basic usage

1. Drop `build.js` into your project root folder
2. Create a `build.json`
3. Execute with `node build.js`

YABS.js will default to `build_all.json` or `build.json` whenever the build instructions file is not explicitly provided as a parameter.

To pass a custom build instructions file, use a freestanding (not utilizing the `-` or `--` prefixes) parameter. The first such parameter is used as the build instructions file, for example: `node build.js mybuild.json`. Only one such parameter will be accepted. If you wish to build multiple things in one go, you can [use YABS.js in batch mode](#5-batch-building).

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
📄 build.js
```

For now, it doesn't really matter what these files contain. Let's imagine they contain some code and some data.

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
    "some_header_key": "/* this is a shared header! */"
  }
```

We can also use multiline headers with a global header definition:

```JSON
  "headers": {
    "some_header_key": [
      "/* This is a multiline",
      " * shared comment! */",
    ]
  }
```

When we set up a global header definition, we can refer to it with a `"use_header"` entry inside the `"sources"` entry:

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

We can add variables to output sourcefile headers. These are extracted from JSDoc tags in the sourcefile.

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

We can now use these entries with headers by using `%variable%` notation:

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

The header in the compiled sourcefile will become the following:
```JS
/* Minified Awesome sourcefile, v0.5.0
 * Written by Scooby, released under MIT
 * Copyright (c) 2023 Big Corp */
```

Variable names are arbitrary and can be anything as long as they match the JSDoc tags in the sourcefile. They are required to be one single word without any spaces, and they are case-sensitive.

`$YEAR$` is a special variable that outputs the current year.

If there is a shared `"headers"` entry in the build instructions file and we use variables in those, those variables will be relative to the individual scripts that use them. This means that every script that uses those headers has to include the associated JSDoc tags at the top of the file.

### 3. Additional options (custom output filenames and compile options)

You can use a custom output source filename by adding the `"output_file"` entry into a `"sources"` entry.

You can also control compile options by adding a `"compile_options"` entry. These options will be passed to the compiler directly. Default value for compile options is `"--mangle --compress"`. (See the [uglify-js](https://github.com/mishoo/UglifyJS) documentation for more options.)

The `build_yabs.json` build instructions file demonstrates the use of these features:

```JS
{
  "source_dir": "./",
  "destination_dir": "./",
  "sources": [
    {
      "file": "yabs.js",
      "output_file": "build.js",
      "compile_options": "--compress",
      "header": [
        "/* YABS.js %version% (c) $YEAR$ %author%",
        " * https://github.com/pulzed/yabs.js",
        " * Licensed under the MIT license */"
      ]
    }
  ]
}
```

The above build instructions file generates a "build.js" file (rather than yabs.min.js if the `"output_file"` entry was omitted), and it uses the "--compress" compiler option.

### 4. Bundling

YABS.js can bundle multiple script files into one single output file. To do so, add a `"bundle"` (rather than a `"file"`) entry inside a `"sources"` item:

```JSON
  "sources": [
    {
      "bundle": [
        "src/script1.js",
        "src/script2.js"
      ],
      "output_file": "script_combined.js",
      "header": "/* This is a combined script! */"
    }
  ]
```

When using bundles, the `"output_file"` parameter is required.

### 5. Using the preprocessor

The preprocessor adds a layer of metaprogramming that we can use when compiling sourcefiles.

To use preprocessor variables, first add a `"variables"` entry to individual `"sources"` entries in the build instructions file, for example:

 ```JSON
  "sources": [
    {
      "file": "src/script.js",
      "variables": {
        "debug": [
          "DEBUG=true"
        ],
        "nodebug": [
          "DEBUG=false"
        ]
      }
    }
  ]
```

Now, whenever the build is invoked with the `-debug` parameter, the preprocessor variables listed under `"debug"` entry will be applied when compiling the script. When the build is invoked with `-nodebug`, the variables listed under `"nodebug"` will be used instead. Any number of variables can be listed and processed this way. Same variables can be used across multiple source entries, in this case you can invoke the preprocessor for many sources at once with a single parameter.

Similarly to how the `"headers"` entry works, we can add a global `"variables"` entry to the build instructions file:

```JSON
  "variables": {
    "some_variables_key": {
      "debug": [
        "DEBUG=true"
      ],
      "nodebug": [
        "DEBUG=false"
      ]
    }
  }
```

Now we can refer to it with the `"use_variables"` entry inside a `"sources"` entry:

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
//? if (DEBUG) {
console.log('compiled with -debug');
//? } else {
console.log('compiled with -nodebug');
//? }
```

You can rearrange this scheme any way you see fit and use any other [MetaScript](https://github.com/dcodeIO/MetaScript) features. The preprocessor can be a little finicky when it comes to variables - for example, it will fail when encountering undefined variables. Special care should be exercised when setting up preprocessor conditions.

Note that `-debug` and `-nodebug` are not the actual variables used by the preprocessor, but an entry defined in the `"variables"` entry.

Another feature you can use with the preprocessor are external file includes:

```JS
//? include("path/to/file.js")
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

### 6. Batch building

YABS.js can build in batch mode. To do so, create a `build_all.json` (you can name it anything, but this is a useful convention) and add a single entry named `"batch_build"`. Inside, list all your build instructions files in order you wish to have them built:

```JSON
  "batch_build": [
    "build_main.json",
    "build_other.json"
  ]
```

Any number of build instructions files can be bundled into the batch build. Note that if any of the builds in line fail, all subsequent builds will stop. To prevent this, you can use `--nofail` when running the build.

If your build targets reside in a nested folder hierarchy and each of the targets contains a `build.json` file at the appropriate level, you can shorten the syntax and just point to the directory:

```JSON
  "batch_build": [
    "some/subfolder/",
    "another/subfolder/"
  ]
```

When invoking preprocessor parameters via the command line, they will be applied to all builds in the batch build which may be undesirable in certain circumstances. To avoid this, we can restructure the batch build instructions, wrapping it in an object, pointing to the build instructions file via a `"file"` entry and adding an `"options"` entry to the object. The options listed there will override command line options and will be used when running that specific build:

```JSON
  "batch_build": [
    {
      "file": "build_main.json",
      "options": "-debug -another_param"
    },
    "build_other.json"
  ]
```

## Command line parameters

Available parameters are:

- `--nofail` In a [batch build](#5-batch-building), keep going if one of the builds fails.
- `--version` Displays version info.
- `--help` Opens online help.

## Thanks

The [uglify-js](https://www.npmjs.com/package/uglify-js) and [MetaScript](https://www.npmjs.com/package/metascript) packages.

## License

Copyright (c) 2023 Danijel Durakovic

MIT License
