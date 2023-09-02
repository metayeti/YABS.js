// This script includes two external sourcefiles via the preprocessor.

// Note: normally, the preprocessor only runs when invoking a build with a -variable
// parameter. Since we don't care about that when using preprocessor includes, we
// need to "force" the use of preprocessor by setting the "preprocess" option to
// true in build.json for this specific script.

/* Include an external script. */

//? include('includes/include_a.js');

/* Include another external script. */

//? include('includes/include_b.js');
