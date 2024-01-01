/*
 *   __ __ _____ _____ _____     _
 *  |  |  |  _  |  _  |   __|   |_|___
 *   \_   |     |  _ -|__   |_  | |_ -|
 *    /__/|__|__|_____|_____|_|_| |___|
 *                            |___|
 *
 *  Yet-Another-Build-System.js
 *  https://github.com/metayeti/YABS.js
 *  ---
 *  (c) 2023 Danijel Durakovic
 *  Licensed under the terms of the MIT license
 *
 */

/*jshint esversion:9*/

/**
 * @file yabs.js
 * @author Danijel Durakovic
 * @version 1.2.0 dev
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

/**
 * yabs.js namespace
 * @namespace
 */
const yabs = {};

////////////////////////////////////////////////////////////////////////////////
//
//  Constants
//
////////////////////////////////////////////////////////////////////////////////

yabs.VERSION = '1.2.0dev'; // YABS.js version

yabs.DEFAULT_BUILD_ALL_FILE = 'build_all.json';
yabs.DEFAULT_BUILD_FILE = 'build.json';

yabs.DEFAULT_COMPILE_OPTIONS = '--compress --mangle';
yabs.NEWLINE_SYMBOL = '\n'; // LF, use \r\n for CRLF

yabs.GLUE_FILE_EXTENSION = '.glw';
yabs.PREPROCESS_FILE_EXTENSION = '.pre';
yabs.COMPILE_FILE_EXTENSION = '.cmp';

yabs.COMPILED_SOURCE_EXTENSION = '.min.js';

yabs.URL_YABS_MANUAL = 'https://github.com/metayeti/YABS.js/blob/main/HOWTO.md';

////////////////////////////////////////////////////////////////////////////////
//
//  Utility
//
////////////////////////////////////////////////////////////////////////////////

yabs.util = {};

/**
 * Checks whether a given file or path exists.
 * 
 * @function exists
 * @memberof yabs.util
 * @instance
 * 
 * @param {string} source_path
 * 
 * @returns {bool}
 */
yabs.util.exists = function(source_path) {
	return fs.existsSync(source_path);
};

/**
 * Checks whether a given path represents a directory.
 * 
 * @function isDirectory
 * @memberof yabs.util
 * @instance
 * 
 * @param {string} source_path
 * 
 * @returns {bool}
 */
yabs.util.isDirectory = function(source_path) {
	return fs.lstatSync(source_path).isDirectory();
};

/**
 * Get modified-time of given path.
 * 
 * @function getModifiedTime
 * @memberof yabs.util
 * @instance
 * 
 * @param {string} source_path
 * 
 * @returns {number}
 */
yabs.util.getModifiedTime = function(source_path) {
	return fs.statSync(source_path).mtime;
};

/**
 * Determines whether or not source filename is newer than destination filename.
 *
 * @function isSourceNewer
 * @memberof yabs.util
 * @instance
 *
 * @param {string} source_path
 * @param {string} destination_path
 *
 * @returns {bool}
 */
yabs.util.isSourceNewer = function(source_path, destination_path) {
	const dtime_modified_source = (Date.now() - yabs.util.getModifiedTime(source_path));
	const dtime_modified_destination = (Date.now() - yabs.util.getModifiedTime(destination_path));
	return (dtime_modified_destination - dtime_modified_source) >= 1000;
};

/**
 * Recursively generates a list of files based on given source and destination directories.
 * Skip source files that are both older than, and have a correlating existing destination file.
 * (This makes it so that repeated builds don't keep cloning already existing files for which
 * there is no need to be repeatedly updated.)
 *
 * @function getFilesWithRecursiveDescent
 * @memberof yabs.util
 * @instance
 * 
 * @param {string} source_dir - Source relative directory.
 * @param {string} destination_dir - Destination relative directory.
 * @param {array} mask - Can be one of three states:
 *                       ["*", null] - fetch everything and descent recursively
 *                       ["*", "*"] - fetch everything, but don't descent recursively
 *                       ["*", ".ext"] - fetch everything, don't descent recursively, and it has to match extension
 * 
 * @returns {array} Array of {source, destination} pairs.
 */
yabs.util.getFilesWithRecursiveDescent = function(source_dir, destination_dir, mask, depth = 0) {
	let list = [];
	if (!yabs.util.exists(source_dir)) {
		throw `Could not locate path: ${source_dir}`;
	}
	const source_dir_listing = fs.readdirSync(source_dir);
	source_dir_listing.forEach(listing_entry => {
		const nested_source_path = path.join(source_dir, listing_entry);
		const nested_destination_path = path.join(destination_dir, listing_entry);
		const is_source_directory = yabs.util.isDirectory(nested_source_path);
		if (is_source_directory) { // this is a directory
			if (mask[0] === '*' && mask[1] === null) { // only allow recursive descent with correct mask
				list = list.concat(yabs.util.getFilesWithRecursiveDescent(
					nested_source_path, nested_destination_path, mask, depth + 1
				));
			}
		}
		else { // this is a file
			// validate against mask
			if (mask[0] === '*' && mask[1] !== '*' && mask[1] !== null) {
				// validate against extension type
				const parsed_nested_source_path = path.parse(nested_source_path);
				if (mask[1] !== parsed_nested_source_path.ext) {
					return;
				}
			}
			if (yabs.util.exists(nested_destination_path)) { // destination file already exists
				// check file timestamps
				if (!yabs.util.isSourceNewer(nested_source_path, nested_destination_path)) {
					// source file is not newer than destination, skip this file
					return;
				}
			}
			list.push({
				source: nested_source_path,
				destination: nested_destination_path
			});
		}
	});
	// return the compiled list
	return list;
};

/**
 * Parses JSDoc-style tags from a source file.
 *
 * @function parseJSDocTagsFromFile
 * @memberof yabs.util
 * @instance
 *
 * @param {string} source_file - Source filename.
 * @param {object} output - Reference to output object.
 */
