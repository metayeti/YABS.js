## 1.1.0 (?)
- `FEATURE` Implements script bundling, you can now compile multiple scripts into one by using bundles.
- `BUGFIX` Relative paths are now handled correctly in HTML files (paths such as `src="../../script.js"` are parsed and written back to output correctly).
- `FEATURE` Paths can now be passed to YABS.js directly whenever `build.json` (or `build_all.json`) is present in that path. This applies to command line parameters as well as a batch build listing. Where previously you had to specify `"path/to/build.json"`, now you can simply use `"path/to"` and `"build.json"` is implied.
- `API CHANGE` Renamed `"file"` entry in `"batch_build"` to `"target"` for greater clarity since `"file"` is already used in `"scripts"`.
- `FEATURE` Clearer error messages.
- `CHANGE` Output unix-style newlines (LF) only. This is for consistency's sake, since uglify-js also only outputs LF and there really doesn't seem to be a good reason to preserve CRLF in files whose sources use it (LF saves a tiny amount of space, and all parsers under the sun understand LF-encoded files). If the user for some reason really desires CRLF in the output, there is a constant at the top of yabs.js named yabs.NEWLINE_SYMBOL which you can change to '\r\n' to achieve a CRLF encoding in the output, however - note that uglify-js may output LF when --compress is used to save space.
- `BUGFIX` Many tiny bugfixes.
- `FEATURE` Added `--version` and `--help` command line parameters.

## 1.0.0 (June 19, 2023)
- Release 1.0.0
