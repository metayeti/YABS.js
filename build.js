/* YABS.js 1.1.0 (c) 2023 Danijel Durakovic
 * https://github.com/pulzed/yabs.js
 * Licensed under the MIT license */
const path=require("path"),fs=require("fs"),exec=require("child_process")["exec"],EOL=require("os")["EOL"],yabs={version:"1.1.0",DEFAULT_BUILD_ALL_FILE:"build_all.json",DEFAULT_BUILD_FILE:"build.json",DEFAULT_COMPILE_OPTIONS:"--compress --mangle",COMPILED_SOURCE_EXTENSION:".min.js",PREPROCESS_FILE_EXTENSION:".pre",COMPILE_FILE_EXTENSION:".cmp",util:{}};yabs.util.exists=function(source_path){return fs.existsSync(source_path)},yabs.util.isDirectory=function(source_path){return fs.lstatSync(source_path).isDirectory()},yabs.util.getModifiedTime=function(source_path){return fs.statSync(source_path).mtime},yabs.util.isSourceNewer=function(source_path,destination_path){source_path=Date.now()-yabs.util.getModifiedTime(source_path);return 1e3<=Date.now()-yabs.util.getModifiedTime(destination_path)-source_path},yabs.util.getFilesWithRecursiveDescent=function(source_dir,destination_dir,mask,depth=0){let list=[];if(yabs.util.exists(source_dir))return fs.readdirSync(source_dir).forEach(listing_entry=>{var nested_source_path=path.join(source_dir,listing_entry),listing_entry=path.join(destination_dir,listing_entry);if(yabs.util.isDirectory(nested_source_path))"*"===mask[0]&&null===mask[1]&&(list=list.concat(yabs.util.getFilesWithRecursiveDescent(nested_source_path,listing_entry,mask,depth+1)));else{if("*"===mask[0]&&"*"!==mask[1]&&null!==mask[1]){var parsed_nested_source_path=path.parse(nested_source_path);if(mask[1]!==parsed_nested_source_path.ext)return}yabs.util.exists(listing_entry)&&!yabs.util.isSourceNewer(nested_source_path,listing_entry)||list.push({source:nested_source_path,destination:listing_entry})}}),list;throw"Could not locate path: "+source_dir},yabs.util.parseJSDocTagsFromFile=function(source_file){const output=[];const tag_regex=/\*\s*@(\w+)\s+(.+)/g;source_file=fs.readFileSync(source_file,{encoding:"utf8",flag:"r"}).match(/\/\*\*(.*?)\*\//gs);return source_file&&source_file.forEach(regex_match=>{for(;null!==(tag_match=tag_regex.exec(regex_match));){var tag_key=tag_match[1],tag_match=tag_match[2];output.push([tag_key,tag_match])}}),output},yabs.util.openURLWithBrowser=function(url){var start_cmd=function(){switch(process.platform){case"darwin":return"open";case"win32":return"start";default:return"xdg-open"}}();require("child_process").exec(start_cmd+" "+url)},yabs.Logger=class{constructor(){var is_tty=process.stdout.isTTY;this._OUTPUT_RESET=is_tty?"[0m":"",this._OUTPUT_BRIGHT=is_tty?"[1m":"",this._OUTPUT_FG_RED=is_tty?"[31m":"",this._OUTPUT_FG_GREEN=is_tty?"[32m":"",this._OUTPUT_FG_YELLOW=is_tty?"[33m":""}out(message){process.stdout.write(message+`
`)}out_raw(message){process.stdout.write(message)}ok(){process.stdout.write(" "+this._OUTPUT_BRIGHT+this._OUTPUT_FG_GREEN+`ok${this._OUTPUT_RESET}
`)}info(message){process.stdout.write(`* ${message}

`)}endl(){process.stdout.write("\n")}error(message){process.stdout.write(""+this._OUTPUT_BRIGHT+this._OUTPUT_FG_RED+"Error: "+this._OUTPUT_RESET+message+`
`)}success(message){process.stdout.write(""+this._OUTPUT_BRIGHT+this._OUTPUT_FG_GREEN+"Success: "+this._OUTPUT_RESET+message+`
`)}header(){this.out_raw(""+this._OUTPUT_BRIGHT+this._OUTPUT_FG_YELLOW),this.out("  __ __ _____ _____ _____     _"),this.out(" |  |  |  _  |  _  |   __|   |_|___"),this.out("  \\_   |     |  _ -|__   |_  | |_ -|"),this.out("   /__/|__|__|_____|_____|_|_| |___|"),this.out("                           |___|"),this.out_raw(""+this._OUTPUT_RESET),this.out(" Yet"),this.out(" Another"+" ".repeat(32-yabs.version.length)+"[ v"+yabs.version+" ]"),this.out(" Build      https://github.com/pulzed/yabs.js"),this.out(" System.js         (c) 2023 Danijel Durakovic"),this.endl()}},yabs.BuildConfig=class{constructor(source_file){var parsed_source_file=path.parse(source_file),parsed_source_file=(this._source_file=parsed_source_file.base,this._base_dir=parsed_source_file.dir,fs.readFileSync(source_file,{encoding:"utf8",flag:"r"}));const json_data=JSON.parse(parsed_source_file);if(json_data.hasOwnProperty("batch_build")){if(this._is_batch=!0,this._batch_listing=[],json_data.batch_build instanceof Array)return void json_data.batch_build.forEach(batch_entry=>{var batch_entry_object;"string"==typeof batch_entry?this._batch_listing.push({target:batch_entry}):"object"==typeof batch_entry&&null!==batch_entry&&(batch_entry_object={},batch_entry.hasOwnProperty("target")&&"string"==typeof batch_entry.target&&(batch_entry_object.target=batch_entry.target),batch_entry.hasOwnProperty("options")&&"string"==typeof batch_entry.options&&(batch_entry_object.options=batch_entry.options),batch_entry_object.target)&&this._batch_listing.push(batch_entry_object)});throw'The "batch_build" entry has to be an Array type!'}if(!json_data.hasOwnProperty("source_dir"))throw'Missing "source_dir" entry!';if(this._source_dir=json_data.source_dir,!json_data.hasOwnProperty("destination_dir"))throw'Missing "destination_dir" entry!';if(this._destination_dir=json_data.destination_dir,json_data.hasOwnProperty("html"))if(json_data.html instanceof Array){if(!json_data.html.every(element=>"string"==typeof element))throw'Every element in "html" entry has to be a String type!';this._html_listing=json_data.html}else"string"==typeof json_data.html&&(this._html_listing=[json_data.html]);if(this._html_listing||(this._html_listing=[]),json_data.hasOwnProperty("sources")){if(!(json_data.sources instanceof Array))throw'The "sources" entry has to be an Array type!';this._sources_listing=[],json_data.sources.forEach(source_entry=>{if("string"==typeof source_entry)this._sources_listing.push({file:source_entry});else if("object"==typeof source_entry&&null!==source_entry){var source_entry_object={};if(source_entry.hasOwnProperty("output_file")&&"string"==typeof source_entry.output_file&&(source_entry_object.output_file=source_entry.output_file),source_entry.hasOwnProperty("compile_options")&&"string"==typeof source_entry.compile_options&&(source_entry_object.compile_options=source_entry.compile_options),source_entry.hasOwnProperty("bundle")){if(void 0===source_entry_object.output_file)throw'Bundled scripts require an "output_field" entry!';if(!(source_entry.bundle instanceof Array))throw'The "bundle" entry has to be an Array type!';if(!source_entry.bundle.every(element=>"string"==typeof element))throw'Every element in "bundle" entry has to be a String type!';source_entry_object.is_bundle=!0,source_entry_object.bundle_files=source_entry.bundle}else source_entry.hasOwnProperty("file")&&"string"==typeof source_entry.file&&(source_entry_object.file=source_entry.file);if(source_entry.hasOwnProperty("header"))if(source_entry.header instanceof Array){if(!source_entry.header.every(element=>"string"==typeof element))throw'Every item of "header" entry listing has to be a String type!';source_entry_object.header=source_entry.header}else"string"==typeof source_entry.header&&(source_entry_object.header=[source_entry.header]);else if(source_entry.hasOwnProperty("use_header")&&json_data.headers&&"string"==typeof source_entry.use_header&&json_data.headers.hasOwnProperty(source_entry.use_header)){var header_ref=json_data.headers[source_entry.use_header];if(header_ref instanceof Array){if(!header_ref.every(element=>"string"==typeof element))throw'Every item in "headers" entry listing has to be a String type!';source_entry_object.header=header_ref}else"string"==typeof header_ref&&(source_entry_object.header=[header_ref])}if(source_entry.hasOwnProperty("variables")){if("object"==typeof source_entry.variables&&!(source_entry.variables instanceof Array)&&null!==source_entry.variables){source_entry_object.variables={};for(const variable_key in source_entry.variables){var variable_data=source_entry.variables[variable_key];if(variable_data instanceof Array){if(!variable_data.every(element=>"string"==typeof element))throw'Every item in "variables" entry listing has to be a String type!';source_entry_object.variables[variable_key]=variable_data}}}}else if(source_entry.hasOwnProperty("use_variables")&&json_data.variables&&"string"==typeof source_entry.use_variables&&json_data.variables.hasOwnProperty(source_entry.use_variables)){var variables_ref=json_data.variables[source_entry.use_variables];if("object"==typeof variables_ref&&!(variables_ref instanceof Array)&&null!==variables_ref){source_entry_object.variables={};for(const variable_key in variables_ref){const variable_data=variables_ref[variable_key];if(variable_data instanceof Array){if(!variable_data.every(element=>"string"==typeof element))throw'Every item in "variables" entry listing has to be a String type!';source_entry_object.variables[variable_key]=variable_data}}}}source_entry.hasOwnProperty("preprocess")&&!0===source_entry.preprocess&&(source_entry_object.preprocess=!0),(source_entry_object.file||source_entry_object.is_bundle)&&this._sources_listing.push(source_entry_object)}})}if(this._sources_listing||(this._sources_listing=[]),json_data.hasOwnProperty("files"))if(json_data.files instanceof Array){if(!json_data.files.every(element=>"string"==typeof element))throw'Every element in "files" entry has to be a String type!';this._files_listing=json_data.files}else"string"==typeof json_data.files&&(this._files_listing=[json_data.files]);this._files_listing||(this._files_listing=[])}getSourceFile(){return this._source_file}getBaseDir(){return this._base_dir}isBatchBuild(){return this._is_batch}getBatchListing(){return this._batch_listing}getSourceDir(){return this._source_dir}getDestinationDir(){return this._destination_dir}getHTMLListing(){return this._html_listing}getSourcesListing(){return this._sources_listing}getFilesListing(){return this._files_listing}},yabs.Builder=class{constructor(logger,build_config,build_params){this._logger=logger,this._build_config=build_config,this._build_params=build_params,this._base_dir=this._build_config.getBaseDir(),this._source_dir=path.normalize(this._build_config.getSourceDir()),this._destination_dir=path.normalize(this._build_config.getDestinationDir()),this._files_manifest=null,this._sources_manifest=null,this._html_manifest=null,this._n_files_updated=0,this._build_start_time=Date.now()}_buildManifests(){this._files_manifest=[],this._sources_manifest=[],this._html_manifest=[],function(){this._build_config.getFilesListing().forEach(listing_entry=>{if(listing_entry.includes("*")){var full_source_path=path.join(this._base_dir,this._source_dir,listing_entry),full_source_path=path.parse(full_source_path),full_destination_path=path.join(this._destination_dir,listing_entry),full_destination_path=path.parse(full_destination_path);if(!full_source_path.dir.includes("*")&&"*"===full_source_path.name){var split_base=full_source_path.base.split(".");let mask=null;"*"===full_source_path.base?mask=["*",null]:"*.*"===full_source_path.base?mask=["*","*"]:"*"===split_base[0]&&"*"!==split_base[1]&&""!==split_base[1]&&(mask=["*",full_source_path.ext]),null!==mask&&(this._files_manifest=this._files_manifest.concat(yabs.util.getFilesWithRecursiveDescent(full_source_path.dir,full_destination_path.dir,mask)))}}else{split_base=path.join(this._base_dir,this._source_dir,listing_entry),full_source_path=path.join(this._destination_dir,listing_entry);if(!yabs.util.isDirectory(split_base)){let include_plain_file=!1;if(include_plain_file=!yabs.util.exists(full_source_path)||yabs.util.isSourceNewer(split_base,full_source_path)?!0:include_plain_file){if(split_base===full_source_path)throw`Source file: "${split_base}" cannot be the same as the destination!`;this._files_manifest.push({source:split_base,destination:full_source_path})}}}})}.call(this),function(){this._build_config.getSourcesListing().forEach(listing_entry=>{if(!listing_entry.file.includes("*")){var has_header=listing_entry.hasOwnProperty("header"),header_data={has_header:has_header},has_header=(has_header&&(header_data.header=[...listing_entry.header]),listing_entry.hasOwnProperty("variables")),variables_data={has_variables:has_header},has_header=(has_header&&(variables_data.variables=listing_entry.variables),!0===listing_entry.preprocess);let output_filename;var parsed_file_entry=path.parse(listing_entry.file),parsed_output_file=(output_filename=listing_entry.output_file?(parsed_output_file=path.parse(listing_entry.output_file),path.join(parsed_file_entry.dir,parsed_output_file.base)):path.join(parsed_file_entry.dir,parsed_file_entry.name+yabs.COMPILED_SOURCE_EXTENSION),path.join(this._base_dir,this._source_dir,listing_entry.file)),parsed_file_entry=path.join(this._source_dir,listing_entry.file),destination_full_path=path.join(this._destination_dir,output_filename);if(parsed_output_file===destination_full_path)throw`Source file: "${parsed_output_file}" cannot be the same as the destination!`;listing_entry=listing_entry.hasOwnProperty("compile_options")?listing_entry.compile_options:yabs.DEFAULT_COMPILE_OPTIONS;this._sources_manifest.push({source:parsed_output_file,original_source:parsed_file_entry,destination:destination_full_path,compile_options:listing_entry,header_data:header_data,variables_data:variables_data,force_preprocessor:has_header})}})}.call(this),function(){this._build_config.getHTMLListing().forEach(listing_entry=>{if(!listing_entry.includes("*")){var html_file_source=path.join(this._base_dir,this._source_dir,listing_entry),listing_entry=path.join(this._destination_dir,listing_entry);if(html_file_source===listing_entry)throw`Source file: "${html_file_source}" cannot be the same as the destination!`;this._html_manifest.push({source:html_file_source,destination:listing_entry})}})}.call(this)}_verifySourceFiles(){function verifyManifest(manifest_list){manifest_list.forEach(manifest_entry=>{var manifest_entry=manifest_entry.source,path_resolved=path.resolve(manifest_entry);if(!yabs.util.exists(path_resolved))throw"Could not find file: "+manifest_entry})}verifyManifest.call(this,this._files_manifest),verifyManifest.call(this,this._sources_manifest),verifyManifest.call(this,this._html_manifest)}_processSourceHeaders(){this._sources_manifest.forEach(manifest_entry=>{var header_data=manifest_entry.header_data;if(header_data.has_header){let has_variables=!1;if(header_data.header.every(header_str=>!/%\S+%/.test(header_str)&&!/\$YEAR\$/.test(header_str)||!(has_variables=!0)),has_variables){var manifest_entry=manifest_entry.source,parsed_variables=yabs.util.parseJSDocTagsFromFile(manifest_entry);for(let i=0;i<header_data.header.length;++i){for(let j=0;j<parsed_variables.length;j++){var variable_entry=parsed_variables[j];header_data.header[i]=header_data.header[i].replace(new RegExp(`%${variable_entry[0]}%`,"g"),variable_entry[1])}header_data.header[i]=header_data.header[i].replace(/\$YEAR\$/g,(new Date).getFullYear())}}}})}_buildStep_I_UpdateFiles(){this._files_manifest.forEach(manifest_entry=>{this._logger.out_raw(manifest_entry.destination+" ...");var dir=path.dirname(manifest_entry.destination);yabs.util.exists(dir)||fs.mkdirSync(dir,{recursive:!0}),fs.copyFileSync(manifest_entry.source,manifest_entry.destination),this._logger.ok(),this._n_files_updated+=1}),this._logger.endl()}async _buildStep_II_CompileSources(){function preprocessOneSource(input_file,output_file,params){return new Promise((resolve,reject)=>{exec(`metascript ${input_file} ${params} > `+output_file,err=>{err?(this._logger.out_raw("\n\n"),reject(err)):resolve()})})}function compileOneSource(input_file,output_file,params){return new Promise((resolve,reject)=>{exec(`uglifyjs ${input_file} ${params} -o `+output_file,err=>{err?(this._logger.out_raw("\n\n"),reject(err)):resolve()})})}for(const manifest_entry of this._sources_manifest){this._logger.out_raw(manifest_entry.destination+" ...");var dir=path.dirname(manifest_entry.destination);yabs.util.exists(dir)||fs.mkdirSync(dir,{recursive:!0});let use_preprocessor=!1;var variable_params=this._build_params.variable,dir=manifest_entry.variables_data,has_variables=dir.has_variables;const variables_listing=dir.variables;if(manifest_entry.force_preprocessor)use_preprocessor=!0;else if(has_variables)for(let i=0;i<variable_params.length;++i)if(variables_listing.hasOwnProperty(variable_params[i])){use_preprocessor=!0;break}let preprocess_destination_file;if(use_preprocessor){const preprocessor_params_list=[];has_variables&&variable_params.forEach(variable_param=>{variables_listing.hasOwnProperty(variable_param)&&variables_listing[variable_param].forEach(variable_entry=>{var variable_entry=variable_entry.split("="),variable_key=variable_entry[0].trim(),variable_entry=variable_entry[1].trim();variable_key.length&&variable_entry.length&&preprocessor_params_list.push(`-${variable_key}=`+variable_entry)})});dir=preprocessor_params_list.join(" "),has_variables=manifest_entry.source;preprocess_destination_file=manifest_entry.destination+yabs.PREPROCESS_FILE_EXTENSION,await preprocessOneSource.call(this,has_variables,preprocess_destination_file,dir)}var has_variables=use_preprocessor?preprocess_destination_file:manifest_entry.source,dir=manifest_entry.destination,compile_destination_file=dir+yabs.COMPILE_FILE_EXTENSION,compiler_params=manifest_entry.compile_options,has_variables=(await compileOneSource.call(this,has_variables,compile_destination_file,compiler_params),manifest_entry.header_data),compiler_params=fs.readFileSync(compile_destination_file,{encoding:"utf8",flag:"r"}),has_variables=has_variables.has_header?has_variables.header.join(EOL)+EOL+compiler_params:compiler_params;fs.writeFileSync(dir,has_variables,{encoding:"utf8",flag:"w"}),fs.rmSync(compile_destination_file,{force:!0}),use_preprocessor&&fs.rmSync(preprocess_destination_file,{force:!0}),this._logger.ok(),this._n_files_updated+=1}this._logger.endl()}_buildStep_III_WriteHTMLFiles(){const script_src_regex=/<script\b[^>]*\bsrc=(["'])(.*?)(\1).*?>/;this._html_manifest.forEach(manifest_entry=>{this._logger.out_raw(manifest_entry.destination+" ...");var dir=path.dirname(manifest_entry.destination);yabs.util.exists(dir)||fs.mkdirSync(dir,{recursive:!0});dir=fs.readFileSync(manifest_entry.source,{encoding:"utf8",flag:"r"}).split(/\r?\n/);let html_file_output_lines=[];dir.forEach(line_str=>{var src_regex_match=line_str.match(script_src_regex);let substitute_line=!1,substitute_line_str;if(src_regex_match){src_regex_match=src_regex_match[2];const src_parsed=path.parse(src_regex_match),src_joined=path.join(this._source_dir,src_parsed.dir,src_parsed.base);let matches_sources_manifest=!1,destination_src;this._sources_manifest.every(sources_manifest_entry=>{return sources_manifest_entry.original_source!==src_joined||(matches_sources_manifest=!0,sources_manifest_entry=path.parse(sources_manifest_entry.destination),destination_src=src_parsed.dir+"/"+sources_manifest_entry.base,!1)}),matches_sources_manifest&&(substitute_line=!0,substitute_line_str=line_str.replace(src_regex_match,destination_src))}html_file_output_lines.push(substitute_line?substitute_line_str:line_str)});dir=html_file_output_lines.join(EOL);fs.writeFileSync(manifest_entry.destination,dir,{encoding:"utf8",flag:"w"}),this._logger.ok(),this._n_files_updated+=1}),this._logger.endl()}async build(){var build_instr_dir=this._build_config.getBaseDir(),build_instr_file=this._build_config.getSourceFile(),build_instr_dir=path.join(build_instr_dir,build_instr_file),build_instr_file=(this._logger.info("Starting build: "+build_instr_dir),this._logger.info("Preparing build ..."),this._buildManifests(),this._verifySourceFiles(),this._processSourceHeaders(),0<this._files_manifest.length&&(this._logger.info("Updating files ..."),this._buildStep_I_UpdateFiles()),0<this._sources_manifest.length&&(this._logger.info("Compiling sources ..."),await this._buildStep_II_CompileSources()),0<this._html_manifest.length&&(this._logger.info("Writing HTML files ..."),this._buildStep_III_WriteHTMLFiles()),((Date.now()-this._build_start_time)/1e3).toFixed(2));this._logger.success("Build finished!\n"),this._logger.out(`Updated ${this._n_files_updated} files.`),this._logger.out(`Build completed in ${build_instr_file}s.`)}},yabs.BatchBuilder=class{constructor(logger,build_config,build_params){this._logger=logger,this._build_config=build_config,this._build_params=build_params,this._base_dir=this._build_config.getBaseDir(),this._batch_manifest=null,this._batch_build_start_time=Date.now()}_buildBatchManifest(){var batch_listing=this._build_config.getBatchListing();this._batch_manifest=[],batch_listing.forEach(listing_entry=>{var build_instr_path=listing_entry.target;if(build_instr_path.length){let options;listing_entry.options?(options=[],listing_entry.options.trim().split(/\s+/).forEach(options_item=>{2<=options_item.length&&"-"===options_item[0]&&options.push(options_item.substring(1))})):options=this._build_params.variable;listing_entry=path.join(this._base_dir,build_instr_path);this._batch_manifest.push({build_target:listing_entry,options:options})}})}async _buildOne(build_index){build_index=this._batch_manifest[build_index];let build_config=null;var build_param_input=build_index.build_target;if(!yabs.util.exists(build_param_input))throw"Cannot find path or file: "+build_param_input;if(yabs.util.isDirectory(build_param_input)?yabs.util.exists(path.join(build_param_input,yabs.DEFAULT_BUILD_FILE))?build_config=new yabs.BuildConfig(path.join(build_param_input,yabs.DEFAULT_BUILD_FILE)):yabs.util.exists(path.join(build_param_input,yabs.DEFAULT_BUILD_ALL_FILE))&&(build_config=new yabs.BuildConfig(path.join(build_param_input,yabs.DEFAULT_BUILD_ALL_FILE))):build_config=new yabs.BuildConfig(build_param_input),build_config.isBatchBuild())throw"Cannot have nested batch builds: ${build_instr_file}!";build_param_input={variable:build_index.options};await new yabs.Builder(this._logger,build_config,build_param_input).build()}async build(){var nofail_flag=this._build_params.option.includes("nofail"),build_instr_dir=this._build_config.getBaseDir(),build_instr_file=this._build_config.getSourceFile(),build_instr_dir=path.join(build_instr_dir,build_instr_file);this._logger.info(`Starting ${this._logger._OUTPUT_BRIGHT}${this._logger._OUTPUT_FG_GREEN}<batch build>`+this._logger._OUTPUT_RESET+": "+build_instr_dir),this._buildBatchManifest();let build_index=0;var n_builds=this._batch_manifest.length;let n_successful_builds=0,n_failed_builds=0;for(;build_index<n_builds;){this._logger.out(`=== ${this._logger._OUTPUT_BRIGHT}${this._logger._OUTPUT_FG_GREEN}<batch build>`+`${this._logger._OUTPUT_RESET} ${build_index+1}/${n_builds} ===\n`);try{await this._buildOne(build_index++),n_successful_builds++}catch(e){if(!nofail_flag)throw e;this._logger.error(e),n_failed_builds++}this._logger.endl()}build_instr_file=((Date.now()-this._batch_build_start_time)/1e3).toFixed(2);this._logger.out(`=== ${this._logger._OUTPUT_BRIGHT}${this._logger._OUTPUT_FG_GREEN}<batch build>`+this._logger._OUTPUT_RESET+` finished! ===
`),nofail_flag?this._logger.out(`${n_successful_builds} builds finished, ${n_failed_builds} failed in ${build_instr_file}s.`):this._logger.out(n_successful_builds+` builds finished in ${build_instr_file}s.`)}},yabs.Application=class{constructor(){this._logger=new yabs.Logger}async main(argv){const build_params={option:[],variable:[],free:[]};if(argv.slice(2).forEach(str_value=>{str_value.startsWith("--")?build_params.option.push(str_value.slice(2)):str_value.startsWith("-")?build_params.variable.push(str_value.slice(1)):build_params.free.push(str_value)}),0===build_params.free.length&&0<build_params.option.length){if(build_params.option.includes("version"))return void this._logger.header();if(build_params.option.includes("help"))return void yabs.util.openURLWithBrowser("https://github.com/pulzed/YABS.js")}this._logger.header(),this._logger.out("---------------------------------------------"),this._logger.endl();try{this._logger.info("Configuring build ...");let build_config=null;if(0===build_params.free.length)yabs.util.exists(yabs.DEFAULT_BUILD_ALL_FILE)?build_config=new yabs.BuildConfig(yabs.DEFAULT_BUILD_ALL_FILE):yabs.util.exists(yabs.DEFAULT_BUILD_FILE)&&(build_config=new yabs.BuildConfig(yabs.DEFAULT_BUILD_FILE));else{var build_param_input=path.normalize(build_params.free[0]);if(!yabs.util.exists(build_param_input))throw"Cannot find path or file: "+build_param_input;yabs.util.isDirectory(build_param_input)?yabs.util.exists(path.join(build_param_input,yabs.DEFAULT_BUILD_FILE))?build_config=new yabs.BuildConfig(path.join(build_param_input,yabs.DEFAULT_BUILD_FILE)):yabs.util.exists(path.join(build_param_input,yabs.DEFAULT_BUILD_ALL_FILE))&&(build_config=new yabs.BuildConfig(path.join(build_param_input,yabs.DEFAULT_BUILD_ALL_FILE))):build_config=new yabs.BuildConfig(build_param_input)}if(!build_config)throw"Missing input file!";if(build_config.isBatchBuild())await new yabs.BatchBuilder(this._logger,build_config,build_params).build();else{const builder=new yabs.Builder(this._logger,build_config,build_params);await builder.build()}}catch(e){this._logger.error(e),this._logger.out("\nBuild aborted.")}this._logger.endl()}},(new yabs.Application).main(process.argv);