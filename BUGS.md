## KNOWN BUGS

1. Glue step should insert newlines between glued scripts, otherwise the output can be glued in incorrect ways,
   leading to errors.

2. <script> tags do not update correctly when parameters are tagged on, for example:
   <script src='src/script.js?v=4.2'></script>
   
3. Preprocessor fails when using undefined variables, add entry to readme that clarifies how to use those.