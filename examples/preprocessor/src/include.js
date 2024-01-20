/* This example script demonstrates preprocessor includes.
 *
 * We will be including two files: include_a.js and include_b.js.
 * These will simply be "pasted" into output.
 *
 * Note that "preprocess": true is used for this file in the build
 * instructions file. This is to force preprocessor as it does not
 * run by default.
 */

/* Include an external script. */

/*
 *
 *    Note that this path is relative to _this_ sourcefile,
 *    and not to the build instructions file root path.
 *            |
 *            |
 *            +--------+
 *                     |
 *                     V
 */

//? include('includes/include_a.js');

/* Include another external script. */

//? include('includes/include_b.js');
