/* To build this example, use:
 * node yabs.js examples/preprocessor -param1
 * - or -
 * node yabs.js examples/preprocessor -param2
 * - or both -
 * node yabs.js examples/preprocessor -param1 -param2
 */

/* The code below will behave differently depending on whether or not
 * the flags -param1 or -param2 has been used: */

/* First let's check the flags and setup defaults. */

//? if (typeof PARAM1 === 'undefined') PARAM1 = false;
//? if (typeof PARAM2 === 'undefined') PARAM2 = false;

/* If this build was compiled with -param1, output a message. */

//? if (PARAM1) {
//?= "{"
//?= "const $content = document.getElementById('content');"
//?= "const $p = document.createElement('p');"
//?= "$p.innerHTML = 'This build was compiled with <span class=\"highlight\">-param1</span>!';"
//?= "$content.appendChild($p);"
//?= "}"
//? }

/* If this build was compiled with -param2, output a message. */

//? if (PARAM2) {
//?= "{"
//?= "const $content = document.getElementById('content');"
//?= "const $p = document.createElement('p');"
//?= "$p.innerHTML = 'This build was compiled with <span class=\"highlight\">-param2</span>!';"
//?= "$content.appendChild($p);"
//?= "}"
//? }