yabs.util.parseJSDocTagsFromFile = function(source_file, output) {
	const jsdoc_regex = /\/\*\*(.*?)\*\//gs;
	const tag_regex = /\*\s*@(\w+)\s+(.+)/g;
	const file_content = fs.readFileSync(source_file, { encoding: 'utf8', flag: 'r' });
	const jsdoc_regex_matches = file_content.match(jsdoc_regex);
	if (jsdoc_regex_matches) {
		jsdoc_regex_matches.forEach(regex_match => {
			let tag_match;
			while ((tag_match = tag_regex.exec(regex_match)) !== null) {
				const tag_key = tag_match[1];
				const tag_value = tag_match[2];
				output[tag_key] = tag_value;
			}
		});
	}
};

/**
 * Attempts to resolve the given URL in a native browser.
 *
 * @function openURLWithBrowser
 * @memberof yabs.util
 * @instance
 *
 * @param {string} url - URL to resolve.
 */
yabs.util.openURLWithBrowser = function(url) {
	const start_cmd = (function() {
		switch (process.platform) {
			case 'darwin': return 'open';
			case 'win32': return 'start';
			default: return 'xdg-open';
		}
	}());
	exec(start_cmd + ' ' + url);
};

////////////////////////////////////////////////////////////////////////////////
//
//  Logger
//
////////////////////////////////////////////////////////////////////////////////

yabs.Logger = class {
	/**
	 * Constructs a Logger object.
	 *
	 * @class yabs.Logger
	 * @classdesc Deals with output.
	 */
	constructor() {
		// detect if output is a terminal or not
		// (so we can strip color codes if output is redirected)
		const is_tty = process.stdout.isTTY;
		// output constants and color codes
		this._OUTPUT_RESET     = (is_tty) ? '\x1b[0m'  : '';
		this._OUTPUT_BRIGHT    = (is_tty) ? '\x1b[1m'  : '';
		this._OUTPUT_FG_RED    = (is_tty) ? '\x1b[31m' : '';
		this._OUTPUT_FG_GREEN  = (is_tty) ? '\x1b[32m' : '';
		this._OUTPUT_FG_YELLOW = (is_tty) ? "\x1b[33m" : '';
	}
	/**
	 * Prints a message, followed by newline.
	 * 
	 * @param {string} message
	 */
	out(message) {
		process.stdout.write(`${message}\n`);
	}
	/**
	 * Prints a raw message.
	 * 
	 * @param {string} message
	 */
	out_raw(message) {
		process.stdout.write(message);
	}
	/**
	 * Ends output with 'ok'.
	 */
	ok() {
		process.stdout.write(
			` ${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_GREEN}` +
			`ok${this._OUTPUT_RESET}\n`
		);
	}
	/**
	 * Prints an info message.
	 * 
	 * @param {string} message
	 */
	info(message) {
		process.stdout.write(
			`${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_YELLOW}>` +
			`${this._OUTPUT_RESET} ${message}\n\n`
		);
	}
	/**
	 * Prints a newline.
	 */
	endl() {
		process.stdout.write('\n');
	}
	/**
	 * Prints an error message.
	 * 
	 * @param {string} message
	 */
	error(message) {
		process.stdout.write(
			`${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_RED}Error: ` +
			`${this._OUTPUT_RESET}${message}\n`
		);
	}
	/**
	 * Prints a success message.
	 * 
	 * @param {string} message
	 */
	success(message) {
		process.stdout.write(
			`${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_GREEN}Success: ` +
			`${this._OUTPUT_RESET}${message}\n`
		);
	}
	/**
	 * Prints the YABS.js header.
	 */
	header() {
		this.out_raw(`${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_YELLOW}`);
		this.out('  __ __ _____ _____ _____     _');
		this.out(' |  |  |  _  |  _  |   __|   |_|___');
		this.out('  \\_   |     |  _ -|__   |_  | |_ -|');
		this.out('   /__/|__|__|_____|_____|_|_| |___|');
		this.out('                           |___|' + `${this._OUTPUT_RESET}` + ' '.repeat(13 - yabs.VERSION.length) + 'v' + yabs.VERSION);
		this.out(
			` ${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_YELLOW}Y${this._OUTPUT_RESET}et`
			//' '.repeat(41 - yabs.VERSION.length) + 'v' + yabs.VERSION
		);
		this.out(
			` ${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_YELLOW}A${this._OUTPUT_RESET}nother` +
			'   https://github.com/metayeti/YABS.js'
		);
		this.out(
			` ${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_YELLOW}B${this._OUTPUT_RESET}uild` +
			`     ${this._OUTPUT_RESET}         (c) 2024 Danijel Durakovic`
		);
		this.out(
			` ${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_YELLOW}S${this._OUTPUT_RESET}ystem${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_YELLOW} .js` +
			`${this._OUTPUT_RESET}                        MIT licence`
		);
		this.endl();
	}
	/**
	 * Prints a long line.
	 */
	line() {
		this.out('----------------------------------------------');
	}
};

////////////////////////////////////////////////////////////////////////////////
//
//  Build configuration
//
////////////////////////////////////////////////////////////////////////////////

