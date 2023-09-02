/* First let's check the type of build and configure for release. */

//? if (typeof DEBUG === 'undefined') DEBUG = false;
//? const RELEASE = !DEBUG;

/* If this is the release version, change some text in the document. */

//? if (RELEASE) {
//? write("const $firstp = document.querySelector('p');");
//? write("$firstp.innerHTML = 'This example demonstrates preprocessor features. This example is now running in &rsquo;RELEASE&rsquo; mode.';");
//? }
