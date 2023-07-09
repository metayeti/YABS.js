## 1.1.0 (?)
- `BUGFIX` Relative paths are now handled correctly in HTML files (paths such as `src="../../script.js"` are parsed and written back to output correctly).
- `FEATURE` Implements script bundling.
- `FEATURE` Paths can now be passed to YABS.js directly whenever `build.json` (or `build_all.json`) is present in that path. This applies to command line parameters as well as a batch build listing. Where previously you had to specify "path/to/build.json", now you can just do "path/to" and "build.json" is implied.
- `FEATURE` Added `--version` and `--help` command line parameters.
- `API CHANGE` Renamed `"file"` entry in `"batch_build"` to `"target"` for greater distinction and clarity since `"file"` is already used in `"scripts"`.
- `FEATURE` Clearer error messages.
- `BUGFIX` Many tiny bugfixes.

## 1.0.0 (June 19, 2023)
- Release 1.0.0
