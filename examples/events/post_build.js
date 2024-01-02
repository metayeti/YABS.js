// This is an example for a post-build script.
// This script will be invoked after the build completes.

// We can output text on the screen from here:

console.log('This is output from post_build.js.');

// We can parse the arguments passed to this script.

// We can discard the first two arguments (path to node and path to this script).
const argv = process.argv.slice(2); 

// Now we can extract some arguments:
const build_source_dir = argv[0]; // Build source directory.
const build_destination_dir = argv[1]; // Build destination directory.

// Note that at this point, unlike in the pre_build.js example, the entire directory
// structure on the build-side already exists. This means we don't have to bother
// with creating directories manually like we would have to in the prebuild event.

// After source and destination build directories follow all the parameters defined
// by the build instructions file.

// We can extract these parameters:
const extra_params = argv.slice(2); // Discard the first two arguments.
const extra_params_output = extra_params.join(', '); // Stringify for output.

console.log(`Using parameters: ${extra_params_output}`);

// This script demonstrates asynchronous usage where we do something and then signal
// the system that we're ready to pass control of execution flow back to YABS.js.
// Here we will demonstrate this behavior with a simple timer.

console.log('We\'re going to delay this build event script by 2 seconds to demonstrate async exit.');

// Wait 2 seconds before passing control back.
setTimeout(() => {

    // All done now. To pass control, simply use process.send with any non-empty parameter.
    // Here, { exit: 'ok' } is used as a convention.

    // Pass control back to YABS.js.
    process.send({ exit: 'ok' }); 

    // The build will continue from here.
}, 2000);