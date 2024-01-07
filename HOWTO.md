![YABS.js](/logo.png?raw=true)

## Contents

1. [How it works](#1-how-it-works)
2. [Dependencies](#2-dependencies)
3. [Basic usage](#3-basic-usage)
4. [Basic example](#4-basic-example)
5. [Build instructions file](#5-build-instructions-file)  
  5.1. [Adding custom headers to scripts](#51-adding-custom-headers-to-scripts)  
  5.2. [Adding variables to custom headers](#52-adding-variables-to-custom-headers)  
  5.3. [Output filenames and compile options](#53-output-filenames-and-compile-options)  
  5.4. [Using the preprocessor](#54-using-the-preprocessor)  
  5.5. [Bundling scripts](#55-bundling-scripts)  
  5.6. [Build events](#56-build-events)  
  5.7. [Batch building](#57-batch-building)
6. [Command line parameters](#6-command-line-parameters)
7. [Examples](#7-examples)  
  7.1. [Minimal](#71-minimal)  
  7.2. [Headers](#72-headers)  
  7.3. [Website](#73-website)  
  7.4. [Preprocessor](#74-preprocessor)  
  7.5. [Bundle](#75-bundle)  
  7.6. [Library](#76-library)  
  7.7. [Events](#77-events)  
  7.8. [Game](#78-game)

## 1. How it works

This build system is based on a principal observation that web projects typically consist of three relatively distinct things: some HTML files, some JavaScript files and some *other* files like stylesheets, images, or any other files relevant to the project. Conveniently, these are the exact types of files we typically need to process before we prepare something for production (or, at least the author of this system does). The idea of this build system is to convert these 3 types of files into something we may push into production (i.e. create a "release" build), or that we build something which behaves *slightly* differently but allows us to test things better (i.e. a "debug" build). There are of course countless other ways in which we could use a build system to our advantage.

To make YABS.js work, we feed it a build instructions file. This is a JSON-formatted file that contains instructions on how the build should be performed (i.e. tells YABS.js what to do). YABS.js then runs the build as instructed. If the build is successful, a "Build finished!" message will appear and the finished build will materialize at the build destination directory.

For the most part, this is a content-unaware build system which only deals with files and not source code directly (apart from the mangling and compressing capabilities provided by [uglify-js](https://www.npmjs.com/package/uglify-js) and preprocessing which is delegated to [MetaScript](https://www.npmjs.com/package/metascript), and the fact that JSDoc-like meta tags can be extracted from sourcefiles to construct information headers for output files). This build system does not understand modules, `import`, `export` or `require` statements. What it does is roughly the following:

1. Clones the hierarchy of non-source files related to the web application, updating with newer files (skipping files that didn't change since the last build), into the output directory (typically `build/`, `release/` or equivalent) as specified by the build instructions file.

2. Compiles (and optionally, preprocesses or bundles) provided JavaScript sources and optionally attaches a custom header to the minified outputs. Headers may use variables extracted from the JSDoc-like tags in the sourcefile.

3. Matches `<script src="...">` attributes in the output HTML files to the associated JS sources and updates those entries to match compiled outputs (in practice this means that `.js` extensions get converted to `.min.js`, but it is also possible to specify custom output filenames or bundle multiple scripts into one).

Please double check your requirements to see if this featureset fits your needs and use one of the more advanced build systems if it does not.

## 2. Dependencies

The first prerequisite is the latest version of [Node.js](https://nodejs.org/).

From then on, YABS.js only has two dependencies (only one if you don't need preprocessing). These need to be installed globally rather than locally:

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

If your `build.json` file is located in a directory relative to the location of YABS.js, you can just pass that directory to the build system: `node build something`. In this example, the assumption is that `something/build.json` (or `something/build_all.json`) exists.

You can build YABS.js itself by running `node yabs build.json` from the repository root, upon which you should see something like this as output:

![screenshot](/screenshot.png?raw=true)

Some other commands you can try to run from the repository root:

- `node build examples/minimal` (builds the [minimal](#71-minimal) example)
- `node build examples` (builds all examples)
- `node build tests` (builds all tests)
- `node build` (build everything)

See [building.txt](/building.txt) for more detailed information on building this repository.

## 4. Basic example

To demonstrate basic usage of YABS.js, we will need a structure of a basic web application, and we will need a build instructions file. Let's start with the file hierarchy first.

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

Next, we need to focus on the build instructions file. This is the `build.json` file in the hierarchy above. The build instructions file is a plain JSON file with some entries. Let's write the following inside: 

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

- `"source_dir"` represents the source directory for the project which we are building. The value `"./"` means that the source directory is the same as the root directory (the directory build.json is in).

- `"destination_dir"` represents the build output directory. In this case, we will output everything into the `build/` directory. If this directory doesn't exist at build time, it will be created.

- `"html"` lists all HTML files associated with the web application. This can be a plain string with a single file like used above, or it can be a list of many HTML files. Files listed in this entry will have their `<script>` tags appropriately updated to match the compiled sourcefiles (if we wish to avoid this behavior we can list them in `"files"` instead). Note that YABS.js only supports `<script>` updates for elements which are listed on individual lines (for simplicity's sake YABS.js only does dirty substitution and doesn't actually parse the HTML files themselves).

- `"sources"` lists all JavaScript sourcefiles that we want to build and process. By default, YABS.js will just minify the sources.

- `"files"` lists all files associated with the web application that we do not wish to process, we simply wish to have them copied over and updated on subsequent builds. These are usually all the files associated to the web application that aren't source code. Each entry is either an individual file or a pattern mask. In the example above, `img/*` means we wish to fetch everything in the `img/` directory. A `*` mask means we want to capture the contents of the directory plus all its subdirectories and their content. A `*.*` mask would capture all files within the directory, but it would skip subdirectories. A `*.txt` would capture files with `.txt` extension in the directory, skipping subdirectories. Please note that masks can only be used in the `"files"` entry.

Now that we have the file hierarchy and a build instructions file, we can build the project. To build, all we have to do is to invoke `node build` from the command line from the root of the project. Build output will materialize in the `build/` folder which will be created automatically if it doesn't exist. All subsequent builds will only update relevant files and will skip files listed under `"files"` that have not updated since the last build. Source files and HTML files are processed every time we build.

This is all we need to setup a build for a simple web application, but YABS.js offers more options. In the following sections, additional capabilities of the build instructions file will be described, along with examples on how to use them.

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

Sometimes we may want to include dynamic data into the header which changes over time, for example a version number, authors listing, or a copyright year. With YABS.js, we can use variables in script headers, which help us extract dynamic values from the headers. The values are extracted from JSDoc-like tags in the sourcefiles, which typically sit at the top of the sourcefile.

To start, at the top of the JavaScript sourcefile, we will add some variables formatted in a JSDoc style:

```JS
/**
 * @name Awesome sourcefile
 * @version 0.5.0
 * @author Scooby
 * @copyright_holder Big Corp
 * @license MIT
 */
```

With this setup, we can now use these entries using the `%variable%` notation, like so:

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

Variable names are arbitrary and can be anything as long as they match the JSDoc tags in the sourcefile. They are required to be one single word without spaces and they are case-sensitive.

`$YEAR$` is a special variable that outputs the current year.

If we used the shared `"headers"` entry in the build instructions file (and then pointed to it with `"use_header"`), then the variables we use will be relative to individual scripts that use them. This means that every script that uses those headers has to include the matching JSDoc tags, and the values can vary from one another.

If we use a bundle, all scripts in the bundle will be scanned for values and the last read has priority and overwrites any previously read.

### 5.3. Output filenames and compile options

We can use a custom output source filename by adding the `"output_file"` entry into `"sources"` entry.

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
      "output_file": "src/combined.min.js",
      "header": "/* This is a combined script! */"
    }
  ]
```

Bundles are processed and glued together in order they were listed in.

When using bundles, the `"output_file"` parameter is required (remember to include the relative path in the parameter, otherwise the output will be created on build target root).

When using header variables in a bundle, all listed sourcefiles will be processed for JSDoc tags with the *latest read* having priority (if a bundle has 3 scripts and they each have a `@version` variable, the *last script read* will be the one whose value gets used in the output file).

Preprocessor variables in bundles are on a per-bundle basis, not per-script - the input files will be preprocessed as if they are one file, glued together. Note that preprocessor includes will **not** work with bundles because the glued output file materializes on the build side and as such cannot reference files which are relative to the file on the source side. This shouldn't be a problem in real-world cases because if you're already using bundles, you probably shouldn't be also using preprocessor includes at the same time.

### 5.6. Build events

YABS.js has two build events which occur at build time, the pre-build event (occurs before the build begins) and the post-build event (occurs after the build completes).

We can call custom scripts when these events occur. We do so by adding an `"events"` entry to our build instructions file and inside, add either `"prebuild"`, `"postbuild"` (or both) entries. Then, list the scripts we wish to run on these events in them:

```JSON
  "events": {
    "prebuild": [
      "script_A.js",
      "script_B.js",
      "script_C.js"
    ],
    "postbuild": [
      "script_D.js",
      "script_E.js",
      "script_F.js"
    ],
  }
```

In the above example, scripts A, B and C (in that order) will run on the `prebuild` event, and scripts D, E, F (also in that order) will run on the `postbuild` event.

These scripts are running in your standard Node environment and offer everything that JavaScript with Node already offers. They can be as complex or as basic as needed.

The scripts can output text to console mid-build:

```JS
console.log('Reporting from script_A.js!');
```

The scripts can work synchronously or asynchronously.

We can choose to have a sequence of commands like this, executing synchronously:

```JS
do_thing();
do_another_thing();
// all done!
```

Or we can have asynchronous  code that does something and then signals back to the system that it's done via a `process.send`, for example:

```JS
// we will wait 3 seconds before letting the build continue
setTimeout(() => {
  // all done!
  process.send({ exit: 'ok' });
}, 3000);
```

The `{exit: 'ok'}` parameter which we send back to YABS.js is merely convention as any non-empty parameter will signal YABS.js to continue building.

First two arguments sent to the script are the current build source directory, and the current build destination directory, which we can extract like this:

Additional arguments can be passed to the scripts. All arguments that come after the first two are custom arguments which we can add to the events entry in the build instructions file. For example:

```JSON
  "events": {
    "postbuild": [
      "script.js -some -custom -parameters",
    ],
  }
```

Now we can extract these parameters in the script:

```JS
// Discard the first two arguments if we don't need them.
// (Path to node and path to script.)
const argv = process.argv.slice(2);

// Now we can extract the first two arguments from YABS.js:
const build_source_dir = argv[0]; // Build source directory.
const build_destination_dir = argv[1]; // Build destination directory.

// At this point we can extract all the other extra arguments:
const extra_params = argv.slice(2); // Discard the build source directories.
// The value of extra_params for this example is now:
// ["-some", "-custom", "-parameters"]
```

When invoking a pre-build script, note that the destination directory or any directory contained within the destination directory that is relevant to the application being built, might not yet exist at that point in the build. Normally, the directories are created on demand as the build runs. But in the case where we're building something for the first time, the directory structure in the prebuild event will be missing which means we may need to deal with directories manually. Check if the destination directory exists with `fs.existsSync` or create required directories with `fs.makedirSync`. Note that the `fs` module is required to access these functions.

The above is not relevant for post-build scripts since those run only after any relevant directories have already been created.

### 5.7. Batch building

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

## 7. Examples

Examples are provided to demonstrate various ways to use YABS.js. Examples can be built one by one, or you can use `node build examples` from the repository root to build all examples in one go.

### 7.1. Minimal

This example is found in [/examples/minimal](/examples/minimal).

The build instructions JSON file in this example describes a basic build consisting of a single HTML file, a single JavaScript sourcefile to be compiled, and some extra files relevant to the build (CSS stylesheets and image files).

To get a closer look at the syntax, investigate `build.json`:

```JSON
{
  "source_dir": "./",
  "destination_dir": "build/examples/minimal/",
  "html": "index.html",
  "sources": [
    "src/script.js"
  ],
  "files": [
    "css/*.css",
    "img/*"
  ]
}

```

`"source_dir"` is relative to the `build.json` file. When set to `"./"`, it means "current directory where this build instructions file is located".

`"destination_dir"` is relative to the directory from which we are calling YABS.js *from*. When building this example, this example this would typically be the repository root.

`"sources"` is a list of JavaScript sourcefiles to be processed.

`"files"` is a list of files relevant to the build, for example CSS files and images. These files will be copied over on first run. On subsequent builds, only files which are newer than build-side files will be copied. Masks (`*` - everything including subfolders, `*.*` - everything excluding subfolders, `*.css` - all css files, and similar) can be used in this entry.


To build this example, run `node build examples/minimal` from the repository root.

### 7.2. Headers

This example is found in [/examples/headers](/examples/headers).

This example demonstrates various ways of prepending compiled output with commented headers that contain some data. Investigate the `build.json` file to see details on how to setup the build.

This build compiles several JavaScript sourcefiles and prepends headers to them:

- `script1.js` is compiled into `script1.min.js` and prepended by a one-line header with static text:
```JS
/* This is a simple, one-line header. */
```

- `script2.js` is compiled into `script2.min.js` and prepended by a multi-line header  with static text:
```JS
/* This is a
 * multiline
 * header. */
```

- `script3.js` is compiled into `script3.min.js` and prepended by a multi-line header containing variables extracted from the sourcefile:
```JS
/* This is a multiline header
 * that uses some variables.
 *
 * Script written by Alice Adams
 * (c) 2023 ByteWave Technologies */
```


- `script4.js` is compiled into `script4.min.js` and prepended by a multi-line shared header that is described globally inside `build.json` and can be reused across many sourcefiles. This header also uses variables:
```JS
/* This is a global header that can be reused many times.
 * Variables used here will depend on the individual
 * scripts that use this header.
 *
 * Script written by Brian Baker
 * (c) 2023 DataSphere Innovations */
```

- `script5.js` is compiled into `script5.min.js` and prepended by the same multi-line shared header as `script4.js`. Same variables are used, but values from `script5.js` are extracted instead:
```JS
/* This is a global header that can be reused many times.
 * Variables used here will depend on the individual
 * scripts that use this header.
 *
 * Script written by Charlotte Carter
 * (c) 2023 QuantumLogic Systems */
```


To build this example, run `node build examples/headers` from the repository root.

### 7.3. Website

This example is found in [/examples/website](/examples/website).

This example demonstrates a simple website consisting of `index.html`, `blog.html` and `about.html` with associated scripts and stylesheets.

To build this example, run `node build examples/website` from the repository root.

### 7.4. Preprocessor

This example is found in [/examples/preprocessor](/examples/preprocessor).

This example demonstrates several ways to use the preprocessor.

To build this example, run `node build examples/preprocessor` from the repository root.

### 7.5. Bundle

This example is found in [/examples/bundle](/examples/bundle).

This example demonstrates script bundling.

To build this example, run `node build examples/bundle` from the repository root.

### 7.6. Library

This example is found in [/examples/library](/examples/library).

This example demonstrates building a basic utility library.

To build this example, run `node build examples/library` from the repository root.

### 7.7. Events

This example is found in [/examples/events](/examples/events).

This example demonstrates the use of build events. The relevant entry in the `build.json` file in this example is `"events"`:

```JSON
  "events": {
    "prebuild": [
      "pre_build.js"
    ],
    "postbuild": [
      "post_build.js -you -can -also -feed -it -parameters"
    ]
  }
```

Both the pre-build and post-build events are a script or list of scripts to be run upon entering the build.

`pre_build.js` demonstrates a synchronous script that outputs some text and shows the basics of how how arguments from YABS.js can be extracted.

`post_build.js` demonstrates an asynchronous script that halts the build for 2 seconds before continuing by signaling YABS.js with a `process.send` to let it know it can move on with the build. This example script also shows how to extract the extra parameters that were defined in the build instructions file.

Please see the source code of `pre_build.js` and `post_build.js` for more detail and pay close attention to the commented text.

To build this example, run `node build examples/events` from the repository root.

### 7.8. Game

This example is found in [/examples/game](/examples/game).

This example demonstrates a basic HTML5 platformer game built on the [myst.js](https://github.com/metayeti/myst.js) engine.

The build demonstrates a typical game development scenario. It accomplishes the following:
- Strips any debug-related code out of the release build
- Bundles all scripts into one minified output and attaches a header with copyright and version info
- Strips files we don't not need in release (files in `dev/` in this example)
- Updates associated files (files in `css/`, `data/` and `lib/` in this example)

This example demonstrates a useful setup for the preprocessor. If we take a peak into `src/meta.js`, we will see this:

```JS
// >-- preprocessor variables -->

//? if (typeof DEBUG === 'undefined') DEBUG = false;
//? const RELEASE = !DEBUG;

// <-- preprocessor variables <--
```

This defines two compile-time variables named `DEBUG` and `RELEASE`. In this example we set the build up such that the code behaves as if it is in "debug" mode when run locally. For release builds, we then simply strip code out as we wrap it in this way:

```JS
//? if (DEBUG) {
  debug_feature1()
  debug_feature2()
//? }
```

With this setup, any time we run the release build now (which is the default build), we will skip this block of code. This allows us to maintain a debug version of the game on the development-side and a release version of the game on production-side. An alternative approach could involve dedicated debug builds but it would avoid the convenience of being able to locally run code live.

We can build with the `-debug` flag if we want to preserve debug features.

To run the game, open `index.html` with any modern desktop browser and click the page area where it says "Click to play". A keyboard is required to play this game.

How to play:
- Use arrow keys to move
- Use Z to jump
- Use X to shoot

To build this example, run `node build examples/game` from the repository root.

To build this example while preserving debug features, run: `node build examples/game -debug` or `node build -debug examples/game`.