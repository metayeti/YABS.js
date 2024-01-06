## KNOWN BUGS

1. ~~Glue step should insert newlines between glued scripts, otherwise the output can be glued in incorrect ways, leading to errors.~~ (fixed in 1.1.1)

2. ~~`<script>` tags do not update correctly when parameters are tagged on, for example:~~

   `<script src='src/script.js?v=4.2'></script>` (fixed)
   
3. Preprocessor fails when using undefined variables, add entry to readme that clarifies how to use those.

4. ~~Bundle builds without "output_file" for some reason output Error: Bundled scripts require an "output_field" entry!.~~ (fixed)

5. Potential bug: "use_variables" should probably work alongside with "variables" and merge the entries (priority "variables")?

6. ~~Batch build listing a folder with nonexisting build.json will output Error: TypeError: Cannot read properties of null (reading 'isBatchBuild'), should output something more coherent.~~ (fixed)

7. ~~commented script tags in HTML should be ignored~~ (fixed)