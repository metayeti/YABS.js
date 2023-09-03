/* To build this example in debug "mode" (simulated), use: node yabs.js examples/preprocessor -debug */

/* You will note that with the code below, the local development code will behave as if it's running in debug,
 * meaning it will skip over all the comments. In release "mode", the lines after ?= will be outputted to script. */

// Note: normally, the preprocessor only runs when invoking a build with a -variable
// parameter. Since we want this file to be run through the preprocessor when no
// parameters are invoked, we need to "force" the use of the preprocessor by setting
// the "preprocess" option to true in build.json for this specific script.

/* First let's check the type of build and configure for release. */

//? if (typeof DEBUG === 'undefined') DEBUG = false;
//? const RELEASE = !DEBUG;

/* If this is the release version, change some text in the document. */

//? if (RELEASE) {
//?= "const $firstp = document.querySelector('p');"
//?= "$firstp.innerHTML = 'This example demonstrates preprocessor features. This example is now running in &rsquo;RELEASE&rsquo; mode.';"
//? }

/* If this is the debug version, we can add features as plain code.
 * This will make it so that when running locally, the code will behave
 * as if the meta comments are just normal comments. When building, the preprocessor will kick in
 * and omit the code below, unless compiled with -debug. */

//? if (DEBUG) {
	console.log('This message will only show up in debug mode!');
//? }