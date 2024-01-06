/*   __ __ _____ _____ _____     _
 *  |  |  |  _  |  _  |   __|   |_|___
 *   \_   |     |  _ -|__   |_  | |_ -|
 *    /__/|__|__|_____|_____|_|_| |___|
 *                            |___|
 *  v1.2.0 dev
 *  https://github.com/metayeti/YABS.js
 *  (c) 2024 Danijel Durakovic
 *  Licensed under MIT
 */
const path=require("path"),fs=require("fs"),{fork,exec}=require("child_process"),yabs={VERSION:"1.2.0dev",DEFAULT_BUILD_ALL_FILE:"build_all.json",DEFAULT_BUILD_FILE:"build.json",DEFAULT_COMPILE_OPTIONS:"--compress --mangle",NEWLINE_SYMBOL:"\n",GLUE_FILE_EXTENSION:".glw",PREPROCESS_FILE_EXTENSION:".pre",COMPILE_FILE_EXTENSION:".cmp",COMPILED_SOURCE_EXTENSION:".min.js",URL_YABS_MANUAL:"https://github.com/metayeti/YABS.js/blob/main/HOWTO.md",util:{}};yabs.util.exists=function(source_path){return fs.existsSync(source_path)},yabs.util.isDirectory=function(source_path){return fs.lstatSync(source_path).isDirectory()},yabs.util.getModifiedTime=function(source_path){return fs.statSync(source_path).mtime},yabs.util.isSourceNewer=function(source_path,destination_path){source_path=Date.now()-yabs.util.getModifiedTime(source_path);return 1e3<=Date.now()-yabs.util.getModifiedTime(destination_path)-source_path},yabs.util.getFilesWithRecursiveDescent=function(source_dir,destination_dir,mask,depth=0){let list=[];if(yabs.util.exists(source_dir))return fs.readdirSync(source_dir).forEach(listing_entry=>{var nested_source_path=path.join(source_dir,listing_entry),listing_entry=path.join(destination_dir,listing_entry);if(yabs.util.isDirectory(nested_source_path))"*"===mask[0]&&null===mask[1]&&(list=list.concat(yabs.util.getFilesWithRecursiveDescent(nested_source_path,listing_entry,mask,depth+1)));else{if("*"===mask[0]&&"*"!==mask[1]&&null!==mask[1]){var parsed_nested_source_path=path.parse(nested_source_path);if(mask[1]!==parsed_nested_source_path.ext)return}yabs.util.exists(listing_entry)&&!yabs.util.isSourceNewer(nested_source_path,listing_entry)||list.push({source:nested_source_path,destination:listing_entry})}}),list;throw"Could not locate path: "+source_dir},yabs.util.parseJSDocTagsFromFile=function(source_file,output){const tag_regex=/\*\s*@(\w+)\s+(.+)/g;source_file=fs.readFileSync(source_file,{encoding:"utf8",flag:"r"}).match(/\/\*\*(.*?)\*\//gs);source_file&&source_file.forEach(regex_match=>{for(;null!==(tag_match=tag_regex.exec(regex_match));){var tag_key=tag_match[1],tag_match=tag_match[2];output[tag_key]=tag_match}})},yabs.util.openURLWithBrowser=function(url){var start_cmd=function(){switch(process.platform){case"darwin":return"open";case"win32":return"start";default:return"xdg-open"}}();exec(start_cmd+" "+url)},yabs.util.runUserScript=async function(path,params){return new Promise((resolve,reject)=>{var proc=fork(path,params);proc.on("error",err=>{process.stdout.write("\n"),reject(err)}),proc.on("exit",()=>{resolve()}),proc.on("message",msg=>{resolve(msg)})})},yabs.Logger=class{constructor(){var is_tty=process.stdout.isTTY;this._OUTPUT_RESET=is_tty?"[0m":"",this._OUTPUT_BRIGHT=is_tty?"[1m":"",this._OUTPUT_FG_RED=is_tty?"[31m":"",this._OUTPUT_FG_GREEN=is_tty?"[32m":"",this._OUTPUT_FG_YELLOW=is_tty?"[33m":""}out(message){process.stdout.write(message+`
`)}out_raw(message){process.stdout.write(message)}ok(){process.stdout.write(" "+this._OUTPUT_BRIGHT+this._OUTPUT_FG_GREEN+`ok${this._OUTPUT_RESET}
`)}info(message){process.stdout.write(""+this._OUTPUT_BRIGHT+this._OUTPUT_FG_YELLOW+">"+this._OUTPUT_RESET+` ${message}

`)}endl(){process.stdout.write("\n")}error(message){process.stdout.write(""+this._OUTPUT_BRIGHT+this._OUTPUT_FG_RED+"Error: "+this._OUTPUT_RESET+message+`
`)}success(message){process.stdout.write(""+this._OUTPUT_BRIGHT+this._OUTPUT_FG_GREEN+"Success: "+this._OUTPUT_RESET+message+`
`)}header(){this.out_raw(""+this._OUTPUT_BRIGHT+this._OUTPUT_FG_YELLOW),this.out("  __ __ _____ _____ _____     _"),this.out(" |  |  |  _  |  _  |   __|   |_|___"),this.out("  \\_   |     |  _ -|__   |_  | |_ -|"),this.out("   /__/|__|__|_____|_____|_|_| |___|"),this.out("                           |___|"+this._OUTPUT_RESET+" ".repeat(13-yabs.VERSION.length)+"v"+yabs.VERSION),this.out(` ${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_YELLOW}Y${this._OUTPUT_RESET}et`),this.out(` ${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_YELLOW}A${this._OUTPUT_RESET}nother`+"   https://github.com/metayeti/YABS.js"),this.out(` ${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_YELLOW}B${this._OUTPUT_RESET}uild`+`     ${this._OUTPUT_RESET}         (c) 2024 Danijel Durakovic`),this.out(` ${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_YELLOW}S${this._OUTPUT_RESET}ystem${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_YELLOW} .js`+this._OUTPUT_RESET+"                        MIT licence"),this.endl()}line(){this.out("----------------------------------------------")}},yabs.BuildConfig=class{constructor(source_file){var parsed_source_file=path.parse(source_file),parsed_source_file=(this._source_file=parsed_source_file.base,this._base_dir=parsed_source_file.dir,fs.readFileSync(source_file,{encoding:"utf8",flag:"r"}));const json_data=JSON.parse(parsed_source_file);if(json_data.hasOwnProperty("batch_build")){if(this._is_batch=!0,this._batch_listing=[],json_data.batch_build instanceof Array)return void json_data.batch_build.forEach(batch_entry=>{var batch_entry_object;"string"==typeof batch_entry?this._batch_listing.push({target:batch_entry}):"object"==typeof batch_entry&&null!==batch_entry&&(batch_entry_object={},batch_entry.hasOwnProperty("target")&&"string"==typeof batch_entry.target&&(batch_entry_object.target=batch_entry.target),batch_entry.hasOwnProperty("options")&&"string"==typeof batch_entry.options&&(batch_entry_object.options=batch_entry.options),batch_entry_object.target)&&this._batch_listing.push(batch_entry_object)});throw'The "batch_build" entry has to be an Array type!'}if(!json_data.hasOwnProperty("source_dir"))throw'Missing "source_dir" entry!';if(this._source_dir=json_data.source_dir,!json_data.hasOwnProperty("destination_dir"))throw'Missing "destination_dir" entry!';if(this._destination_dir=json_data.destination_dir,json_data.hasOwnProperty("html"))if(json_data.html instanceof Array){if(!json_data.html.every(element=>"string"==typeof element))throw'Every element in "html" entry has to be a String type!';this._html_listing=json_data.html}else"string"==typeof json_data.html&&(this._html_listing=[json_data.html]);if(this._html_listing||(this._html_listing=[]),json_data.hasOwnProperty("sources")){if(!(json_data.sources instanceof Array))throw'The "sources" entry has to be an Array type!';this._sources_listing=[],json_data.sources.forEach(source_entry=>{if("string"==typeof source_entry)this._sources_listing.push({file:source_entry});else if("object"==typeof source_entry&&null!==source_entry){var source_entry_object={};if(source_entry.hasOwnProperty("output_file")&&"string"==typeof source_entry.output_file&&(source_entry_object.output_file=source_entry.output_file),source_entry.hasOwnProperty("compile_options")&&"string"==typeof source_entry.compile_options&&(source_entry_object.compile_options=source_entry.compile_options),source_entry.hasOwnProperty("bundle")){if(void 0===source_entry_object.output_file)throw'Bundled scripts require an "output_file" entry!';if(!(source_entry.bundle instanceof Array))throw'The "bundle" entry has to be an Array type!';if(!source_entry.bundle.every(element=>"string"==typeof element))throw'Every element in "bundle" entry has to be a String type!';source_entry_object.is_bundle=!0,source_entry_object.bundle_files=source_entry.bundle}else source_entry.hasOwnProperty("file")&&"string"==typeof source_entry.file&&(source_entry_object.file=source_entry.file);if(source_entry.hasOwnProperty("header"))if(source_entry.header instanceof Array){if(!source_entry.header.every(element=>"string"==typeof element))throw'Every item of "header" entry listing has to be a String type!';source_entry_object.header=source_entry.header}else"string"==typeof source_entry.header&&(source_entry_object.header=[source_entry.header]);else if(source_entry.hasOwnProperty("use_header")&&json_data.headers&&"string"==typeof source_entry.use_header&&json_data.headers.hasOwnProperty(source_entry.use_header)){var header_ref=json_data.headers[source_entry.use_header];if(header_ref instanceof Array){if(!header_ref.every(element=>"string"==typeof element))throw'Every item in "headers" entry listing has to be a String type!';source_entry_object.header=header_ref}else"string"==typeof header_ref&&(source_entry_object.header=[header_ref])}if(source_entry.hasOwnProperty("variables")){if("object"==typeof source_entry.variables&&!(source_entry.variables instanceof Array)&&null!==source_entry.variables){source_entry_object.variables={};for(const variable_key in source_entry.variables){var variable_data=source_entry.variables[variable_key];if(variable_data instanceof Array){if(!variable_data.every(element=>"string"==typeof element))throw'Every item in "variables" entry listing has to be a String type!';source_entry_object.variables[variable_key]=variable_data}}}}else if(source_entry.hasOwnProperty("use_variables")&&json_data.variables&&"string"==typeof source_entry.use_variables&&json_data.variables.hasOwnProperty(source_entry.use_variables)){var variables_ref=json_data.variables[source_entry.use_variables];if("object"==typeof variables_ref&&!(variables_ref instanceof Array)&&null!==variables_ref){source_entry_object.variables={};for(const variable_key in variables_ref){const variable_data=variables_ref[variable_key];if(variable_data instanceof Array){if(!variable_data.every(element=>"string"==typeof element))throw'Every item in "variables" entry listing has to be a String type!';source_entry_object.variables[variable_key]=variable_data}}}}source_entry.hasOwnProperty("preprocess")&&!0===source_entry.preprocess&&(source_entry_object.preprocess=!0),(source_entry_object.file||source_entry_object.is_bundle)&&this._sources_listing.push(source_entry_object)}})}if(this._sources_listing||(this._sources_listing=[]),json_data.hasOwnProperty("files"))if(json_data.files instanceof Array){if(!json_data.files.every(element=>"string"==typeof element))throw'Every element in "files" entry has to be a String type!';this._files_listing=json_data.files}else"string"==typeof json_data.files&&(this._files_listing=[json_data.files]);if(this._files_listing||(this._files_listing=[]),json_data.hasOwnProperty("events")){this._events_listing={prebuild:[],postbuild:[]};source_file=json_data.events;if("object"==typeof source_file&&null!==source_file){parsed_source_file=source_file.prebuild,source_file=source_file.postbuild;if(parsed_source_file instanceof Array){if(!parsed_source_file.every(element=>"string"==typeof element))throw'Every element in "prebuild" entry has to be a String type!';this._events_listing.prebuild=parsed_source_file}if(source_file instanceof Array){if(!source_file.every(element=>"string"==typeof element))throw'Every element in "postbuild" entry has to be a String type!';this._events_listing.postbuild=source_file}}}else this._events_listing=null}getSourceFile(){return this._source_file}getBaseDir(){return this._base_dir}isBatchBuild(){return this._is_batch}getBatchListing(){return this._batch_listing}getSourceDir(){return this._source_dir}getDestinationDir(){return this._destination_dir}getHTMLListing(){return this._html_listing}getSourcesListing(){return this._sources_listing}getFilesListing(){return this._files_listing}getEventsListing(){return this._events_listing}},yabs.Builder=class{constructor(logger,build_config,build_params){this._logger=logger,this._build_config=build_config,this._build_params=build_params,this._base_dir=this._build_config.getBaseDir(),this._source_dir=path.normalize(this._build_config.getSourceDir()),this._destination_dir=path.normalize(this._build_config.getDestinationDir()),this._files_manifest=null,this._sources_manifest=null,this._html_manifest=null,this._n_files_updated=0,this._build_start_time=Date.now()}_buildManifests(){this._files_manifest=[],this._sources_manifest=[],this._html_manifest=[],function(){this._build_config.getFilesListing().forEach(listing_entry=>{if(listing_entry.includes("*")){var full_source_path=path.join(this._base_dir,this._source_dir,listing_entry),full_source_path=path.parse(full_source_path),full_destination_path=path.join(this._destination_dir,listing_entry),full_destination_path=path.parse(full_destination_path);if(!full_source_path.dir.includes("*")&&"*"===full_source_path.name){var split_base=full_source_path.base.split(".");let mask=null;"*"===full_source_path.base?mask=["*",null]:"*.*"===full_source_path.base?mask=["*","*"]:"*"===split_base[0]&&"*"!==split_base[1]&&""!==split_base[1]&&(mask=["*",full_source_path.ext]),null!==mask&&(this._files_manifest=this._files_manifest.concat(yabs.util.getFilesWithRecursiveDescent(full_source_path.dir,full_destination_path.dir,mask)))}}else{split_base=path.join(this._base_dir,this._source_dir,listing_entry),full_source_path=path.join(this._destination_dir,listing_entry);if(!yabs.util.isDirectory(split_base)){let include_plain_file=!1;if(include_plain_file=!yabs.util.exists(full_source_path)||yabs.util.isSourceNewer(split_base,full_source_path)?!0:include_plain_file){if(split_base===full_source_path)throw`Source file: "${split_base}" cannot be the same as the destination!`;this._files_manifest.push({source:split_base,destination:full_source_path})}}}})}.call(this),function(){this._build_config.getSourcesListing().forEach(listing_entry=>{let sources_list=[];if((sources_list=listing_entry.is_bundle?listing_entry.bundle_files:[listing_entry.file]).some(element=>element.includes("*")))throw"Sources may not have masks!";const source_full_path_list=[];sources_list.forEach(source_path=>{source_path=path.join(this._base_dir,this._source_dir,source_path);source_full_path_list.push(source_path)});let output_filename,has_output_file_field;has_output_file_field=listing_entry.output_file?(output_filename=path.normalize(listing_entry.output_file),!0):(parsed_file_entry=path.parse(sources_list[0]),output_filename=path.join(parsed_file_entry.dir,parsed_file_entry.name+yabs.COMPILED_SOURCE_EXTENSION),!1);var parsed_file_entry=path.join(this._destination_dir,output_filename),has_header=listing_entry.hasOwnProperty("header"),header_data={has_header:has_header},has_header=(has_header&&(header_data.header=[...listing_entry.header]),listing_entry.hasOwnProperty("variables")),variables_data={has_variables:has_header},has_header=(has_header&&(variables_data.variables=listing_entry.variables),listing_entry.hasOwnProperty("compile_options")?listing_entry.compile_options:yabs.DEFAULT_COMPILE_OPTIONS),listing_entry=!0===listing_entry.preprocess;this._sources_manifest.push({sources:source_full_path_list,destination:parsed_file_entry,output_filename:output_filename,has_output_file_field:has_output_file_field,compile_options:has_header,header_data:header_data,variables_data:variables_data,force_preprocessor:listing_entry})})}.call(this),function(){this._build_config.getHTMLListing().forEach(listing_entry=>{if(!listing_entry.includes("*")){var html_file_source=path.join(this._base_dir,this._source_dir,listing_entry),listing_entry=path.join(this._destination_dir,listing_entry);if(html_file_source===listing_entry)throw`Source file: "${html_file_source}" cannot be the same as the destination!`;this._html_manifest.push({source:html_file_source,destination:listing_entry})}})}.call(this)}_verifySourceFiles(){function verifyManifest(manifest_list){function verifyOne(path_source){var path_resolved=path.resolve(path_source);if(!yabs.util.exists(path_resolved))throw"Could not find file: "+path_source}manifest_list.forEach(manifest_entry=>{manifest_entry.sources instanceof Array?manifest_entry.sources.forEach(verifyOne):"string"==typeof manifest_entry.source&&verifyOne(manifest_entry.source)})}verifyManifest.call(this,this._files_manifest),verifyManifest.call(this,this._sources_manifest),verifyManifest.call(this,this._html_manifest)}_processSourceHeaders(){this._sources_manifest.forEach(manifest_entry=>{var header_data=manifest_entry.header_data;if(header_data.has_header){let has_variables=!1;if(header_data.header.every(header_str=>!/%\S+%/.test(header_str)&&!/\$YEAR\$/.test(header_str)||!(has_variables=!0)),has_variables){const parsed_variables={};manifest_entry.sources.forEach(source_file=>{yabs.util.parseJSDocTagsFromFile(source_file,parsed_variables)});for(let i=0;i<header_data.header.length;++i){for(var variable_key in parsed_variables){var variable_value=parsed_variables[variable_key];Object.prototype.hasOwnProperty.call(parsed_variables,variable_key)&&(header_data.header[i]=header_data.header[i].replace(new RegExp(`%${variable_key}%`,"g"),variable_value))}header_data.header[i]=header_data.header[i].replace(/\$YEAR\$/g,(new Date).getFullYear())}}}})}_buildStep_I_UpdateFiles(){this._files_manifest.forEach(manifest_entry=>{this._logger.out_raw(manifest_entry.destination+" ...");var dir=path.dirname(manifest_entry.destination);yabs.util.exists(dir)||fs.mkdirSync(dir,{recursive:!0}),fs.copyFileSync(manifest_entry.source,manifest_entry.destination),this._logger.ok(),this._n_files_updated+=1}),this._logger.endl()}async _buildStep_II_CompileSources(){function substep_I_glue(sources,destination){return sources.forEach((source_file,index)=>{let source_file_data=fs.readFileSync(source_file,{encoding:"utf8",flag:"r"});source_file_data=source_file_data.replace(/\r/gm,""),0===index?fs.writeFileSync(destination,source_file_data,{encoding:"utf8",flag:"w"}):fs.appendFileSync(destination,"\n"+source_file_data,{encoding:"utf8",flag:"a"})}),destination}async function substep_II_preprocess(source,destination,preprocessor_params){return await function(input_file,output_file,params){return new Promise((resolve,reject)=>{exec(`metascript ${input_file} ${params} > `+output_file,err=>{err?(this._logger.out_raw("\n\n"),reject(err)):resolve()})})}.call(this,source,destination,preprocessor_params),destination}async function substep_III_compile(source,destination,compiler_params){return await function(input_file,output_file,params){return new Promise((resolve,reject)=>{exec(`uglifyjs ${input_file} ${params} -o `+output_file,err=>{err?(this._logger.out_raw("\n\n"),reject(err)):resolve()})})}.call(this,source,destination,compiler_params),destination}function substep_IV_finalize(source,destination,header_data){source=fs.readFileSync(source,{encoding:"utf8",flag:"r"}),header_data=header_data.has_header?header_data.header.join(yabs.NEWLINE_SYMBOL)+yabs.NEWLINE_SYMBOL+source:source;return fs.writeFileSync(destination,header_data,{encoding:"utf8",flag:"w"}),destination}for(const manifest_entry of this._sources_manifest){this._logger.out_raw(manifest_entry.destination+" ...");var dir=path.dirname(manifest_entry.destination);yabs.util.exists(dir)||fs.mkdirSync(dir,{recursive:!0});let use_preprocessor=!1;var variable_params=this._build_params.variables,dir=manifest_entry.variables_data,has_variables=dir.has_variables;const variables_listing=dir.variables;if(manifest_entry.force_preprocessor)use_preprocessor=!0;else if(has_variables)for(let i=0;i<variable_params.length;++i)if(variables_listing.hasOwnProperty(variable_params[i])){use_preprocessor=!0;break}let preprocessor_params="";if(use_preprocessor&&has_variables){const preprocessor_params_list=[];variable_params.forEach(variable_param=>{variables_listing.hasOwnProperty(variable_param)&&variables_listing[variable_param].forEach(variable_entry=>{var variable_entry=variable_entry.split("="),variable_key=variable_entry[0].trim(),variable_entry=variable_entry[1].trim();variable_key.length&&variable_entry.length&&preprocessor_params_list.push(`-${variable_key}=`+variable_entry)})}),preprocessor_params=preprocessor_params_list.join(" ")}let next_source,temp_files=[];manifest_entry.sources.length<=1?next_source=manifest_entry.sources[0]:temp_files.push(next_source=substep_I_glue.call(this,manifest_entry.sources,manifest_entry.destination+yabs.GLUE_FILE_EXTENSION)),use_preprocessor&&temp_files.push(next_source=await substep_II_preprocess.call(this,next_source,manifest_entry.destination+yabs.PREPROCESS_FILE_EXTENSION,preprocessor_params)),temp_files.push(next_source=await substep_III_compile.call(this,next_source,manifest_entry.destination+yabs.COMPILE_FILE_EXTENSION,manifest_entry.compile_options)),substep_IV_finalize.call(this,next_source,manifest_entry.destination,manifest_entry.header_data),temp_files.forEach(file_to_remove=>{fs.rmSync(file_to_remove,{force:!0})}),this._logger.ok(),this._n_files_updated+=1}this._logger.endl()}_buildStep_III_WriteHTMLFiles(){const script_src_regex=/<script\b[^>]*\bsrc=(["'])(.*?)(\1).*?>/,html_comment_with_script_regex=/\s*<\!--(?:(?!-->)[\S\s])*?<script[\s\S]*?-->\n?/g;this._html_manifest.forEach(manifest_entry=>{this._logger.out_raw(manifest_entry.destination+" ...");var dir=path.dirname(manifest_entry.destination);yabs.util.exists(dir)||fs.mkdirSync(dir,{recursive:!0});dir=fs.readFileSync(manifest_entry.source,{encoding:"utf8",flag:"r"}).replace(html_comment_with_script_regex,"").split(/\r?\n/);const html_base_dir=path.parse(manifest_entry.source).dir,html_output_lines=[],destinations_used=[];dir.forEach(line_string=>{var src_regex_match=line_string.match(script_src_regex);let skip_current_line=!1,substitute_current_line=!1,substitution_string="";if(src_regex_match){var src_regex_match=src_regex_match[2],extracted_src_params_index=src_regex_match.indexOf("?");const extracted_stripped_src=extracted_src_params_index<0?src_regex_match:src_regex_match.slice(0,extracted_src_params_index),src_parsed=path.parse(extracted_stripped_src),src_joined_full=path.join(html_base_dir,src_parsed.dir,src_parsed.base);this._sources_manifest.every(sources_manifest_entry=>{let keep_going=!0;return sources_manifest_entry.sources.every(source_entry=>{if(source_entry===src_joined_full){if(destinations_used.includes(sources_manifest_entry.destination))skip_current_line=!0;else{substitute_current_line=!0;var html_full_dir,source_entry=path.parse(sources_manifest_entry.destination);let substitute_path;var output_file_full=(substitute_path=sources_manifest_entry.has_output_file_field?(html_full_dir=path.parse(manifest_entry.destination).dir,output_file_full=path.join(this._destination_dir,sources_manifest_entry.output_filename),html_full_dir=path.parse(path.relative(html_full_dir,output_file_full)).dir,path.join(html_full_dir,source_entry.base)):path.join(src_parsed.dir,source_entry.base)).replace(/\\/g,"/");substitution_string=line_string.replace(new RegExp(extracted_stripped_src,"g"),output_file_full),destinations_used.push(sources_manifest_entry.destination)}keep_going=!1}return keep_going}),keep_going})}skip_current_line||html_output_lines.push(substitute_current_line?substitution_string:line_string)});dir=html_output_lines.join(yabs.NEWLINE_SYMBOL);fs.writeFileSync(manifest_entry.destination,dir,{encoding:"utf8",flag:"w"}),this._logger.ok(),this._n_files_updated+=1}),this._logger.endl()}async runEvents(listing){var build_instr_dir=path.normalize(this._build_config.getBaseDir()),build_dest_dir=path.normalize(this._build_config.getDestinationDir());for(let i=0;i<listing.length;++i){var event_split=listing[i].split(" "),script_path=event_split.shift(),script_path=(event_split.unshift(build_dest_dir),event_split.unshift(build_instr_dir),path.join(build_instr_dir,script_path));this._logger.out(""+this._logger._OUTPUT_BRIGHT+this._logger._OUTPUT_FG_RED+"["+this._logger._OUTPUT_FG_YELLOW+"--\x3e"+this._logger._OUTPUT_RESET+" Executing: "+script_path),this._logger.endl(),await yabs.util.runUserScript(script_path,event_split),this._logger.endl(),this._logger.out(""+this._logger._OUTPUT_BRIGHT+this._logger._OUTPUT_FG_YELLOW+"<--"+this._logger._OUTPUT_FG_RED+"]"+this._logger._OUTPUT_RESET)}}async build(){var build_instr_dir=this._build_config.getBaseDir(),build_instr_file=this._build_config.getSourceFile(),build_instr_dir=path.join(build_instr_dir,build_instr_file),build_instr_file=this._build_config.getEventsListing(),build_instr_dir=(this._logger.info("Starting build: "+build_instr_dir),this._logger.info("Preparing build"),this._buildManifests(),this._verifySourceFiles(),this._processSourceHeaders(),build_instr_file&&0<build_instr_file.prebuild.length&&(this._logger.info("Running pre-build events"),await this.runEvents(build_instr_file.prebuild),this._logger.endl()),0<this._files_manifest.length&&(this._logger.info("Updating files"),this._buildStep_I_UpdateFiles()),0<this._sources_manifest.length&&(this._logger.info("Compiling sources"),await this._buildStep_II_CompileSources()),0<this._html_manifest.length&&(this._logger.info("Writing HTML files"),this._buildStep_III_WriteHTMLFiles()),build_instr_file&&0<build_instr_file.postbuild.length&&(this._logger.info("Running post-build events"),await this.runEvents(build_instr_file.postbuild),this._logger.endl()),((Date.now()-this._build_start_time)/1e3).toFixed(2));this._logger.success("Build finished!\n"),this._logger.out(`Updated ${this._n_files_updated} files.`),this._logger.out(`Build completed in ${build_instr_dir}s.`)}},yabs.BatchBuilder=class{constructor(logger,build_config,build_params){this._logger=logger,this._build_config=build_config,this._build_params=build_params,this._base_dir=this._build_config.getBaseDir(),this._batch_manifest=[],this._nofail_flag=this._build_params.options.includes("nofail"),this._batch_build_start_time=Date.now()}_buildBatchManifest(batch_listing,root_dir=""){batch_listing.forEach(listing_entry=>{var build_instr_path=listing_entry.target;if(build_instr_path.length){let build_options;listing_entry.options?(build_options=[],listing_entry.options.trim().split(/\s+/).forEach(options_item=>{2<=options_item.length&&"-"===options_item[0]&&build_options.push(options_item.substring(1))})):build_options=this._build_params.variables;const build_target=path.join(this._base_dir,root_dir,build_instr_path);if(!this._batch_manifest.some(e=>e.build_target===build_target)){let build_config=null;if(!yabs.util.exists(build_target)){listing_entry="Cannot find path or file: "+build_target;if(this._nofail_flag)return void this._logger.error(listing_entry+"\n");throw listing_entry}if(yabs.util.isDirectory(build_target)){var listing_entry=path.join(build_target,yabs.DEFAULT_BUILD_FILE),path_buildall_json=path.join(build_target,yabs.DEFAULT_BUILD_ALL_FILE);if(yabs.util.exists(listing_entry))build_config=new yabs.BuildConfig(listing_entry);else{if(!yabs.util.exists(path_buildall_json))throw`Cannot locate ${listing_entry} or `+path_buildall_json;build_config=new yabs.BuildConfig(path_buildall_json)}}else build_config=new yabs.BuildConfig(build_target);build_config.isBatchBuild()?this._buildBatchManifest(build_config.getBatchListing(),build_instr_path):this._batch_manifest.push({build_target:build_target,options:build_options,config:build_config})}}})}async _buildOne(build_index){var build_index=this._batch_manifest[build_index],build_config=build_index.config;build_config.isBatchBuild()||(build_index={variables:build_index.options},await new yabs.Builder(this._logger,build_config,build_index).build())}async build(){var nofail_flag=this._nofail_flag,build_instr_dir=this._build_config.getBaseDir(),build_instr_file=this._build_config.getSourceFile(),build_instr_dir=path.join(build_instr_dir,build_instr_file);this._logger.info(`Starting ${this._logger._OUTPUT_BRIGHT}${this._logger._OUTPUT_FG_GREEN}<batch build>`+this._logger._OUTPUT_RESET+" : "+build_instr_dir),this._buildBatchManifest(this._build_config.getBatchListing());let build_index=0;var n_builds=this._batch_manifest.length;let n_successful_builds=0,n_failed_builds=0;for(;build_index<n_builds;){this._logger.out(`=== ${this._logger._OUTPUT_BRIGHT}${this._logger._OUTPUT_FG_GREEN}<batch build>`+`${this._logger._OUTPUT_RESET} ${build_index+1}/`+n_builds+` : ${this._batch_manifest[build_index].build_target} ===
`);try{await this._buildOne(build_index++),n_successful_builds+=1}catch(e){if(!nofail_flag)throw e;this._logger.error(e),this._logger.out("\nBuild aborted."),n_failed_builds+=1}this._logger.endl()}build_instr_file=((Date.now()-this._batch_build_start_time)/1e3).toFixed(2);this._logger.out(`=== ${this._logger._OUTPUT_BRIGHT}${this._logger._OUTPUT_FG_GREEN}<batch build>`+this._logger._OUTPUT_RESET+` finished! ===
`),nofail_flag?this._logger.out(`${n_successful_builds} builds finished, ${n_failed_builds} failed in ${build_instr_file}s.`):this._logger.out(n_successful_builds+` builds finished in ${build_instr_file}s.`)}},yabs.Application=class{constructor(){this._logger=new yabs.Logger}async main(argv){const build_params={options:[],variables:[],free:[]};if(argv.slice(2).forEach(str_value=>{str_value.startsWith("--")?build_params.options.push(str_value.slice(2)):str_value.startsWith("-")?build_params.variables.push(str_value.slice(1)):build_params.free.push(str_value)}),0===build_params.free.length&&0<build_params.options.length){if(build_params.options.includes("version"))return void this._logger.header();if(build_params.options.includes("help"))return void yabs.util.openURLWithBrowser(yabs.URL_YABS_MANUAL)}this._logger.header(),this._logger.line(),this._logger.endl();try{this._logger.info("Configuring build");let build_config=null;if(0===build_params.free.length)yabs.util.exists(yabs.DEFAULT_BUILD_ALL_FILE)?build_config=new yabs.BuildConfig(yabs.DEFAULT_BUILD_ALL_FILE):yabs.util.exists(yabs.DEFAULT_BUILD_FILE)&&(build_config=new yabs.BuildConfig(yabs.DEFAULT_BUILD_FILE));else{var build_param_input=path.normalize(build_params.free[0]);if(!yabs.util.exists(build_param_input))throw"Cannot find path or file: "+build_param_input;if(yabs.util.isDirectory(build_param_input)){var path_build_json=path.join(build_param_input,yabs.DEFAULT_BUILD_FILE),path_buildall_json=path.join(build_param_input,yabs.DEFAULT_BUILD_ALL_FILE);if(yabs.util.exists(path_build_json))build_config=new yabs.BuildConfig(path_build_json);else{if(!yabs.util.exists(path.join(path_buildall_json)))throw`Cannot locate ${path_build_json} or `+path_buildall_json;build_config=new yabs.BuildConfig(path.join(path_buildall_json))}}else build_config=new yabs.BuildConfig(build_param_input)}if(build_config.isBatchBuild())await new yabs.BatchBuilder(this._logger,build_config,build_params).build();else{const builder=new yabs.Builder(this._logger,build_config,build_params);await builder.build()}}catch(e){this._logger.error(e),this._logger.out("\nBuild aborted.")}this._logger.endl()}},(new yabs.Application).main(process.argv);