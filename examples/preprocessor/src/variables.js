/* To build this example, use:
 * node yabs.js examples/preprocessor -oranges
 * - or -
 * node yabs.js examples/preprocessor -bananas
 * - or both -
 * node yabs.js examples/preprocessor -oranges -bananas
 */

/* The code below will behave differently depending on whether or not
 * the flags -oranges or -bananas has been used: */

/* First let's check the flags and setup defaults. */

//? if (typeof ORANGES === 'undefined') ORANGES = false;
//? if (typeof BANANAS === 'undefined') BANANAS = false;

/* If this build was compiled with -oranges, output a message. */

//? if (ORANGES) {
//?= "{"
//?= "const $content = document.getElementById('content');"
//?= "const $p = document.createElement('p');"
//?= "$p.innerHTML = 'This build was compiled with <span class=\"highlight\">-oranges</span>!';"
//?= "$content.appendChild($p);"
//?= "}"
//? }

/* If this build was compiled with -bananas, output a message. */

//? if (BANANAS) {
//?= "{"
//?= "const $content = document.getElementById('content');"
//?= "const $p = document.createElement('p');"
//?= "$p.innerHTML = 'This build was compiled with <span class=\"highlight\">-bananas</span>!';"
//?= "$content.appendChild($p);"
//?= "}"
//? }
