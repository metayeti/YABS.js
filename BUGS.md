## KNOWN BUGS

[ ] With no build.json file, the reported error is:

Error: TypeError: Cannot read properties of null (reading 'isBatchBuild')

Should be something like

Error: Cannot find path or file: build.json

[ ] Potential bug: "use_variables" should probably work alongside with "variables" and merge the entries (priority "variables")?

