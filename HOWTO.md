![YABS.js](/logo.png?raw=true)

## Contents

1. [How it works](#1-how-it-works)
2. [Dependencies](#2-dependencies)
3. [Basic usage](#3-basic-usage)
4. [Basic example](#4-basic-example)
5. [Build instructions file](#5-build-instructions-file)  
  5.1. [Adding custom headers to scripts](#51-adding-custom-headers-to-scripts)  
  5.2. [Adding variables to custom headers](#52-adding-variables-to-custom-headers)  
  5.3. [Source output filename](#53-source-output-filename)  
  5.4. [Compile options](#54-compile-options)  
  5.5. [Using the preprocessor](#55-using-the-preprocessor)  
  5.6. [Bundling scripts](#56-bundling-scripts)  
  5.7. [Build events](#57-build-events)  
  5.8. [Batch building](#58-batch-building)
6. [Examples](#6-examples)  
  6.1. [Minimal](#61-minimal)  
  6.2. [Headers](#62-headers)  
  6.3. [Website](#63-website)  
  6.4. [Preprocessor](#64-preprocessor)  
  6.5. [Bundle](#65-bundle)  
  6.6. [Library](#66-library)  
  6.7. [Events](#67-events)  
  6.8. [Game](#68-game)
7. [Command line parameters](#7-command-line-parameters)

## 1. How it works

This build system is based on the premise that web projects typically consist of three relatively distinct things: some HTML files, some JavaScript files and some *other* files like stylesheets, images, or any other files relevant to the project. Conveniently, these are the exact types of files we need to process before we prepare something for production (or, at least the author of this system does). The idea of this build system is to convert these 3 types of files into something we can push into production (i.e. create a "release" build), or that we create something that behaves *slightly* differently and allows us to test things better (i.e. create a "debug" build). There are of course countless other ways in which we could use a build system to our advantage.

To make YABS.js work, we feed it a build instructions file. This is a JSON-formatted file that contains instructions on how the build should be performed. YABS.js then runs the build as instructed. If the build is successful, a "Build finished!" message will be displayed and the finished build will materialize at the build destination directory.

For the most part, this is a content-unaware build system which only deals with files and not source code directly (apart from the mangling and compressing capabilities provided by [uglify-js](https://www.npmjs.com/package/uglify-js) and preprocessing which is delegated to [MetaScript](https://www.npmjs.com/package/metascript)). This build system does not understand modules, `import`, `export` or `require` statements. What it does is roughly the following:

1. Clones the hierarchy of non-source files related to the web application, updating with newer files (skipping files that didn't change since the last build), into the output directory (typically `build/`, `release/` or equivalent) as specified by the build instructions file.

2. Compiles (and optionally, preprocesses and/or bundles) provided JavaScript sources and optionally attaches a custom header to the minified outputs. Headers can use variables extracted from JSDoc-like tags in the source files.

3. Matches `<script src="...">` attributes in the output HTML files to the associated JS sources and updates those entries to match compiled outputs (in practice this typically means that `.js` extensions get converted to `.min.js`, but it is also possible to specify custom output filenames or bundle multiple scripts into one).

Please double check your requirements to see if this feature set fits your needs and use one of the more advanced build systems if it does not.

## 2. Dependencies

The first prerequisite is the latest version of [Node.js](https://nodejs.org/).

From then on, YABS.js only has two dependencies (only one if you don't need preprocessing). They need to be installed globally rather than locally:

- [uglify-js](https://www.npmjs.com/package/uglify-js) (install with `npm -g install uglify-js`)
- [MetaScript](https://www.npmjs.com/package/metascript) (install with `npm -g install metascript`)

The MetaScript package is only needed if your builds leverage the preprocessor, otherwise you can skip installing it. Note that some examples that use preprocessing will not build without it.

## 3. Basic usage

The most common usage pattern goes like this:

1. Drop `build.js` or `yabs.js` into your project's root directory.
2. Create a `build.json` file in the same directory and describe the build you wish to perform.
3. Run the build with `node build` (or `node yabs` if you used `yabs.js`).

The `build.js` file is a compiled version of `yabs.js` - you can use either for your projects, they are equivalent in function.

YABS.js will automatically default to `build_all.json` or `build.json` (in that order) whenever the build instructions file is not explicitly provided as a command line parameter.

If you wish to pass a custom build instructions file, invoke YABS.js with a parameter: `node build thing.json`. Note that only one such parameter will be accepted (if you want to build multiple things in one go, you can use YABS.js in [batch mode](#58-batch-building)).

If your `build.json` file is located in a directory relative to the location of YABS.js, you can just pass that directory to the build system: `node build thing`. In this example, the assumption is that `thing/build.json` (or `thing/build_all.json`) exists.

You can build YABS.js itself by running `node yabs build.json` from the repository root, upon which you should see something like this as output:

![screenshot](/screenshot.png?raw=true)

Some other commands you can try to run from the repository root:

- `node build examples/minimal` (builds the [minimal](#61-minimal) example)
- `node build examples` (builds all examples)
- `node build tests` (builds all tests)
- `node build` (builds everything)

See [building.txt](/building.txt) for more detailed information on building this repository.

## 4. Basic example

To demonstrate basic usage, we will need a structure of a simple web application, and we will need a build instructions file. Let's start with the file hierarchy first.

The hierarchy of files for this basic build will look like this:

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

For now, it doesn't really matter what these files contain. Let's imagine they contain some code and some data. The `build.js` file is the YABS.js build system (we could use the `yabs.js` source file as well if we wanted to).

Next, we need to focus on the build instructions file. This is the `build.json` file. The build instructions file is a plain JSON file with some entries. Let's write the following inside: 

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

- `"html"` lists all HTML files associated with the web application. This can be a plain string with a single file like used above, or it can be a list of many HTML files. Files listed in this entry will have their `<script>` tags appropriately updated to match the compiled source files (if we wish to avoid this behavior we can list them in `"files"` instead). Note that YABS.js only supports `<script>` updates for elements which are listed on individual lines (for simplicity's sake YABS.js only does dirty substitution and doesn't actually parse the HTML files themselves).

- `"sources"` lists all JavaScript source files that we want to build and process. By default, YABS.js will just minify the sources.

- `"files"` lists all files associated with the web application that we do not wish to process in any way, but we do want to have them copied over and then updated on subsequent builds. These are usually all the files associated to the web application that aren't source code. Each entry is either an individual file or a pattern mask. In the example above, `"img/*"` means we wish to fetch everything in the `img/` directory. A `"*"` mask means we want to capture the contents of the directory plus all its subdirectories and their content. A `"*.*"` mask would capture all files within the directory, but it would skip subdirectories. A `*.txt` would capture files with the `.txt` extension within the directory and it would skip subdirectories. Please note that masks can only be used in the `"files"` entry.

Now we can build the project. To build, all we have to do is to invoke `node build` from the command line. Build output will materialize in the `build/` directory, which will be created automatically. All subsequent builds will only update relevant files and will skip any files listed in `"files"` that have not updated since the last build. Source files and HTML files are processed every time we build.

This is all we need to setup a build for a simple web application, but YABS.js offers more options. In the following sections, additional capabilities of the build instructions file will be described, along with examples on how to use them.

## 5. Build instructions file

There is more that we can accomplish with the build instructions file than what we have seen in the example above. Let's look at some features through various examples.

### 5.1. Adding custom headers to scripts

Sometimes we may want to add copyright information or other relevant information into the minified output scripts in the form of a commented header.

To add a custom header to the output script, we can add a `"header"` entry to any individual source listing. To do so, first we need to change the structure of the listing by wrapping it into an object and then referring to the source file with a `"file"` entry:

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

YABS.js supports dynamic data in headers which is extracted from JSDoc-like tags in source files. This is useful for any data such as version numbers, copyright years or other relevant data we may want to include in the build source file.

To demonstrate, we will add some variables formatted in JSDoc-like style style to the top of a source file, for example `src/script.js`:

```JS
/**
 * @name Awesome sourcefile
 * @version 0.9.0
 * @author Scooby
 * @copyright_holder Big Corp
 * @license MIT
 */
```

With these variables in place, we can now use the same entries with the `%variable%` notation in a header listing:

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

The header in the compiled source file will now become the following:
```JS
/* Minified Awesome sourcefile, v0.9.0
 * Written by Scooby, released under MIT
 * Copyright (c) 2023 Big Corp */
```

Now we can simply control what gets output into the header by changing the variables in the script.

Variable names are are required to be one single word without spaces and they are case-sensitive but are otherwise arbitrary.

`$YEAR$` is a special variable that outputs the current year.

If we used the shared `"headers"` entry in the build instructions file (and then pointed to it via `"use_header"`), then the variables used will be relative the listed script. This means that every script that uses those headers is required to define the matching JSDoc-like tags, and the values can vary from one another.

If we are bundling scripts, then all scripts in the bundle will be scanned for values with the last read having priority.

### 5.3. Source output filename

We can define custom output source filenames by using an `"output_file"` entry in a source listing.

Note that `"output_file"` needs to **always** include the relative path. A good rule of thumb to follow is that when your `"file"` value includes relative paths, then so should the `"output_file"` value.

For example:

```JSON
{
  "source_dir": "./",
  "destination_dir": "build/",
  "sources": [
    {
      "file": "src/script.js",
      "output_file": "src/custom_name.min.js",
    }
  ]
}
```

This will take the source file at `/src/script.js` and output `build/src/custom_name.min.js`. Any HTML files listed in a `"html"` listing will be appropriately updated to match the output filenames.

### 5.4. Compile options

We can control compile options by using a `"compile_options"` entry in a source listing. These options will be passed to the compiler. Default value for compile options is `--mangle --compress`.

The `build.json` build instructions file (for building YABS.js) demonstrates the use of these features:

```JSON
{
  "source_dir": "./",
  "destination_dir": "./",
  "sources": [
    {
      "file": "yabs.js",
      "output_file": "build.js",
      "compile_options": "--compress",
…
```

The above directive informs the compiler that we only want to use `--compress` (rather than the default `--mangle --compress`). The effect of this is that while `--mangle` shortens variables names in the script, omitting this parameter will preserve variable names so that the output can be beautified back into readable code easily. The `--compress` options tells the compiler we want minified output. Another useful flag is `--enclose`, which wraps output into an IIFE, protecting the contents of the source file from leaking out into the global scope.

See the [uglify-js](https://github.com/mishoo/UglifyJS) documentation for the full list of available options.

### 5.5. Using the preprocessor

The preprocessor adds a layer of metaprogramming which adds a lot of power and flexibility to our build process. Preprocessing is delegated to [MetaScript](https://github.com/dcodeIO/MetaScript).

The most common way to use preprocessor features with YABS.js is to take advantage of preprocessor variable groups. Preprocessor variables are named groups of key/value pairs. They can be passed to the preprocessor by using parameters on the command line.

To define a variable group, we add a `"variables"` entry to a source listing and then define a group of variables inside, for example:

```JSON
  "sources": [
    {
      "file": "src/script.js",
      "variables": {
        "param1": [
          "VAR=foo"
        ],
        "param2": [
          "VAR=bar"
        ]
      }
    }
  ]
```

This defines two variable groups, named `"param1"` and `"param2"`. These will be used when either `-param1` or `-param2` are passed on the command line. We can pass as many parameters as we need, but in this particular example it wouldn't do as much good as we're sending the same variable `VAR` each time.

There is one more way to define a variable group and that is to create a global `"variables"` listing and then refer to it with a `"use_variables"` entry within a source listing. This way the same set of variable groups may be used across many source listings:

```JSON
  "variables": {
    "some_variables": {
      "param1": [
        "VAR=foo"
      ],
      "param2": [
        "VAR=bar"
      ]
    }
  },
  "sources": [
    {
      "file": "src/script.js",
      "use_variables": "some_variables"
    }
  ]
```

Doing one of the above will pass the variable `VAR` to the preprocessor whenever either `-param1` or `-param2` is used on the command line when invoking the build. 

We can list many variables in a variable group:
```JSON
  "sources": [
    {
      "file": "src/script.js",
      "variables": {
        "param": [
          "VAR1=foo",
          "VAR2=bar",
          "VAR3=baz"
        ]
      }
    }
  ]
```

We can also use a default listing, which will invoke the preprocessor automatically without the need for any parameters:

```JSON
  "sources": [
    {
      "file": "src/script.js",
      "variables": {
        "default": [
          "VAR=foo",
        ]
      }
    }
  ]
```

If parameters are passed, they will be prioritized over the `"default"` listing.

After we've configured our build environment to work with variable groups, we can then check against these variables at compile-time using meta-code in the source files in the following way:

```JS
//? if (VAR=="foo") {

// do something

//? } else if (VAR=="bar") {

// do something else

//? }
```

Variables are passed as raw strings. This means that for example, `"VAR=true"` will be passed as the literal string `"true"`. In other words, do not pass `"VAR=false"` and expect `//? if (VAR)` to work in your favor, as the literal string `"false"` is being passed and it will always evaluate to a truthy value. Instead, what you can do to pass variables as on/off flags, use `"VAR=true"` or `"VAR=1"` to mean "on", and use `"VAR="` or skip the value, to mean "off".

Compile-time code has the following constructs which we can use:

- `//?` begins a preprocessor line of meta-code
- `/*?` begins a preprocessor block of meta-code (`*/` ends it)
- `?=` writes the expression result exactly.
- `?==` writes the expression result, but runs it through `JSON.stringify` first.

See the [MetaScript documentation](https://github.com/dcodeIO/MetaScript) for the full feature set of everything the preprocessor has to  offer.

Another neat thing we can accomplish with the preprocessor are compile-time includes, which we can use in the following way:

```JS
//? include('path/to/file.js');
```

The above meta-code will "paste" the content of `path/to/file.js` into the final output. There are some considerations we need to be aware of when using preprocessor includes:
- We **cannot** use preprocessor includes if we're using bundles at the same time. The reason for this is technical in nature, but it's also logical. The technical reason is that the "glued" output from bundler exists on build-side and not local-side, which means that the include path is no longer relative to the local source file, but the build destination source file. The logical reason is that with preprocessor includes, we're doing basically the same thing as the bundler is already doing (gluing scripts together). So really we should decide to use one or the other, but not both.
- The preprocessor does **not** run by default. When we're passing parameters that match some variable group, YABS.js will automatically engage the preprocessor. However, in all other cases, we need to add a `"preprocess": true` entry into the appropriate source listing to force the preprocessor, for example:

```JS
  "sources": [
    {
      "file": "src/script.js",
      "preprocess": true
    }
  ]
```

When using preprocessor includes, typically we also want to force preprocessor as shown above.

At this point we need to clarify specifically at which point the preprocessor is invoked to run. YABS.js by default will not run the preprocessor on any source file. The preprocessor will be invoked in one of the following scenarios:

1. We run the build with the variable group which is defined in `build.json`, for example:

```JSON
  "sources": [
    {
      "file": "src/script.js",
      "variables": {
        "release": [
          "VAR=foo"
        ]
      }
    }
  ]
```

With the above variables listing, the preprocessor will be invoked for `script.js` if the `-release` flag has been passed to the build system.

2. We manually enable preprocessing using the `"preprocessor"` flag:

```JSON
  "sources": [
    {
      "file": "src/script.js",
      "preprocess": true
    }
  ]
```

This will enable the preprocessor every time this particular script is being compiled.

3. We have a `"default"` entry in the variables listing:

```JSON
  "sources": [
    {
      "file": "src/script.js",
      "variables": {
        "default": [
          "VAR=foo"
        ]
      }
    }
  ]
```

With above listing, the preprocessor will be invoked for by default. Variables listed in the `"default"` listing will be passed to the preprocessor.

### 5.6. Bundling scripts

YABS.js can bundle multiple script files into one single output file. To do so, add a `"bundle"` (rather than a `"file"`) entry into a source listing:

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

Bundles are processed and glued together in the order they were listed in.

When using bundles, the `"output_file"` parameter is **required** (remember to include the relative path in the parameter).

When using header variables in a bundle, all listed source files will be processed for JSDoc tags with the *latest read* having priority (if a bundle has 3 scripts and they each have a `@version` variable, the *last script read* will be the one whose value gets used for `%version%` in the output header).

Preprocessor variables in bundles are on a per-bundle basis, not per-script - the input files will be preprocessed as if they are one file, glued together. Note that preprocessor includes will **not** work with bundles because the glued output file materializes on the build side and as such cannot reference files which are relative to the file on the source side. This shouldn't be a problem in real-world cases because if you're already using bundles, you probably shouldn't be also using preprocessor includes at the same time as they both achieve the same thing.

### 5.7. Build events

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

First two arguments sent to the script are the current build source directory and the current build destination directory. Additional arguments can be passed to the scripts in the following way: 

```JSON
  "events": {
    "postbuild": [
      "script.js -some -custom -parameters",
    ],
  }
```

We can extract all of these parameters in the script:

```JS
// Discard the first two arguments if we don't need them.
// (Path to node and path to script.)
const argv = process.argv.slice(2);

// Now we can extract the first two arguments that come from YABS.js:
const build_source_dir = argv[0]; // Build source directory.
const build_destination_dir = argv[1]; // Build destination directory.

// At this point we can extract all the other extra arguments to get the surplus arguments.
const extra_params = argv.slice(2);
// The value of extra_params for this example is now:
// ["-some", "-custom", "-parameters"]
```

When invoking a pre-build script, note that the destination directory or any directory contained within the destination directory that is relevant to the application being built, might not yet exist at that point in the build. Normally, the directories are created on demand as the build runs. But in the case where we're building something for the first time, the directory structure in the prebuild event will be missing which means we may need to deal with directories manually. Check if the destination directory exists with `fs.existsSync` or create required directories with `fs.makedirSync`. Note that the `fs` module is required to access these functions.

The above is not relevant for post-build scripts since those run only after any relevant directories have already been created.

### 5.8. Batch building

YABS.js can build in batch mode! To do so, create a `build_all.json` file (the filename can be anything, but `build_all.json` is a useful convention).

Into this file, add a single entry named `"batch_build"`. Inside, list all your build instructions files in the order you wish to have them built:

```JSON
  "batch_build": [
    "build_main.json",
    "build_other.json"
  ]
```

Any number of build instructions files can be listed in a batch build. Recursive batch builds are allowed (listing batch builds inside batch builds) and will behave as if they are one big batch.

Note that if any of the builds in line fail, all subsequent builds will be aborted. To prevent this behavior, you may use `--nofail` when running the build. If used, the build will keep going regardless if any of the builds in line fail.

If build targets reside in a nested directory hierarchy and each of the targets contains a `build.json` (or a `build_all.json`) file on the appropriate level, then we can shorten the syntax and just point to the directory:

```JSON
  "batch_build": [
    "some/project",
    "another/project"
  ]
```

The above assumes that `some/project/build.json` and `another/project/build.json` (or the equivalent for `build_all.json`) exist relative to this build instructions file.

When invoking preprocessor parameters via the command line, they will be applied to all builds in the batch, which may be undesirable in certain circumstances. To avoid this, we can restructure the batch build listing by wrapping it into an object, pointing to the build instructions file via a `"target"` entry and then adding an `"options"` entry which describes the parameters we wish to pass for that particular target. The options listed here will override any command line-provided options:

```JSON
  "batch_build": [
    {
      "target": "build_main.json",
      "options": "-debug -another_param"
    },
    "build_other.json"
  ]
```

## 6. Examples

Examples are provided to demonstrate various ways to use YABS.js. Examples can be built one by one, or you can use `node build examples` from the repository root to build all examples in one go.

### 6.1. Minimal

This example is found in [/examples/minimal](/examples/minimal).

The build instructions JSON file in this example describes a basic build consisting of a single HTML file, a single JavaScript source file to be compiled, and some extra files relevant to the build (CSS stylesheets and image files).

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

`"sources"` is a list of JavaScript source files to be processed.

`"files"` is a list of files relevant to the build, for example CSS files and images. These files will be copied over on first run. On subsequent builds, only files which are newer than build-side files will be copied. Masks (`*` - everything including subfolders, `*.*` - everything excluding subfolders, `*.css` - all css files, and similar) can be used in this entry.


To build this example, run `node build examples/minimal` from the repository root.

### 6.2. Headers

This example is found in [/examples/headers](/examples/headers).

This example demonstrates various ways of prepending compiled output with commented headers that contain some data. Investigate the `build.json` file to see details on how the build is set-up.

This build compiles several JavaScript source files and prepends headers to them:

- `script1.js` is compiled to `script1.min.js` and prepended by a one-line header with static text:
```JS
/* This is a simple, one-line header. */
```

- `script2.js` is compiled to `script2.min.js` and prepended by a multi-line header  with static text:
```JS
/* This is a
 * multiline
 * header. */
```

- `script3.js` is compiled to `script3.min.js` and prepended by a multi-line header containing variables extracted from the source file:
```JS
/* This is a multiline header
 * that uses some variables.
 *
 * Script written by Alice Adams
 * (c) 2023 ByteWave Technologies */
```


- `script4.js` is compiled to `script4.min.js` and prepended by a multi-line shared header that is described globally inside `build.json` and can be reused across many source files. This header also uses variables:
```JS
/* This is a global header that can be reused many times.
 * Variables used here will depend on the individual
 * scripts that use this header.
 *
 * Script written by Brian Baker
 * (c) 2023 DataSphere Innovations */
```

- `script5.js` is compiled to `script5.min.js` and prepended by the same multi-line shared header as `script4.js`. Same variables are used, but values from `script5.js` are extracted instead:
```JS
/* This is a global header that can be reused many times.
 * Variables used here will depend on the individual
 * scripts that use this header.
 *
 * Script written by Charlotte Carter
 * (c) 2023 QuantumLogic Systems */
```


To build this example, run `node build examples/headers` from the repository root.

### 6.3. Website

This example is found in [/examples/website](/examples/website).

This example is a basic website template consisting of `index.html`, `blog.html` and `about.html` with some associated scripts and stylesheets.

To build this example, run `node build examples/website` from the repository root.

### 6.4. Preprocessor

This example is found in [/examples/preprocessor](/examples/preprocessor).

This example demonstrates some of the ways in which we can use the preprocessor. All relevant scripts are located in the `src/` directory:

- `variables.js` shows a basic way to use preprocessor variables. When `-param1` is passed to the build system, `VAR="foo"` will be sent to the preprocessor. When `-param2` is passed, `VAR="bar"` will be passed instead. Different output will be shown in `index.html` based on the variable value.

- `local.js` shows a basic technique where we run one block of code locally, and another in a release build. We can pass `-release` to the build system to see the effect it has in `index.html`.

- `include.js` shows how we can use the preprocessor to easily "paste" contents of an external script into this script. Note that the preprocessor has to be forced when compiling this script, which is why we use `"preprocess": true` in the build instructions file.

The structure in `build.json` should be self-explanatory. We define groups of variables and then pass them as parameters on the command line.

To build this example, run `node build examples/preprocessor` from the repository root.

Some other ways to build this example are:

- `node build examples/preprocessor -param1`
- `node build examples/preprocessor -param2`
- `node build examples/preprocessor -release`
- `node build examples/preprocessor -param1 -release`
- `node build examples/preprocessor -param2 -release`

Depending on which parameters are sent to the build system, the build-side scripts will vary in behavior and the output in `index.html` will change.

### 6.5. Bundle

This example is found in [/examples/bundle](/examples/bundle).

This example demonstrates the idea behind script bundling. What we're doing in this example is we're taking the following structure of files:
```
📁 src
 └─ 📄 script_a.js
 └─ 📄 script_b.js
 └─ 📄 script_c.js
```

And we're gluing them together and compiling them into a single file. After building, we get:
```
📁 src
 └─ 📄 script.min.js
```

YABS.js will also automatically update the `index.html` file such that the following:
```
<script src="src/script_a.js"></script>
<script src="src/script_b.js"></script>
<script src="src/script_c.js"></script>
```

Becomes:
```
<script src="src/script.min.js"></script>
```

To build this example, run `node build examples/bundle` from the repository root.

### 6.6. Library

This example is found in [/examples/library](/examples/library).

This example demonstrates building a basic utility library. The basic idea here is that we have a development environment and a distribution build.

On the development side, we have:
```
📁 src
 └─ 📄 library.js
📁 tests
 └─ 📄 test_local.js
 └─ 📄 test_dist.js
```

We can run `test_local.js` by navigating to `examples/library/tests/` and typing `node test_local`. Note that `test_dist` will not work here (it is copied over to the distribution side when building).

On the distribution side (after building), we have:
```
📁 src
 └─ 📄 library.min.js
📁 tests
 └─ 📄 test_dist.js
```

And here we can run `test_dist.js` by navigating to `build/examples/library/tests/` and typing `node test_dist`.

To build this example, run `node build examples/library` from the repository root.

### 6.7. Events

This example is found in [/examples/events](/examples/events).

This example demonstrates the use of build events. The relevant entry in the `build.json` file in this example is the `"events"` listing:

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

Both the pre-build and post-build events listings are a script or a list of scripts to be run upon entering the build.

`pre_build.js` demonstrates a synchronous script that outputs some text and shows the basics of how how arguments passed from YABS.js can be extracted.

`post_build.js` demonstrates an asynchronous script that halts the build for 2 seconds before letting the build continue by signaling YABS.js with a `process.send` to let it know it can move on with the build. This example script also shows how to extract the extra parameters that were defined in the build instructions file.

Please see the source code of `pre_build.js` and `post_build.js` for more detail as they are well-commented.

To build this example, run `node build examples/events` from the repository root.

### 6.8. Game

This example is found in [/examples/game](/examples/game).

This example demonstrates a basic HTML5 platformer game built on the [myst.js](https://github.com/metayeti/myst.js) engine.

The setup demonstrates a typical game development scenario. The build accomplishes the following:
- It strips any debug-related code out of the release build.
- It bundles all scripts into one minified output and attaches a header with copyright and version info.
- It excludes files we don't not need in release (files in `dev/` in this example), separating our development and production environment.
- It updates associated files (files in `css/`, `data/` and `lib/` in this example).

This example also demonstrates a useful setup for the preprocessor. If we take a peak into `src/meta.js`, we will see this:

```JS
// >-- preprocessor variables -->

//? if (typeof DEBUG === 'undefined') DEBUG = false;
//? const RELEASE = !DEBUG;

// <-- preprocessor variables <--
```

This defines two compile-time variables named `DEBUG` and `RELEASE`. In this example we set the environment such that our local code behaves as if it is in "debug" mode by default so during development, we treat everything as if debug is on. For release builds, we simply strip this code out by wrapping it like this:

```JS
//? if (DEBUG) {
  debug_feature1()
  debug_feature2()
//? }
```

With a setup like this, any time we run the build we will skip this block of code. This allows us to maintain a debug version of the game on the development-side and a release version of the game on production-side. An alternative approach would involve dedicated debug builds (but it would also avoid the convenience of being able to locally run code live).

We can build with the `-debug` flag if we want to preserve debug features.

To run the game, open `index.html` with any modern desktop browser and click the center of the page where it says "Click to play". A keyboard is required to play this game.

How to play:
- Use arrow keys to move
- Use Z to jump
- Use X to shoot

To build this example, run `node build examples/game` from the repository root.

To build this example while preserving debug features, run: `node build examples/game -debug` or `node build -debug examples/game`.

## 7. Command line parameters

Optional parameters begin with `--` and provide additional features to be used in the command line.

- `--nofail` In a [batch build](#57-batch-building), will keep the build going even if any of the builds in line fail.
- `--version` Displays version info.
- `--help` Opens the online repository with help reference.