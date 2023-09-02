/* To build this example in debug "mode" (simulated), use: node yabs.js examples/preprocessor -debug */
/* You will note that with the code below, the local development code will behave as if it's running in debug,
 * meaning it will skip over all the comments. In release "mode", the lines after ?= will be outputted to script. */

/* First let's check the type of build and configure for release. */

//? if (typeof DEBUG === 'undefined') DEBUG = false;
//? const RELEASE = !DEBUG;

/* If this is the release version, change some text in the document. */

//? if (RELEASE) {
//?= "const $firstp = document.querySelector('p');"
//?= "$firstp.innerHTML = 'This example demonstrates preprocessor features. This example is now running in &rsquo;RELEASE&rsquo; mode.';"
//? }