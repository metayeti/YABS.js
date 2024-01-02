// This is an example for a pre-build script.
// This script will be invoked before the build begins.

// We can output text on the screen from here:

console.log('This is output from pre_build.js.');

// We can parse the arguments passed to this script.

// We can discard the first two arguments (path to node and path to this script).
const argv = process.argv.slice(2); 

// Now we can extract some arguments:
const build_source_dir = argv[0]; // Build source directory.
const build_destination_dir = argv[1]; // Build destination directory.

console.log(`Build source directory is: ${build_source_dir}`);
console.log(`Build destination directory is: ${build_destination_dir}`);

// Note that the destination directory or any directory contained within, might not
// yet exist at this point in the build. The directories will be created on demand
// as the build is running, but since this is a pre-build event we may need to account
// for the first-build situation where the destination directories haven't yet been
// created.

// We can compensate by either checking if the directory exists with fs.existsSync
// and then skipping this script if it does not, or we can create our own required
// directories with fs.makedirSync. Note we need to require('fs') for these
// functions.

// This script demonstrates synchronous usage where a sequence of commands runs,
// after which we pass control of execution flow back to YABS.js.

// This means we're all done here! The build will continue from here.