![YABS.js](/logo.png?raw=true)

YABS.js is a minimalistic JavaScript build system.

v1.2.0 dev

## Contents

1. [How it works](#1-how-it-works)
2. [Dependencies](#2-dependencies)
3. [Basic usage](#3-basic-usage)
4. [Minimal example](#4-minimal-example)
5. [Build instructions file](#5-build-instructions-file)  
  5.1. [Adding custom headers to scripts](#51-adding-custom-headers-to-scripts)  
  5.2. [Adding variables to custom headers](#52-adding-variables-to-custom-headers)  
  5.3. [Output filenames and compile options](#53-output-filenames-and-compile-options)  
  5.4. [Using the preprocessor](#54-using-the-preprocessor)  
  5.5. [Bundling scripts](#55-bundling-scripts)  
  5.6. [Batch building](#56-batch-building)
6. [Command line parameters](#6-command-line-parameters)
7. [Contribution](#7-contribution)
8. [Credits](#8-credits)
9. [License](#9-license)

## 1. How it works

YABS.js takes a single build instructions JSON file as input. It then configures, prepares, and runs the build process as described by the build instructions file. If the build is successful, a "Build finished!" message will appear and the finished build will materialize at the build destination directory.

For the most part, this is a content-unaware build system which only deals with files and not source code directly (apart from the mangling and compressing capabilities provided by [uglify-js](https://www.npmjs.com/package/uglify-js) and preprocessing which is delegated to [MetaScript](https://www.npmjs.com/package/metascript), and the fact that JSDoc-like meta tags can be extracted from sourcefiles to construct information headers for output files). This build system does not understand modules, `import`, `export` or `require` statements. What it does is roughly the following:

1. Clones the hierarchy of non-source files related to the web application, updating with newer files (skipping files that didn't change since the last build), into the output directory (typically `build/`, `release/` or equivalent) as specified by the build instructions file.

2. Compiles (and optionally, preprocesses or bundles) provided JavaScript sources and optionally attaches a custom header to the minified outputs Headers may use variables extracted from the JSDoc-like tags in the sourcefile.

3. Matches `<script src="...">` attributes in the HTML files to the associated JS sources and updates those entries to match compiled outputs (in practice this usually simply means that the `.js` extensions get converted to `.min.js`, but it is also possible to specify custom output filenames or bundle multiple scripts into one).

Please double check your requirements to see if this featureset fits your needs and use one of the more advanced build systems if it does not.

## 2. Dependencies

The first prerequisite is the latest version of [Node.js](https://nodejs.org/).

From then on, YABS.js only has two dependencies (only one if you don't need preprocessing). They need to be installed globally rather than locally:

- [uglify-js](https://www.npmjs.com/package/uglify-js) (install with `npm -g install uglify-js`)
- [MetaScript](https://www.npmjs.com/package/metascript) (install with `npm -g install metascript`)

The MetaScript package is only needed if your builds leverage the preprocessor, otherwise you can skip installing it. Note that some examples that use preprocessing will not build without it.

## 3. Basic usage

The most common usage pattern goes like this:

1. Drop `build.js` or `yabs.js` into your project's root folder.
2. Create a `build.json` file and describe the build you wish to perform.
3. Run the build with `node build` (or `node yabs` if you used `yabs.js`).

The `build.js` file is a compiled version of `yabs.js` - you can use either for your projects, they are equivalent in function.

YABS.js will automatically default to `build_all.json` or `build.json` (in that order) whenever the build instructions file is not explicitly provided as a command line parameter.

If you wish to pass a custom build instructions file, invoke YABS.js with a parameter: `node build something.json`. Note that only one such parameter will be accepted (if you want to build multiple things in one go, you can use YABS.js in [batch mode](#56-batch-building)).

If your `build.json` file is located in a directory relative to the location of YABS.js, you can just pass that directory to the build system: `node build something`. In this example, it is assumed that a `something/build.json` file (or `something/build_all.json`) exists.

You can build YABS.js itself by invoking `node yabs build.json` from the repository root, upon which you might see something like this as output:

![screenshot](/screenshot.png?raw=true)

Other commands you can try to run from the repository root are:

- `node build examples/minimal` (builds the [minimal](/examples/minimal/) example)
- `node build examples` (builds all examples)
- `node build tests` (builds all tests)
- `node build` (build everything)

See [building.txt](/building.txt) for more detailed information on building this repository.

## 4. Minimal example

To demonstrate basic usage, we will need a structure of a basic web application, and we will need a build instructions file. Let's start with the file hierarchy first.

The hierarchy of files for this minimal build will look like this:

```
📁 css
 └─ 📄 style.css
📁 img
 └─ 📄 cat.jpg
 └─ 📄 dog.png
📁 src
 └─ 📄 script.js
📄 build.js
📄 build.json
📄 index.html
```

For now, it doesn't really matter what these files contain. Let's imagine they contain some code and some data. The `build.js` file is the YABS.js build system (we could use the `yabs.js` sourcefile as well if we wanted to).

Next, we need to focus on the build instructions file. That is the `build.json` file in the hierarchy above. The build instructions file is a plain JSON file with some entries. Let's write the following inside: 

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

- `"source_dir"` represents the source directory for the project we are building. The value `"./"` means that the source directory is the same as the root directory (the same directory build.json is in).

- `"destination_dir"` represents the build output directory. In this case, we will output everything into the `build/` directory. If this directory doesn't exist at build time, it will be created.

- `"html"` lists all HTML files associated with the web application. This can be a plain string with a single file like used above, or it can be a list of many files. Files listed in this entry will have their `<script>` tags' `src` attributes appropriately updated to match the compiled sourcefiles (to avoid this you can list them in `"files"` instead).

- `"sources"` lists all JavaScript files that we want to build and process.

- `"files"` lists all other files associated with the web application that we do not wish to process in any way, we just want to have them copied over into the build output. These are usually all the files associated to the web application that aren't source code. This entry is a list pointing to individual files and can include basic pattern masks. In the example above, `"img/*"` means we wish to fetch everything in the `img/` directory. A `*` mask means we want to capture the contents of the directory plus all its subdirectories and their content. A `*.*` mask would only capture all files within the directory, but it would skip any subdirectories. A `*.txt` would only capture files with `.txt` extension in the directory, skipping subdirectories. Please note that masks can only be used in the `"files"` entry.

Now that we have the file hierarchy and a build instructions file, we can build the project. To build, all we have to do is to invoke `node build` from the command line from the root of the project. Build output will materialize in the `build/` folder which will be created automatically if it doesn't exist. All subsequent builds will only update relevant files and will skip files listed under `"files"` that have not updated since the last build. Only the source files are processed with every build.

This is all we need to run a build for a simple web application, but YABS.js offers more options. In the following sections, additional capabilities of the build instructions file and directions on how to utilize them will be explained.

## 5. Build instructions file

There is more that we can accomplish with the build instructions file than what we have seen in the example above. Let's look at some features through various examples.

### 5.1. Adding custom headers to scripts

Sometimes we may want to add copyright information or other relevant information into the minified output scripts in the form of a commented header such that the compiled JavaScript sources are not just minified source code, but contain a header with useful information.

To add a custom header to the output script, we can add a `"header"` entry to any individual `"sources"` entry. To do so, first we need to change the structure slightly by wrapping the listing into an object and referring to the script file with a `"file"` entry:

```JSON
  "sources": [
    {
      "file": "src/script.js",
      "header": "/* This is a minified script! */"
    }
  ]
```

We can make the header multiline by changing the value to a list of strings:

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

Sometimes we may want to use the same header across many output files. If that is the case, we may add a shared `"headers"` entry to the build instructions file:

```JSON
  "headers": {
    "some_header": "/* this is a shared header! */",
    "some_multiline_header": [
      "/* This is a multiline",
      " * shared header! */",
    ]
  }
```

We can then refer to these entries with a `"use_header"` entry that we put inside any `"sources"` entry:

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

### 5.2. Adding variables to custom headers

Sometimes the data we want to include in the sourcefile header is dynamic and may change with time. Things like application version number and copyright year would be irritating to work with if we needed to change the build instructions file every time the program version went up. This is why with YABS.js, we can use variables with script headers, which help us add dynamic data to the headers, such as versions and copyright information. The values are extracted from JSDoc-like tags in the sourcefiles, which are typically at the top of the file and the first thing to appear in a sourcefile.

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

We can now use these entries in output headers with the `%variable%` notation:

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

Variable names are completely arbitrary and can be anything as long as they match the JSDoc tags in the sourcefile. They are required to be one single word without spaces and they are case-sensitive.

`$YEAR$` is a special variable that outputs the current year.

If we use the shared `"headers"` entry in the build instructions file, the variables we use will be relative to the individual scripts that use them. This means that every script that uses those headers has to include the matching JSDoc tags, and the values can vary from one another.

### 5.3. Output filenames and compile options

You can use a custom output source filename by adding the `"output_file"` entry into `"sources"` entry.

Note that `"output_file"` needs to always specify the relative directory you want it to output to (this is to prevent ambiguity in cases where we wish to output the file into a different directory). A good rule of thumb to follow is that when your `"file"` value includes relative paths, then so should the `"output_file"` value.

For example:

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

This will take the source file at `/src/script.js` and output `build/src/script-custom-name.min.js`.

You can control compile options by adding a `"compile_options"` entry. These options will be passed to the compiler directly. Default value for compile options is `"--mangle --compress"`. (See the [uglify-js](https://github.com/mishoo/UglifyJS) documentation for more options.)

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
    }
  ]
}
```

The above build instructions file generates a `build.js` file (rather than the default `yabs.min.js` if the `"output_file"` entry were omitted), and it uses the `"--compress"` compiler option rather than the default `"--mangle --compress"`. A brief explanation of these options is that `--compress` will eliminate whitespace and comments whereas `--mangle` will also rename variables to their shortest forms. The reason YABS.js uses --compress only is so the code is easier to beautify and audit.

### 5.4. Using the preprocessor

The preprocessor adds a layer of metaprogramming facilities which we can utilize when compiling sourcefiles. This adds a lot of power to our build process. For example, we can use preprocessor variables to control which code inside of a sourcefile gets compiled into the final output file. This way we can for example add debugging features which we can use during development, and which we can then skip in the final release build. Or we can make separate debug and release builds, such as the example below will attempt to demonstrate. YABS.js primarily focuses on preprocessor variables, but there is a lot more we can achieve with the preprocessor.

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

Using the entries above, we can now invoke the build using a `-debug` or a `-release` parameter like so: `node yabs.js -debug`. Whenever we use one of these parameters, the variables listed in their corresponding entries will be used when invoking the preprocessor. Any number of parameters and variables may be listed this way.

You can use the same variable group across many different source entries and in this case you can invoke the preprocessor for many sources at once by using a single parameter on the command line.

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

Doing so, we may now refer to a global variables group with a `"use_variables"` entry inside a `"sources"` entry:

 ```JSON
  "sources": [
    {
      "file": "src/script.js",
      "use_variables": "some_variables_key"
    }
  ]
```

The above is equivalent to declaring the variable listing from within the `"source"` entry, however if you have many sourcefiles where you end up using the same variables this might be a more convenient way of creating such listings.

Inside the sourcefile, using the preprocessor might look something like this:

```JS
//? if (DEBUG) {
console.log('compiled with -debug');
//? } else if (RELEASE) {
console.log('compiled with -release');
//? }
```

Using the above code, the program will respond differently when a build is invoked via `node yabs.js -debug` or `node yabs.js -release`.

Note that this is not typically a good way of separating debug from release builds and is only used for demonstrative purposes. A more convenient way might be to consider creating a `build_debug.json` and `build_release.json` instead.

Another feature you can use with the preprocessor are external file includes:

```JS
//? include("path/to/file.js");
```

It's important to note that by default, YABS.js will only run the preprocessor step automatically whenever a variable group is both associated with a specific script file and also invoked via the command line. This means that if there is a listing for a `DEBUG` variable group, we can invoke `node yabs.js` and the preprocessor step will be skipped (because we don't require preprocessing), but if we invoke it with `node yabs.js -debug`, the preprocessor will kick in and the `DEBUG` group will be used.

This behavior might be undesired if we want to leverage the preprocessor for other features, so we have to force the use of the preprocessor. We can do so by adding a `"preprocess"` entry to a `"source"` entry, and setting it to `true`:

```JS
  "sources": [
    {
      "file": "src/script.js",
      "preprocess": true
    }
  ]
```

This will force the compilation step for this particular source to always utilize the preprocessor.

You are free to use any other [MetaScript](https://github.com/dcodeIO/MetaScript) features available - the sky is the limit.

### 5.5. Bundling scripts

YABS.js can bundle multiple script files into one single output file. To do so, add a `"bundle"` (rather than a `"file"`) entry inside a `"sources"` item:

```JSON
  "sources": [
    {
      "bundle": [
        "src/script1.js",
        "src/script2.js"
      ],
      "output_file": "src/combined.js",
      "header": "/* This is a combined script! */"
    }
  ]
```

Bundles are processed and glued together in order they were listed in.

When using bundles, the `"output_file"` parameter is required (remember to include the relative path in the parameter, otherwise the output will be created on build target root).

When using header variables in a bundle, all listed sourcefiles will be processed for JSDoc tags with the *latest read* having priority (if a bundle has 3 scripts and they each have a `@version` variable, the *last script read* will be the one whose value gets used in the output file).

Preprocessor variables in bundles are on a per-bundle basis, not per-script - the input files will be preprocessed as if they are one file, glued together. Note that preprocessor includes will **not** work with bundles because the glued output file materializes on the build side and as such cannot reference files which are relative to the file on the source side. This shouldn't be a problem in real-world cases because if you're already using bundles, you probably shouldn't be also using preprocessor includes at the same time.

### 5.6. Batch building

YABS.js can build in batch mode! To do so, create a `build_all.json` (the filename can be anything, but `build_all.json` is a useful convention).

Into this file, add a single entry named `"batch_build"`. Inside, list all your build instructions files in the order you wish to have them built:

```JSON
  "batch_build": [
    "build_main.json",
    "build_other.json"
  ]
```

Any number of build instructions files can be listed in a batch build. Recursive batch builds are allowed (listing batch builds inside batch builds) and will behave as if they are one big batch.

Note that if any of the builds in line fail, all subsequent builds will be aborted. To prevent this behavior, you may use `--nofail` when running the build. If used, all builds will attempt to build regardless of any of the builds failing.

If build targets reside in a nested folder hierarchy and each of the targets contains a `build.json` file at the appropriate level, you can shorten the syntax and just point to the directory:

```JSON
  "batch_build": [
    "some/project",
    "another/project"
  ]
```

When invoking preprocessor parameters via the command line, they will be applied to all builds in the batch, which may be undesirable in certain circumstances. To avoid this, we can restructure the batch build instructions, wrapping it in an object, pointing to the build instructions file via a `"target"` entry and adding an `"options"` entry to the object. The options listed here will override any command line-provided options and will be used when running that specific build:

```JSON
  "batch_build": [
    {
      "target": "build_main.json",
      "options": "-debug -another_param"
    },
    "build_other.json"
  ]
```

## 6. Command line parameters

Option parameters begin with `--` and provide additional features to be used in the command line.

- `--nofail` In a [batch build](#6-batch-building), will keep the build going even if any of the builds in line fail.
- `--version` Displays version info.
- `--help` Opens the online repository with help reference.

## 7. Contribution

This program is provided as-is as free and open source software, but it is not currently open for contributions (mainly because the author considers it feature-complete and would prefer to spend time working on other projects). It is unlikely that this system will be expanded much beyond the scope of its current capabilities. If you need to extend or modify the featureset that this software provides, please consider forking this project.

## 8. Credits

The [uglify-js](https://www.npmjs.com/package/uglify-js) and [MetaScript](https://www.npmjs.com/package/metascript) packages.

## 9. License

Copyright © 2023 Danijel Durakovic

Licensed under the terms of the [MIT license](LICENSE).
