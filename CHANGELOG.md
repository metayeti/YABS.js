## 1.2.0 (?)
- `FEATURE` Added enumerated output to batch builds so that failed builds can be identified more easily.
- `FEATURE` Recursive batch builds are now allowed (you can batch-build a bunch of batch-builds).
- `FEATURE` Better testcases and friendlier examples.
- `FEATURE` Pre-bui post-build events.
- `BUGFIX` Fixed a bug where relative paths were calculated incorrectly for bundled scripts with backwards output src's (`<script src="../script.min.js">`). Also fixes relative paths for arbitrary `output_file` values.
- `BUGFIX` Fixed a bug where output `<script>` tags would not update correctly when additional parameters were added to `src`, for example `<script src="code.js?a=param1&b=param2">`.
- `BUGFIX` If HTML comments contain `<script>` tags, they now get ignored when writing back the HTML to build destination. Such comments are skipped entirely in the output HTML.
- `BUGFIX` Many more tiny bugfixes.
- (wip) `FEATURE` Can now specify a default set of preprocessor variables.
- (wip) `FEATURE` Any parameter, not just preprocessor variables allowed in `"batch_build"` `"options"` entry (this means you can make batch builds where one of the items will always --rebuild, etc.).
- (maybe) `BUGFIX` Preprocess includes can now be used in bundles as well.

## 1.1.1 (September 12, 2023)
- `HOTFIX` Glue step for bundled scripts now adds newlines between individual scripts to prevent cases where one script ending on a comment would comment out the next script's first line.

## 1.1.0 (July 11, 2023)
- `FEATURE` Implements script bundling, it is now possible to combine multiple scripts into one by using bundles.
- `FEATURE` Paths can now be passed to YABS.js directly whenever `build.json` (or `build_all.json`) is present in that path. This applies to command line parameters as well as a batch build listing. Where previously you had to specify `"path/to/build.json"`, now you can simply use `"path/to"` and `"build.json"` is implied.
- `API CHANGE` Renames `"file"` entry in `"batch_build"` to `"target"` for greater clarity since `"file"` is already used in `"scripts"`.
- `FEATURE` Outputs clearer error messages.
- `CHANGE` Outputs unix-style newlines (LF) only - this is for consistency's sake, since uglify-js also only outputs LF and there really doesn't seem to be a good reason to preserve CRLF in files whose sources originally use it (but there is an argument for using LF only - using LF saves a tiny amount of space, and all parsers under the sun understand LF-encoded files). If the user for some reason really wants CRLF in the output, there is a constant at the top of yabs.js named yabs.NEWLINE_SYMBOL which you can change to '\r\n' to achieve a CRLF encoding in the output, however - note that uglify-js may output LF when --compress is used to save space.
- `FEATURE` Adds `--version` and `--help` command line parameters.
- `BUGFIX` Relative paths are now handled correctly for HTML files (paths such as `src="../../script.js"` are parsed and written back to output correctly).
- `BUGFIX` Many tiny bugfixes.

## 1.0.0 (June 19, 2023)
- Release 1.0.0