yabs.BuildConfig = class {
	/**
	 * Constructs a BuildConfig object.
	 *
	 * @class yabs.BuildConfig
	 * @classdesc Configures a build based on input.
	 * 
	 * @param {string} source_file - Build instructions JSON file.
	 */
	constructor(source_file) {
		const parsed_source_file = path.parse(source_file);
		this._source_file = parsed_source_file.base;
		this._base_dir = parsed_source_file.dir;
		// parse source JSON
		const file_data = fs.readFileSync(source_file, { encoding: 'utf8', flag: 'r' });
		const json_data = JSON.parse(file_data);
		// check if this is a batch build
		if (json_data.hasOwnProperty('batch_build')) {
			this._is_batch = true;
			this._batch_listing = [];
			if (json_data.batch_build instanceof Array) {
				json_data.batch_build.forEach(batch_entry => {
					if (typeof batch_entry === 'string') {
						this._batch_listing.push({
							target: batch_entry
						});
					}
					else if (typeof batch_entry === 'object' && batch_entry !== null) {
						const batch_entry_object = {};
						if (batch_entry.hasOwnProperty('target')) {
							if (typeof batch_entry.target === 'string') {
								batch_entry_object.target = batch_entry.target;
							}
						}
						if (batch_entry.hasOwnProperty('options')) {
							if (typeof batch_entry.options === 'string') {
								batch_entry_object.options = batch_entry.options;
							}
						}
						if (batch_entry_object.target) {
							this._batch_listing.push(batch_entry_object);
						}
					}
				});
			}
			else {
				throw 'The "batch_build" entry has to be an Array type!';
			}
			return; // this is a batch build, we are all done here
		}
		// extract source_dir
		if (!json_data.hasOwnProperty('source_dir')) {
			throw 'Missing "source_dir" entry!';
		}
		this._source_dir = json_data.source_dir;
		// extract destination_dir
		if (!json_data.hasOwnProperty('destination_dir')) {
			throw 'Missing "destination_dir" entry!';
		}
		this._destination_dir = json_data.destination_dir;
		// extract html listing
		if (json_data.hasOwnProperty('html')) {
			if (json_data.html instanceof Array) {
				if (!json_data.html.every(element => typeof element === 'string')) {
					throw 'Every element in "html" entry has to be a String type!';
				}
				this._html_listing = json_data.html;
			}
			else if (typeof json_data.html === 'string') {
				this._html_listing = [ json_data.html ];
			}
		}
		if (!this._html_listing) {
			this._html_listing = [];
		}
		// extract sources listing
		if (json_data.hasOwnProperty('sources')) {
			if (json_data.sources instanceof Array) {
				this._sources_listing = [];
				json_data.sources.forEach(source_entry => {
					if (typeof source_entry === 'string') {
						this._sources_listing.push({
							file: source_entry
						});
					}
					else if (typeof source_entry === 'object' && source_entry !== null) {
						const source_entry_object = {};
						if (source_entry.hasOwnProperty('output_file')) {
							if (typeof source_entry.output_file === 'string') {
								source_entry_object.output_file = source_entry.output_file;
							}
						}
						if (source_entry.hasOwnProperty('compile_options')) {
							if (typeof source_entry.compile_options === 'string') {
								source_entry_object.compile_options = source_entry.compile_options;
							}
						}
						if (source_entry.hasOwnProperty('bundle')) {
							if (source_entry_object.output_file === undefined) {
								// we are missing output_file
								throw 'Bundled scripts require an "output_file" entry!';
							}
							if (!(source_entry.bundle instanceof Array)) {
								throw 'The "bundle" entry has to be an Array type!';
							}
							if (!source_entry.bundle.every(element => typeof element === 'string')) {
								throw 'Every element in "bundle" entry has to be a String type!';
							}
							source_entry_object.is_bundle = true;
							source_entry_object.bundle_files = source_entry.bundle;
						}
						else if (source_entry.hasOwnProperty('file')) {
							if (typeof source_entry.file === 'string') {
								source_entry_object.file = source_entry.file;
							}
						}
						if (source_entry.hasOwnProperty('header')) {
							if (source_entry.header instanceof Array) {
								if (!source_entry.header.every(element => typeof element === 'string')) {
									throw 'Every item of "header" entry listing has to be a String type!';
								}
								source_entry_object.header = source_entry.header;
							}
							else if (typeof source_entry.header === 'string') {
								source_entry_object.header = [ source_entry.header ];
							}
						}
						else if (source_entry.hasOwnProperty('use_header')) {
							// using header from reference
							if (json_data.headers && typeof source_entry.use_header === 'string') {
								if (json_data.headers.hasOwnProperty(source_entry.use_header)) {
									const header_ref = json_data.headers[source_entry.use_header];
									if (header_ref instanceof Array) {
										if (!header_ref.every(element => typeof element === 'string')) {
											throw 'Every item in "headers" entry listing has to be a String type!';
										}
										source_entry_object.header = header_ref;
									}
									else if (typeof header_ref === 'string') {
										source_entry_object.header = [ header_ref ];
									}
								}
							}
						}
						if (source_entry.hasOwnProperty('variables')) {
							if (typeof source_entry.variables === 'object' &&
								!(source_entry.variables instanceof Array) &&
								source_entry.variables !== null) {

								source_entry_object.variables = {};
								for (const variable_key in source_entry.variables) {
									const variable_data = source_entry.variables[variable_key];
									if (variable_data instanceof Array) {
										if (!variable_data.every(element => typeof element === 'string')) {
											throw 'Every item in "variables" entry listing has to be a String type!';
										}
										source_entry_object.variables[variable_key] = variable_data;
									}
								}
							}
						}
						else if (source_entry.hasOwnProperty('use_variables')) {
							// using variables from reference
							if (json_data.variables && typeof source_entry.use_variables === 'string') {
								if (json_data.variables.hasOwnProperty(source_entry.use_variables)) {
									const variables_ref = json_data.variables[source_entry.use_variables];
									if (typeof variables_ref === 'object' &&
										!(variables_ref instanceof Array) &&
										variables_ref !== null) {

										source_entry_object.variables = {};
										for (const variable_key in variables_ref) {
											const variable_data = variables_ref[variable_key];
											if (variable_data instanceof Array) {
												if (!variable_data.every(element => typeof element === 'string')) {
													throw 'Every item in "variables" entry listing has to be a String type!';
												}
												source_entry_object.variables[variable_key] = variable_data;
											}
										}
									}
								}
							}
						}
						if (source_entry.hasOwnProperty('preprocess')) {
							if (source_entry.preprocess === true) {
								source_entry_object.preprocess = true;
							}
						}
						if (source_entry_object.file || source_entry_object.is_bundle) {
							this._sources_listing.push(source_entry_object);
						}
					}
				});
			}
			else {
				throw 'The "sources" entry has to be an Array type!';
			}
		}
		if (!this._sources_listing) {
			this._sources_listing = [];
		}
		// extract files listing
		if (json_data.hasOwnProperty('files')) {
			if (json_data.files instanceof Array) {
				if (!json_data.files.every(element => typeof element === 'string')) {
					throw 'Every element in "files" entry has to be a String type!';
				}
				this._files_listing = json_data.files;
			}
			else if (typeof json_data.files === 'string') {
				this._files_listing = [ json_data.files ];
			}
		}
		if (!this._files_listing) {
			this._files_listing = [];
		}
		// extract events listing
		if (json_data.hasOwnProperty('events')) {
			this._events_listing = {
				prebuild: [],
				postbuild: []
			};
			const events_entry = json_data.events;
			if (typeof events_entry === 'object' && events_entry !== null) {
				const prebuild_entry = events_entry.prebuild;
				const postbuild_entry = events_entry.postbuild;
				if (prebuild_entry instanceof Array) {
					if (!prebuild_entry.every(element => typeof element === 'string')) {
						throw 'Every element in "prebuild" entry has to be a String type!';
					}
					this._events_listing.prebuild = prebuild_entry;
				}
				if (postbuild_entry instanceof Array) {
					if (!postbuild_entry.every(element => typeof element === 'string')) {
						throw 'Every element in "postbuild" entry has to be a String type!';
					}
					this._events_listing.postbuild = postbuild_entry;
				}
			}
		}
		else {
			this._events_listing = null;
		}
	}
	/**
	 * Returns the input build instructions filename.
	 */
	getSourceFile() {
		return this._source_file;
	}
	/**
	 * Returns the base directory of the build instructions filename.
	 */
	getBaseDir() {
		return this._base_dir;
	}
	/**
	 * Returns whether or not this is a batch build.
	 * 
	 * @returns {bool}
	 */
	isBatchBuild() {
		return this._is_batch;
	}

	/**
	 * Returns batch listing.
	 * 
	 * @returns {array}
	 */
	getBatchListing() {
		return this._batch_listing;
	}

	/**
	 * Returns source directory.
	 * 
	 * @returns {string}
	 */
	getSourceDir() {
		return this._source_dir;
	}

	/**
	 * Returns destination directory.
	 * 
	 * @returns {string}
	 */
	getDestinationDir() {
		return this._destination_dir;
	}

	/**
	 * Returns HTML listing.
	 * 
	 * @returns {array}
	 */
	getHTMLListing() {
		return this._html_listing;
	}

	/**
	 * Returns sources listing.
	 * 
	 * @returns {array}
	 */
	getSourcesListing() {
		return this._sources_listing;
	}

	/**
	 * Returns files listing.
	 * 
	 * @returns {array}
	 */
	getFilesListing() {
		return this._files_listing;
	}

	/**
	 * Returns events listing.
	 * 
	 * @returns {array}
	 */
	getEventsListing() {
		return this._events_listing;
	}
};

