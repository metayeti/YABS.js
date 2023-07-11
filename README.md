![YABS.js](/logo.png?raw=true)

YABS.js is a lightweight JavaScript build system.

v1.1.0 dev

## How it works

YABS.js takes a single JSON file containing build instructions as an input. It then configures, prepares, and runs the build process. If the build is successful, you should see a "Build finished!" message at the end of the output.

Please note that this is a relatively simplistic, content-unaware build system which only deals with files and not source code directly (apart from the mangling and compressing capabilities provided by [uglify-js](https://www.npmjs.com/package/uglify-js) and preprocessing which is delegated to [MetaScript](https://www.npmjs.com/package/metascript)). This build system does not understand modules, `import`, `export` and `require` statements. What it does is roughly the following:

1. Clones the hierarchy of files provided, updating with newer files (skipping files that didn't change since the last build), into the output directory (typically "build/" or "release/" or equivalent) as specified by the build instructions file.

2. Minifies (and optionally, preprocesses or bundles) provided JavaScript sources and optionally attaches a custom header to the minified outputs.

3. Matches `<script src="...">` attributes in the HTML files to the associated JS files and updates those entries to match compiled filenames (in practice this usually means the extensions .js get converted to .min.js, but you can also specify custom output filenames or bundle multiple scripts into one).

Please double check your requirements to see if this featureset fits your needs and if it does not, use one of the more advanced build systems. It is unlikely that this system will be expanded beyond the scope of its current capabilities. This software is provided as-is as free and open source software but it is not currently open for contributions (mainly because the author considers it feature-complete and would rather spend time working on other projects). If you need to extend or modify the featureset that this software provides, please consider forking this project instead.

## Dependencies

- [uglify-js](https://www.npmjs.com/package/uglify-js) ( install with "npm -g install uglify-js" )
- [MetaScript](https://www.npmjs.com/package/metascript) ( install with "npm -g install metascript" )

The MetaScript package is only needed if the build leverages the preprocessor in some way.

## Basic usage

1. Drop `yabs.js` or `build.js` into your project's root folder.
2. Create a `build.json` file.
3. Execute with `node yabs.js` or `node build.js`.

The `build.js` file is a compiled version of `yabs.js` - you can use either for your projects.

YABS.js will default to `build_all.json` or `build.json` (in that order) if the build instructions file is not explicitly provided as a command line parameter.

To pass a custom build instructions file, invoke YABS.js with a parameter: `node yabs.js build_something.json`.

Only one such parameter will be accepted. If you wish to build multiple things in one go, you can use YABS.js in [batch mode](#5-batch-building).

## Minimal example

To demonstrate basic usage, we will need a structure of a basic web application, and we will need a build instructions file. The build instructions file is a plain JSON file with some entries, let's name it `build.json` and write the following inside: 

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

The entries above represent the following concepts:

- `"source_dir"` represents the source directory for the project we are building. The value `"./"` means that the source directory is the same as the root directory (directory which contains `yabs.js` or `build.js` if using the compiled version - in this example we use `yabs.js` for clarity to distinguish it clearly from `build.json`).

- `"destination_dir"` represents the build output directory. In this case, we will output everything into the `build/` directory. If this directory doesn't exist at build time, it will be created.

- `"html"` lists all HTML files associated with the web application. This can be a plain string with a single file like used above, or it can be a list of many files. Files listed in this entry will have their `<source>` tags appropriately matched and changed to compiled sourcefiles.

- `"sources"` lists all JavaScript files that we want to build and process.

- `"files"` lists all other files associated with the web application that we do not wish to process in any way, just have them copied over into the build output. This entry can be a plain file list pointing to individual files, or it can include basic pattern masks. In the example above, `"img/*"` means we wish to fetch everything in the `img/` directory. A `*` mask means we want to capture the contents of the directory plus all its subdirectories and their content. A `*.*` mask would only capture all files within the directory, but it would skip any subdirectories. A `*.txt` would only capture files with `.txt` extension in the directory, also skipping subdirectories. Please note that masks can only be used in the `"files"` entry.

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

For now, it doesn't really matter what these files contain. Let's imagine they contain some code and some data.

To build, you can now simply invoke `node yabs.js` from the root of the project to start the build. The build output will appear in the `build/` folder.

This is all we need to do to build a simple web application. In the following sections, additional capabilities of the build instructions file will be explained.

## Build instructions file

There is more that we can accomplish with the build instructions file. Let's look at some examples.

### 1. Adding custom headers to scripts

Sometimes, we may want to add copyright information or other relevant information in the minified output scripts in the form of a commented header.

To add a custom header to the output script, we can add a `"header"` entry to individual `"sources"` entries. To do so, first we need to change the structure slightly by wrapping the listing into an object and referring to the script file using a `"file"` entry:

```JSON
  "sources": [
    {
      "file": "src/script.js",
      "header": "/* This is a minified script! */"
    }
  ]
```

We can make the header multiline by changing it into a list:

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

Sometimes we may want to use the same header across many output files. In this case we can add a `"headers"` entry to the build instructions file:

```JSON
  "headers": {
    "some_header": "/* this is a shared header! */",
    "some_multiline_header": [
      "/* This is a multiline",
      " * shared header! */",
    ]
  }
```

We can then refer to these entries by using a `"use_header"` entry inside a `"sources"` entry:

```JSON
  "sources": [
    {
      "file": "src/script1.js",
      "use_header": "some_header"
    },
    {
      "file": "src/script2.js",
      "use_header": "some_multiline_header"
    }
  ]
```

### 2. Adding variables to custom headers

We can use variables with script headers, which may help us add dynamic data to the headers, such as versions and copyright information. The valuables for these values are extracted from JSDoc tags in the sourcefiles, which are typically the first thing in the source file.

To begin, at the top of the JavaScript sourcefile, we will add something like this:

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

Variable names are arbitrary and can be anything as long as they match the JSDoc tags in the sourcefile. They are only required to be one single word without spaces, and they are case-sensitive.

`$YEAR$` is a special variable that outputs the current year.

If there is a shared `"headers"` entry in the build instructions file and we use variables in those, those variables will be relative to the individual scripts that use them. This means that every script that uses those headers has to include the matching JSDoc tags.

### 3. Additional options (output filenames and compile options)

You can use a custom output source filename by adding the `"output_file"` entry into `"sources"` entry.

Note that `"output_file"` needs to always also include the relative directory you want it to be in (this is to prevent ambiguity in cases where we wish to output the file into a different directory than the original had, which YABS.js is capable of). A good rule of thumb to follow is that when your `"file"` entry includes relative paths, then so should the `"output_file"` entry. For example:

```JSON
{
  "source_dir": "./",
  "destination_dir": "build/",
  "sources": [
    {
      "file": "src/script.js",
      "output_file": "src/script-custom-name.min.js",
    }
  ]
}
```

This will take the source file at "/src/script.js" and compile it into "build/src/script-custom-name.min.js".

You can also control compile options by adding a `"compile_options"` entry. These options will be passed to the compiler directly. Default value for compile options is `"--mangle --compress"`. (See the [uglify-js](https://github.com/mishoo/UglifyJS) documentation for more options.)

The `build_yabs.json` build instructions file demonstrates the use of these features:

```JSON
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

The above build instructions file generates a "build.js" file (rather than the default "yabs.min.js" if the `"output_file"` entry was omitted), and it uses the "--compress" compiler option rather than the default "--mangle --compress". A brief explanation of these options is that --compress will simply eliminate whitespace and comments whereas --mangle will also rename variables to their shortest forms. The reason YABS.js uses --compress only is so the code can be beautified easily and audited for safety.

### 4. Using the preprocessor

The preprocessor adds a layer of metaprogramming facilities which we can utilize when compiling sourcefiles. This adds a lot of power to our build process. For example, we can use preprocessor variables to control which code inside of a sourcefile gets compiled into the final output file. This way we can for example add debugging features which we using during development, and which we can then skip in the final release build. There is a lot more we can do with the preprocessor, but YABS.js primarily focuses on preprocessor variables.

To use preprocessor variables, first add a `"variables"` entry to any individual `"sources"` entry. Inside, list all the variables that you wish to use when certain command line parameters are invoked. For example:

 ```JSON
  "sources": [
    {
      "file": "src/script.js",
      "variables": {
        "debug": [
          "DEBUG=true"
        ],
        "release": [
          "RELEASE=true"
        ]
      }
    }
  ]
```

Using the entries above, now we can invoke the build using a `-debug` or a `-release` parameter, like this: `node yabs.js -debug` (with a single `-`). Whenever we use one of these parameters, the variables listed in their corresponding entries, will be used when invoking the preprocessor. Any number of parameters and variables may be listed this way.

You can use the same name across many different source entries and in this case you can invoke the preprocessor for many sources at once by using a single parameter on the command line.

Similarly to how a global `"headers"` entry works, we can add a global `"variables"` entry to the build instructions file:

```JSON
  "variables": {
    "some_variables_key": {
      "debug": [
        "DEBUG=true"
      ],
      "release": [
        "RELEASE=true"
      ]
    }
  }
```

Then we can refer to it with a `"use_variables"` entry inside a `"sources"` entry:

 ```JSON
  "sources": [
    {
      "file": "src/script.js",
      "use_variables": "some_variables_key"
    }
  ]
```

The above is equivalent to declaring the variable listing from within the `"source"` entry, however if you have many sourcefiles where you end up using the same variables, this might be a better way of creating such listings.

Inside the sourcefile, using the preprocessor might look something like this:

```JS
//? if (DEBUG) {
console.log('compiled with -debug');
//? } else if (RELEASE) {
console.log('compiled with -release');
//? }
```

Using the above code, the program will respond differently when a build is invoked via `node yabs.js -debug` or `node yabs.js -release`.

Note that this is not typically a good way of separating debug from release builds, you might consider creating a `build_debug.json` and `build_release.json` instead.

Another feature you can use with the preprocessor are external file includes:

```JS
//? include("path/to/file.js");
```

Note that when using features other than variables, you will have to add a flag that forces YABS.js to preprocess a certain source on every build.

By default, YABS.js will only run the preprocessor step whenever a variable group is both associated with a specific script file and also invoked via the command line. This means that if list a `DEBUG` group, we can invoke `node yabs.js` and the preprocessor won't be used, but if we invoke it with `node yabs.js -debug`, then the preprocessor will kick in and the `DEBUG` group will be used.

If we want to leverage the preprocessor for other features, we have to force the use of the preprocessor. We can do so by adding a `"preprocess"` entry to a `"source"` entry, and setting it to `true`:

```JS
  "sources": [
    {
      "file": "src/script.js",
      "preprocess": true
    }
  ]
```

This will force the compilation step for this particular source to always use the preprocessor.

You are free to utilize any other [MetaScript](https://github.com/dcodeIO/MetaScript) features available - the sky is the limit.

### 5. Bundling scripts

YABS.js can bundle multiple script files into one single output file. To do so, add a `"bundle"` (rather than a `"file"`) entry inside a `"sources"` item:

```JSON
  "sources": [
    {
      "bundle": [
        "src/script1.js",
        "src/script2.js"
      ],
      "output_file": "src/script_combined.js",
      "header": "/* This is a combined script! */"
    }
  ]
```

Bundles are processed and glued together in order they were listed in.

When using bundles, the `"output_file"` parameter is required.

When using header variables in a bundle, all listed sourcefiles will be processed for JSDoc tags with the latest read having priority (if a bundle has 3 scripts and they each have a `%version%` variable, the *last script read* will be the one whose value gets used in the final output file).

Preprocessor variables in bundles are on a per-bundle basis, not per-script - the input files will be preprocessed as if they are one file, glued together.

### 6. Batch building

YABS.js can build in batch mode! To do so, create a `build_all.json` (the filename can be anything, but `build.json` is a useful convention and it also provides the comfort of simply be able to type `node yabs.js` or `node build.js` into the command line, and YABS.js will automatically figure out - and prioritize - the `build_all.json` file). Into this file, add a single entry named `"batch_build"`.

You can list all your build instructions files in order you wish to have them built inside this entry:

```JSON
  "batch_build": [
    "build_main.json",
    "build_other.json"
  ]
```

Any number of build instructions files can be listed in a batch build, but note that recursive batch builds are forbidden and will fail automatically (there be dragons). You will have to deal with a single layer of batch building.

Note that if any of the builds in line fail, all subsequent builds will stop. To prevent this, you can use `--nofail` when running the build, in this case all builds will attempt to build regardless of previous failures.

If your build targets reside in a nested folder hierarchy and each of the targets contains a `build.json` file at the appropriate level, you can shorten the syntax and just point to the directory:

```JSON
  "batch_build": [
    "some/project/",
    "another/project/"
  ]
```

When invoking preprocessor parameters via the command line, they will be applied to all builds in the batch build which may be undesirable in certain circumstances. To avoid this, we can restructure the batch build instructions, wrapping it in an object, pointing to the build instructions file via a `"target"` entry and adding an `"options"` entry to the object. The options listed there will override command line options and will be used when running that specific build:

```JSON
  "batch_build": [
    {
      "target": "build_main.json",
      "options": "-debug -another_param"
    },
    "build_other.json"
  ]
```

## Command line parameters

Available parameters are:

- `--rebuild` Rebuilds target build (deletes the destination directory and starts build from ground up).
- `--nofail` In a [batch build](#5-batch-building), keeps going if one of the builds fails.
- `--version` Displays version info.
- `--help` Opens online help.

## Thanks

The [uglify-js](https://www.npmjs.com/package/uglify-js) and [MetaScript](https://www.npmjs.com/package/metascript) packages.

## License

Copyright (c) 2023 Danijel Durakovic

Licensed under the terms of the [GPLv3 license](LICENSE)
