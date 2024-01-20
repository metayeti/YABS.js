/* This example script demonstrates how to separate local and release code.
 *
 */

{
	const $content = document.getElementById('content');
	const $p = document.createElement('p');

//? if (RELEASE) {

/* We can evaluate release build expressions like this example shows.
 * This way we completely skip this code locally because it is all commented out.
 * This evaluates whenever a -release parameter is passed. */

/* The following is pasted *directly*. This means that any code can be
 * wrapped and pasted into output like this example shows. */

//?= "$p.innerHTML = 'This example was invoked with -release.'"

//? } else {

/* This will be evaluated locally, or whenever the -release parameter has not been passed. */

	$p.innerHTML = 'This example is running locally, or was not invoked with -release.';

//? }

	$content.appendChild($p);

}