////////////////////////////////////////////////////////////////////////////////
//
//  Builder
//
////////////////////////////////////////////////////////////////////////////////

yabs.Builder = class {
	/**
	 * Constructs a Builder object.
	 * 
	 * @class yabs.Builder
	 * @classdesc Implements building.
	 * 
	 * @param {object} logger
	 * @param {object} build_config
	 * @param {object} build_params
	 */
	constructor(logger, build_config, build_params) {
		this._logger = logger;
		this._build_config = build_config; // build configuration
		this._build_params = build_params; // build parameters
		this._base_dir = this._build_config.getBaseDir(); // base directory
		// source and destination directories
		this._source_dir = path.normalize(this._build_config.getSourceDir());
		this._destination_dir = path.normalize(this._build_config.getDestinationDir());
		// prebuilt manifest lists
		this._files_manifest = null;
		this._sources_manifest = null;
		this._html_manifest = null;
		// build statistics
		this._n_files_updated = 0;
		this._build_start_time = Date.now();
	}

	/**
	 * Creates manifest lists for current build.
	 */
	_buildManifests() {
		function buildFilesManifest() {
			const files_listing = this._build_config.getFilesListing();
			files_listing.forEach(listing_entry => {
				if (listing_entry.includes('*')) { // path includes mask
					// use recursive descent to capture all files
					const full_source_path = path.join(this._base_dir, this._source_dir, listing_entry);
					const parsed_source_path = path.parse(full_source_path);
					const full_destination_path = path.join(this._destination_dir, listing_entry);
					const parsed_destination_path = path.parse(full_destination_path);
					if (!parsed_source_path.dir.includes('*') && parsed_source_path.name === '*') {
						// only allow masks when they are the last part of path
						// (disallow masks in dirname because they make no sense)
						const split_base = parsed_source_path.base.split('.');
						let mask = null;
						if (parsed_source_path.base === '*') {
							mask = ['*', null]; // ["*", null]
						}
						else if (parsed_source_path.base === '*.*') {
							mask = ['*', '*']; // ["*", "*"]
						}
						else if (split_base[0] === '*' && split_base[1] !== '*' && split_base[1] !== '') {
							mask = ['*', parsed_source_path.ext]; // ["*", ".ext"]
						}
						if (mask !== null) {
							this._files_manifest = this._files_manifest.concat(
								yabs.util.getFilesWithRecursiveDescent(parsed_source_path.dir, parsed_destination_path.dir, mask)
							);
						}
					}
				}
				else { // plain path
					const plain_file_source = path.join(this._base_dir, this._source_dir, listing_entry);
					const plain_file_destination = path.join(this._destination_dir, listing_entry);
					if (yabs.util.isDirectory(plain_file_source)) {
						// this is a directory
						return;
					}
					let include_plain_file = false;
					if (!yabs.util.exists(plain_file_destination)) {
						// destination file does not exist yet
						include_plain_file = true;
					}
					else {
						// check if source is newer than destination
						if (yabs.util.isSourceNewer(plain_file_source, plain_file_destination)) {
							include_plain_file = true;
						}
					}
					if (include_plain_file) {
						// make sure source is not the same as destination
						if (plain_file_source === plain_file_destination) {
							throw `Source file: "${plain_file_source}" cannot be the same as the destination!`;
						}
						// add to manifest
						this._files_manifest.push({
							source: plain_file_source,
							destination: plain_file_destination
						});
					}
				}
			});
		}

		function buildSourcesManifest() {
			const sources_listing = this._build_config.getSourcesListing();
			sources_listing.forEach(listing_entry => {
				// configure source filename (or filenames if bundle)
				let sources_list = [];
				if (listing_entry.is_bundle) {
					sources_list = listing_entry.bundle_files;
				}
				else {
					sources_list = [ listing_entry.file ];
				}
				if (sources_list.some(element => element.includes('*'))) {
					throw 'Sources may not have masks!';
				}
				// process sources list into full source paths
				const source_full_path_list = [];
				sources_list.forEach((source_path) => {
					const source_full_path = path.join(this._base_dir, this._source_dir, source_path);
					source_full_path_list.push(source_full_path);
				});
				// configure the output filename
				let output_filename;
				if (listing_entry.output_file) {
					output_filename = path.normalize(listing_entry.output_file);
				}
				else {
					const parsed_file_entry = path.parse(sources_list[0]);
					output_filename = path.join(parsed_file_entry.dir, parsed_file_entry.name + yabs.COMPILED_SOURCE_EXTENSION);
				}
				// configure full destination path
				const destination_full_path = path.join(this._destination_dir, output_filename);

				// process header
				const has_header = listing_entry.hasOwnProperty('header');
				const header_data = { has_header: has_header };
				if (has_header) {
					// make sure to clone the array and not use a reference
					// (because we may need to search/replace variables later on)
					header_data.header = [...listing_entry.header];
				}
				// process variables
				const has_variables = listing_entry.hasOwnProperty('variables');
				const variables_data = { has_variables: has_variables };
				if (has_variables) {
					variables_data.variables = listing_entry.variables;
				}
				// process compile options
				const compile_options = (listing_entry.hasOwnProperty('compile_options'))
					? listing_entry.compile_options
					: yabs.DEFAULT_COMPILE_OPTIONS;
				// process additional flags
				const force_preprocessor = listing_entry.preprocess === true;

				// add to manifest
				this._sources_manifest.push({
					sources: source_full_path_list,
					destination: destination_full_path,
					compile_options: compile_options,
					header_data: header_data,
					variables_data: variables_data,
					force_preprocessor: force_preprocessor
				});

			});
		}

		function buildHTMLManifest() {
			const html_listing = this._build_config.getHTMLListing();
			html_listing.forEach(listing_entry => {
				if (listing_entry.includes('*')) {
					// disallow any masks
					return;
				}
				const html_file_source = path.join(this._base_dir, this._source_dir, listing_entry);
				const html_file_destination = path.join(this._destination_dir, listing_entry);
				// make sure source is not the same as destination
				if (html_file_source === html_file_destination) {
					throw `Source file: "${html_file_source}" cannot be the same as the destination!`;
				}
				// add to manifest
				this._html_manifest.push({
					source: html_file_source,
					destination: html_file_destination
				});
			});
		}

		this._files_manifest = [];
		this._sources_manifest = [];
		this._html_manifest = [];

		buildFilesManifest.call(this);
		buildSourcesManifest.call(this);
		buildHTMLManifest.call(this);
	}

	/**
	 * Verifies that source files in the manifest lists exist.
	 */
	_verifySourceFiles() {
		function verifyManifest(manifest_list) {
			function verifyOne(path_source) {
				const path_resolved = path.resolve(path_source);
				if (!yabs.util.exists(path_resolved)) {
					throw `Could not find file: ${path_source}`;
				}
			}
			manifest_list.forEach(manifest_entry => {
				if (manifest_entry.sources instanceof Array) { // we have a list of sources
					manifest_entry.sources.forEach(verifyOne);
				}
				else if (typeof manifest_entry.source === 'string') { // we have a single source
					verifyOne(manifest_entry.source);
				}
			});
		}
		verifyManifest.call(this, this._files_manifest);
		verifyManifest.call(this, this._sources_manifest);
		verifyManifest.call(this, this._html_manifest);
	}

	/**
	 * Process source files headers, substituting variables with data where applicable.
	 */
	_processSourceHeaders() {
		this._sources_manifest.forEach(manifest_entry => {
			const header_data = manifest_entry.header_data;
			if (!header_data.has_header) { // this entry has no header, it's safe to skip it
				return;
			}
			let has_variables = false;
			// determine if the header contains variables
			header_data.header.every(header_str => {
				if (/%\S+%/.test(header_str) || /\$YEAR\$/.test(header_str)) {
					has_variables = true;
					return false;
				}
				return true;
			});
			if (!has_variables) { // this entry has a header but no variables, so it's safe to skip
				return;
			}
			// extract JSDoc tags from sourcefile
			const parsed_variables = {};
			manifest_entry.sources.forEach(source_file => {
				yabs.util.parseJSDocTagsFromFile(source_file, parsed_variables);
			});
			// update header variables
			for (let i = 0; i < header_data.header.length; ++i) {
				// from JSDoc tags
				for (let variable_key in parsed_variables) {
					const variable_value = parsed_variables[variable_key];
					if (Object.prototype.hasOwnProperty.call(parsed_variables, variable_key)) {
						header_data.header[i] = header_data.header[i].replace(new RegExp(`%${variable_key}%`, 'g'), variable_value);
					}
				}
				// special variable
				header_data.header[i] = header_data.header[i].replace(/\$YEAR\$/g, new Date().getFullYear());
			}
		});
	}

	_buildStep_I_UpdateFiles() {
		this._files_manifest.forEach(manifest_entry => {
			this._logger.out_raw(`${manifest_entry.destination} ...`);
			// check if destination directory exists
			const dir = path.dirname(manifest_entry.destination);
			if (!yabs.util.exists(dir)) {
				// directory doesn't exist yet, create it
				fs.mkdirSync(dir, { recursive: true });
			}
			// copy file
			fs.copyFileSync(manifest_entry.source, manifest_entry.destination);
			this._logger.ok();
			this._n_files_updated += 1;
		});
		this._logger.endl();
	}

	async _buildStep_II_CompileSources() {

		function preprocessOneSource(input_file, output_file, params) {
			// invoke the preprocessor
			return new Promise((resolve, reject) => {
				exec(`metascript ${input_file} ${params} > ${output_file}`, (err) => {
					if (err) {
						this._logger.out_raw('\n\n');
						reject(err);
					}
					else {
						resolve();
					}
				});
			});
		}
		function compileOneSource(input_file, output_file, params) {
			// invoke the compiler
			return new Promise((resolve, reject) => {
				exec(`uglifyjs ${input_file} ${params} -o ${output_file}`, (err) => {
					if (err) {
						this._logger.out_raw('\n\n');
						reject(err);
					}
					else {
						resolve();
					}
				});
			});
		}

		// compilation pipeline substeps
		function substep_I_glue(sources, destination) {
			// glue multiple source files into one
			sources.forEach((source_file, index) => {
				let source_file_data = fs.readFileSync(source_file, { encoding: 'utf8', flag: 'r' });
				source_file_data = source_file_data.replace(/\r/gm, ''); // normalize output to \n
				if (index === 0) {
					fs.writeFileSync(destination, source_file_data, { encoding: 'utf8', flag: 'w' });
				} else {
					// no need to use NEWLINE_SYMBOL here as we will process the output
					fs.appendFileSync(destination, '\n' + source_file_data, { encoding: 'utf8', flag: 'a' });
				}
			});
			return destination;
		}
		async function substep_II_preprocess(source, destination, preprocessor_params) {
			// we are ready to run the file through the preprocessor
			await preprocessOneSource.call(this, source, destination, preprocessor_params);

			return destination;
		}
		async function substep_III_compile(source, destination, compiler_params) {
			// compile source file
			await compileOneSource.call(this, source, destination, compiler_params);
			return destination;
			
		}
		function substep_IV_finalize(source, destination, header_data) {
			// output final file, optionally headerize
			const source_file_data = fs.readFileSync(source, { encoding: 'utf8', flag: 'r' });
			const destination_file_data = (header_data.has_header) ?
				header_data.header.join(yabs.NEWLINE_SYMBOL) + yabs.NEWLINE_SYMBOL + source_file_data : source_file_data;
			fs.writeFileSync(destination, destination_file_data, { encoding: 'utf8', flag: 'w' });
			return destination;	
		}

		// compile each source
		for (const manifest_entry of this._sources_manifest) {
			this._logger.out_raw(`${manifest_entry.destination} ...`);
			// check if destination directory exists
			const dir = path.dirname(manifest_entry.destination);
			if (!yabs.util.exists(dir)) {
				// directory doesn't exist yet, create it
				fs.mkdirSync(dir, { recursive: true });
			}
			// check if we should use the preprocessor or not
			let use_preprocessor = false;
			const variable_params = this._build_params.variables;
			const variables_data = manifest_entry.variables_data;
			const has_variables = variables_data.has_variables;
			const variables_listing = variables_data.variables;
			if (manifest_entry.force_preprocessor) {
				use_preprocessor = true;
			}
			else {
				if (has_variables) {
					// check if any entry in variables_list matches a provided -variable parameter
					for (let i = 0; i < variable_params.length; ++i) {
						if (variables_listing.hasOwnProperty(variable_params[i])) {
							use_preprocessor = true;
							break;
						}
					}
				}
			}
			// prepare a list of preprocessor parameters (if we're using the preprocessor)
			let preprocessor_params = '';
			if (use_preprocessor && has_variables) { // skip listings without variables (might only have "preprocess" set)
				const preprocessor_params_list = [];
				variable_params.forEach(variable_param => {
					// make sure the variable listing is defined
					if (variables_listing.hasOwnProperty(variable_param)) {
						const variables_listing_list = variables_listing[variable_param];
						variables_listing_list.forEach(variable_entry => {
							const variable_split = variable_entry.split('=');
							const variable_key = variable_split[0].trim();
							const variable_value = variable_split[1].trim();
							if (variable_key.length && variable_value.length) {
								preprocessor_params_list.push(`-${variable_key}=${variable_value}`);
							}
						});
					}
				});
				preprocessor_params = preprocessor_params_list.join(' ');
			}
			// set skip flag so we can optimize the build process
			const skip_glue = (manifest_entry.sources.length <= 1);

			// we can now begin the compilation process for this entry

			// compilation pipeline:
			//
			// {js} \       I         II       III       IV
			// [js]  >--> {glw} --> {pre} --> [cmp] --> [js]
			// {js} /  (optional) (optional)

			let next_source, temp_files = [];

			if (skip_glue) {
				next_source = manifest_entry.sources[0];
			}
			else { // glue files substep
				temp_files.push(next_source = substep_I_glue.call(
					this,
					manifest_entry.sources,
					manifest_entry.destination + yabs.GLUE_FILE_EXTENSION
				));
			}

			if (use_preprocessor) { // preprocess substep
				temp_files.push(next_source = await substep_II_preprocess.call(
					this,
					next_source,
					manifest_entry.destination + yabs.PREPROCESS_FILE_EXTENSION,
					preprocessor_params
				));
			}

			// compile substep
			temp_files.push(next_source = await substep_III_compile.call(
				this,
				next_source,
				manifest_entry.destination + yabs.COMPILE_FILE_EXTENSION,
				manifest_entry.compile_options
			));

			// finalize substep
			substep_IV_finalize.call(
				this,
				next_source,
				manifest_entry.destination,
				manifest_entry.header_data
			);

			// clean-up the temp files
			temp_files.forEach(file_to_remove => {
				fs.rmSync(file_to_remove, { force: true });
			});
			
			// done
			this._logger.ok();
			this._n_files_updated += 1;
		}
		this._logger.endl();
	}

	_buildStep_III_WriteHTMLFiles() {
		const script_src_regex = /<script\b[^>]*\bsrc=(["'])(.*?)(\1).*?>/;
		// write each html file
		this._html_manifest.forEach(manifest_entry => {
			this._logger.out_raw(`${manifest_entry.destination} ...`);
			// check if destination directory exists
			const dir = path.dirname(manifest_entry.destination);
			if (!yabs.util.exists(dir)) {
				// directory doesn't exist yet, create it
				fs.mkdirSync(dir, { recursive: true });
			}

			const html_file_data = fs.readFileSync(manifest_entry.source, { encoding: 'utf8', flag: 'r' });
			const html_line_data = html_file_data.split(/\r?\n/);
			const html_base_dir = path.parse(manifest_entry.source).dir;
			const html_output_lines = [];
			const destinations_used = [];
			html_line_data.forEach(line_string => {
				const src_regex_match = line_string.match(script_src_regex);
				let skip_current_line = false;
				let substitute_current_line = false;
				let substitution_string = '';
				if (src_regex_match) {
					const extracted_src = src_regex_match[2];
					const src_parsed = path.parse(extracted_src);
					const src_joined_full = path.join(html_base_dir, src_parsed.dir, src_parsed.base);
					this._sources_manifest.every(sources_manifest_entry => {
						let keep_going = true;
						sources_manifest_entry.sources.every(source_entry => {
							if (source_entry === src_joined_full) {
								// we have a match
								if (destinations_used.includes(sources_manifest_entry.destination)) {
									// we already have this destination, this means it's part of a bundle and we should skip this line
									skip_current_line = true;
								}
								else {
									// we don't have this destination yet, create a substitution line
									substitute_current_line = true;
									const destination_parsed = path.parse(sources_manifest_entry.destination);
									const substitute_path = path.join(src_parsed.dir, destination_parsed.base);
									const substitute_src = substitute_path.replace(/\\/g, '/'); // normalize path output for html
									// prepare the substitute
									substitution_string = line_string.replace(new RegExp(extracted_src, 'g'), substitute_src);
									// remember this destination so we can skip it for associated bundled scripts
									destinations_used.push(sources_manifest_entry.destination);
								}
								keep_going = false;
							}
							return keep_going;
						});
						return keep_going;
					});
				}
				if (!skip_current_line) {
					html_output_lines.push((substitute_current_line) ? substitution_string : line_string);
				}
			});
			// write output file
			const html_file_output_data = html_output_lines.join(yabs.NEWLINE_SYMBOL);
			fs.writeFileSync(manifest_entry.destination, html_file_output_data, { encoding: 'utf8', flag: 'w' });
			this._logger.ok();
			this._n_files_updated += 1;
		});
		this._logger.endl();
	}

	/**
	 * Start the build.
	 */
	async build() {
		const build_instr_dir = this._build_config.getBaseDir();
		const build_instr_file = this._build_config.getSourceFile();
		const build_instr_fullpath = path.join(build_instr_dir, build_instr_file);
		const events_listing = this._build_config.getEventsListing();

		this._logger.info(`Starting build: ${build_instr_fullpath}`);
		this._logger.info('Preparing build');

		// = prepare build I =
		// build the file manifests. this creates three arrays with unified structures that
		// have "source" and "destination" entries for each file. it also clones the
		// header data into fresh arrays so they can be used for variable substitution
		// on a per-source basis
		this._buildManifests();

		// = prepare build II =
		// now we have to verify the existence of all the files listed in manifests
		// as sources, to make sure we don't have missing or unreadable source files
		this._verifySourceFiles();

		// = prepare build III =
		// process header data for sourcefiles
		this._processSourceHeaders();

		// = run the pre-build events, if there are any =
		/*
		//TODO
		if (events_listing && events_listing.prebuild.length > 0) {
			events_listing.prebuild.forEach(event_script => {
				//this._runEventScript(event_script);
			});
		}
		*/

		// = build I =
		// update files from files manifest
		if (this._files_manifest.length > 0) { // skip if empty
			this._logger.info('Updating files');
			this._buildStep_I_UpdateFiles();
		}

		// = build II =
		// preprocess and compile sources
		if (this._sources_manifest.length > 0) { // skip if empty
			this._logger.info('Compiling sources');
			await this._buildStep_II_CompileSources();
		}

		// = build III =
		// finally, write updates into and clone HTML files
		if (this._html_manifest.length > 0) { // skip if empty
			this._logger.info('Writing HTML files');
			this._buildStep_III_WriteHTMLFiles();
		}

		// = run the post-build events, if there are any =
		/*
		//TODO
		if (events_listing && events_listing.postbuild.length > 0) {
			//events_listing.postbuild.forEeach(event_script => this.invokeEventScript(event_script));
		}
		*/

		// build finished
		const build_time = ((Date.now() - this._build_start_time) / 1000).toFixed(2);
		this._logger.success('Build finished!\n');
		this._logger.out(`Updated ${this._n_files_updated} files.`);
		this._logger.out(`Build completed in ${build_time}s.`);
	}
};

////////////////////////////////////////////////////////////////////////////////
//
//  BatchBuilder
//
////////////////////////////////////////////////////////////////////////////////

yabs.BatchBuilder = class {
	/**
	 * Constructs a BatchBuilder object.
	 *
	 * @class yabs.BatchBuilder
	 * @classdesc Implements batch building.
	 * 
	 * @param {object} logger
	 * @param {object} build_config
	 * @param {object} build_params
	 */
	constructor(logger, build_config, build_params) {
		this._logger = logger;
		this._build_config = build_config; // build configuration
		this._build_params = build_params; // build parameters
		this._base_dir = this._build_config.getBaseDir(); // base directory
		this._batch_manifest = []; // build manifest
		this._nofail_flag = this._build_params.options.includes('nofail'); // nofail flag
		this._batch_build_start_time = Date.now(); // build statistics
	}

	_buildBatchManifest(batch_listing, root_dir = '') {
		batch_listing.forEach(listing_entry => {
			const build_instr_path = listing_entry.target;
			if (!build_instr_path.length) {
				return;
			}
			let build_options;
			if (listing_entry.options) {
				build_options = [];
				const split_options = listing_entry.options.trim().split(/\s+/);
				split_options.forEach(options_item => {
					if (options_item.length >= 2 && options_item[0] === '-') {
						build_options.push(options_item.substring(1));
					}
				});
			}
			else {
				build_options = this._build_params.variables;
			}
			// construct the build target full path
			const build_target = path.join(this._base_dir, root_dir, build_instr_path);
			// check if we already have this build target
			if (this._batch_manifest.some(e => e.build_target === build_target)) {
				// we already have this build target, we may skip it
				// has the useful side-effect of keeping the recursive dragons at bay
				return;
			}
			// create the build configurations
			let build_config = null;
			if (!yabs.util.exists(build_target)) {
				const error_message = 'Cannot find path or file: ' + build_target;
				if (this._nofail_flag) {
					this._logger.error(error_message + '\n');
					return;
				}
				else {
					throw error_message;
				}
			}
			if (yabs.util.isDirectory(build_target)) { // implied build.json or build_all.json
				const path_build_json = path.join(build_target, yabs.DEFAULT_BUILD_FILE);
				const path_buildall_json = path.join(build_target, yabs.DEFAULT_BUILD_ALL_FILE);
				if (yabs.util.exists(path_build_json)) { // prioritize build over build_all
					build_config = new yabs.BuildConfig(path_build_json);
				}
				else if (yabs.util.exists(path_buildall_json)) {
					build_config = new yabs.BuildConfig(path_buildall_json);
				}
			}
			else {
				build_config = new yabs.BuildConfig(build_target);
			}
			// check if this is a batch build
			if (build_config.isBatchBuild()) {
				// walk the tree recursively and fetch all the items on the way
				this._buildBatchManifest(build_config.getBatchListing(), build_instr_path);
			}
			else {
			// push the new item into the manifest
				this._batch_manifest.push({
					build_target: build_target,
					options: build_options,
					config: build_config
				});
			}
		});
	}

	async _buildOne(build_index) {
		const build_listing = this._batch_manifest[build_index];
		const build_config = build_listing.config;	
		if (build_config.isBatchBuild()) {
			return; // should never occur
		}
		const build_params = { variables: build_listing.options };
		const builder = new yabs.Builder(this._logger, build_config, build_params);
		await builder.build();
	}

	/**
	 * Start the build.
	 */
	async build() {
		const nofail_flag = this._nofail_flag;

		const build_instr_dir = this._build_config.getBaseDir();
		const build_instr_file = this._build_config.getSourceFile();
		const build_instr_fullpath = path.join(build_instr_dir, build_instr_file);
		this._logger.info(
			`Starting ${this._logger._OUTPUT_BRIGHT}${this._logger._OUTPUT_FG_GREEN}<batch build>` +
			`${this._logger._OUTPUT_RESET} : ${build_instr_fullpath}`
		);

		// build the batch manifest
		this._buildBatchManifest(this._build_config.getBatchListing());

		let build_index = 0;
		const n_builds = this._batch_manifest.length;
		let n_successful_builds = 0;
		let n_failed_builds = 0;

		while (build_index < n_builds) {
			this._logger.out(
				`=== ${this._logger._OUTPUT_BRIGHT}${this._logger._OUTPUT_FG_GREEN}<batch build>` +
				`${this._logger._OUTPUT_RESET} ${build_index + 1}/${n_builds}` +
				` : ${this._batch_manifest[build_index].build_target} ===\n`
			);
			try {
				// build this item
				await this._buildOne(build_index++);
				// increment successful builds counter
				n_successful_builds++;
			}
			catch (e) {
				if (nofail_flag) {
					// we have --nofail
					// print the error, but keep going
					this._logger.error(e);
					this._logger.out('\nBuild aborted.');
					// increment failed builds counter
					n_failed_builds++;
				}
				else {
					// pass exception to main try/catch block
					throw e;
				}
			}
			this._logger.endl();
		}

		// all done
		const batch_build_time = ((Date.now() - this._batch_build_start_time) / 1000).toFixed(2);
		this._logger.out(
			`=== ${this._logger._OUTPUT_BRIGHT}${this._logger._OUTPUT_FG_GREEN}<batch build>` +
			`${this._logger._OUTPUT_RESET} finished! ===\n`
		);
		if (nofail_flag) {
			this._logger.out(`${n_successful_builds} builds finished, ${n_failed_builds} failed in ${batch_build_time}s.`);
		}
		else {
			this._logger.out(`${n_successful_builds} builds finished in ${batch_build_time}s.`);
		}
	}
};

////////////////////////////////////////////////////////////////////////////////
//
//  Application
//
////////////////////////////////////////////////////////////////////////////////

yabs.Application = class {
	/**
	 * Constructs an Application object.
	 *
	 * @class yabs.Application
	 * @classdesc Program entry. Parses input and runs build.
	 */
	constructor() {
		this._logger = new yabs.Logger();
	}
	/**
	 * Program entry point.
	 */
	async main(argv) {
		// process parameters
		const build_params = {
			options: [], // --option parameters
			variables: [], // -variable parameters (used for preprocessor)
			free: [] // freestanding parameters (build instructions input file)
		};
		argv.slice(2).forEach(str_value => {
			if (str_value.startsWith('--')) { // this is an --option parameter
				build_params.options.push(str_value.slice(2));
			}
			else if (str_value.startsWith('-')) { // this is a -variable parameter
				build_params.variables.push(str_value.slice(1));
			}
			else { // this is a freestanding parameter
				build_params.free.push(str_value);
			}
		});

		if (build_params.free.length === 0) {
			if (build_params.options.length > 0) {
				if (build_params.options.includes('version')) {
					this._logger.header();
					return;
				}
				else if (build_params.options.includes('help')) {
					yabs.util.openURLWithBrowser(yabs.URL_YABS_MANUAL);
					return;
				}
			}
		}

		// print out header
		this._logger.header();
		this._logger.line();
		this._logger.endl();
		try {
			this._logger.info('Configuring build');
			// figure out what we're building first
			let build_config = null;
			if (build_params.free.length === 0) { // parametress run
				if (yabs.util.exists(yabs.DEFAULT_BUILD_ALL_FILE)) { // prioritize build_all over build
					build_config = new yabs.BuildConfig(yabs.DEFAULT_BUILD_ALL_FILE);
				}
				else if (yabs.util.exists(yabs.DEFAULT_BUILD_FILE)) {
					build_config = new yabs.BuildConfig(yabs.DEFAULT_BUILD_FILE);
				}
			}
			else {
				const build_param_input = path.normalize(build_params.free[0]);
				if (!yabs.util.exists(build_param_input)) {
					throw 'Cannot find path or file: ' + build_param_input;
				}
				if (yabs.util.isDirectory(build_param_input)) { // append build.json if input is a directory		
					if (yabs.util.exists(path.join(build_param_input, yabs.DEFAULT_BUILD_FILE))) { // prioritize build over build_all
						build_config = new yabs.BuildConfig(path.join(build_param_input, yabs.DEFAULT_BUILD_FILE));
					}
					else if (yabs.util.exists(path.join(build_param_input, yabs.DEFAULT_BUILD_ALL_FILE))) {
						build_config = new yabs.BuildConfig(path.join(build_param_input, yabs.DEFAULT_BUILD_ALL_FILE));
					}
				}
				else {
					build_config = new yabs.BuildConfig(build_param_input);
				}
			}
			// make sure we have build configuration
			if (!build_config) {
				throw 'Missing input file!';
			}
			// check if this is a batch build
			if (build_config.isBatchBuild()) {
				// this is a batch build
				const builder = new yabs.BatchBuilder(this._logger, build_config, build_params);
				await builder.build();
			}	
			else {
				// this is a normal build
				const builder = new yabs.Builder(this._logger, build_config, build_params);
				await builder.build();
			}
		}
		catch(e) {
			this._logger.error(e);
			this._logger.out('\nBuild aborted.');
		}
		// print out final newline
		this._logger.endl();
	}
};

(new yabs.Application()).main(process.argv); // run yabs.js
