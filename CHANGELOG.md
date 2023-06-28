## 1.1.0 (?)
- `BUGFIX` Relative paths are now handled correctly when writing HTML files (paths such as `src="../../script.js"` are now parsed and written to output correctly).
- `FEATURE` Implements script bundling.
- `FEATURE` Paths can now be passed to YABS.js directly whenever `build.json` (or `build_all.json`) is present there. This works for parameters and batch builds - where previously you had to specify "path/to/build.json", now you can just do "path/to".
- `FEATURE` Added `--version` and `--help` global parameters.

## 1.0.0 (June 19, 2023)
- Release 1.0.0
