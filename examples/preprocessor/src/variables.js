/* This example script demonstrates basic use of preprocessor variable groups.
 *
 * If we use -param1 when building, we will get VAR="foo" on the preprocessor side.
 * If we use -param2 when buildilng, we will get VAR="bar" on the preprocessor side.
 *
 */

{
	const $content = document.getElementById('content');
	const $p = document.createElement('p');

//? if (VAR=="foo") {

	$p.innerHTML = 'This build was invoked with -param1 and has variable<code>VAR="foo"</code>.';

//? } else if (VAR=="bar") {

	$p.innerHTML = 'This build was invoked with -param2 and has variable <code>VAR="bar"</code>.';

//? } else {

	/* Note that locally, both of the above expressions will be evaluated since they
	 * are not commented out. To see an example of how to prevent code from executing
	 * locally, see the local.js example. */

	$p.innerHTML = 'This build was NOT invoked with either -param1 or -param2.';

//? }

	$content.appendChild($p);
}
