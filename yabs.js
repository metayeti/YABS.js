/*
 *   __ __ _____ _____ _____     _
 *  |  |  |  _  |  _  |   __|   |_|___
 *   \_   |     |  _ -|__   |_  | |_ -|
 *    /__/|__|__|_____|_____|_|_| |___|
 *                            |___|
 *
 *  Yet-Another-Build-System.js
 *  https://github.com/pulzed/YABS.js
 *  ---
 *  (c) 2023 Danijel Durakovic
 *  MIT License
 *
 */

/*jshint esversion:6*/

/**
 * @file yabs.js
 * @author Danijel Durakovic
 */

const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { EOL } = require('os');

/**
 * yabs.js namespace
 * @namespace
 */
const yabs = {};

////////////////////////////////////////////////////////////////////////////////
//
//  Globals
//
////////////////////////////////////////////////////////////////////////////////

yabs.version = '0.0.0'; // YABS.js version

// constants
yabs.DEFAULT_BUILD_FILE = 'build.json';
yabs.DEFAULT_BUILD_ALL_FILE = 'build_all.json';

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
 * Recursively generates a list of files based on given source and destination
 * paths; only adds source items that are newer than destination files.
 * 
 * @function generateFileListRecursively
 * @memberof yabs.util
 * @instance
 * 
 * @param {string} source_path
 * @param {string} destination_path
 */
yabs.util.generateFileListRecursively = function(source_path, destination_path, depth = -1) {
	let list = [];
	if (!yabs.util.exists(source_path)) {
		throw `Could not locate: ${source_path}`;
	}
	const dir_listing = fs.readdirSync(source_path);
	dir_listing.forEach(item => {
		const nested_source_path = path.join(source_path, item);
		const nested_destination_path = path.join(destination_path, item);
		const is_source_directory = yabs.util.isDirectory(nested_source_path);
		if (is_source_directory) { // this is a directory
			if (depth === 0) {
				return list;
			}
			// continue recursive descent
			list = list.concat(util.generateFileListRecursively(nested_source_path, nested_destination_path, depth));
		}
		else { // this is a file
			let include_file = false;
			if (yabs.util.exists(nested_destination_path)) { // destination file exists
				const time_modified_source = (Date.now() - yabs.util.getModifiedTime(nested_source_path));
				const time_modified_destination = (Date.now() - yabs.util.getModifiedTime(nested_destination_path));
				if ((time_modified_source - time_modified_destination) < -1000) {
					// source file is newer than destination
					include_file = true;
				}
			}
			else { // destination file does not exist
				include_file = true;
			}
			if (include_file) {
				list.push({
					source: nested_source_path,
					destination: nested_destination_path
				});
			}
		}
	});
	// return the compiled list
	return list;
};

////////////////////////////////////////////////////////////////////////////////
//
//  Logger
//
////////////////////////////////////////////////////////////////////////////////

yabs.Logger = class {
	/**
	 * Logger constructor.
	 */
	constructor() {
		// detect whether output is a terminal or not
		// (so we can strip color code output if output is redirected)
		const is_tty = process.stdout.isTTY;
		// output constants and color codes
		this._OUTPUT_RESET     = (is_tty) ? '\x1b[0m'  : '';
		this._OUTPUT_BRIGHT    = (is_tty) ? '\x1b[1m'  : '';
		this._OUTPUT_FG_RED    = (is_tty) ? '\x1b[31m' : '';
		this._OUTPUT_FG_GREEN  = (is_tty) ? '\x1b[32m' : '';
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
			`${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_RED}(` +
			`${this._OUTPUT_RESET}!` +
			`${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_RED}) Error: ` +
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
			`${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_GREEN}(` +
			`${this._OUTPUT_RESET}!` +
			`${this._OUTPUT_BRIGHT}${this._OUTPUT_FG_GREEN}) Success: ` +
			`${this._OUTPUT_RESET}${message}\n`
		);	
	}
	/**
	 * Prints the YABS.js header.
	 */
	header() {
		this.out('  __ __ _____ _____ _____     _');
		this.out(' |  |  |  _  |  _  |   __|   |_|___');
		this.out('  \\_   |     |  _ -|__   |_  | |_ -|');
		this.out('   /__/|__|__|_____|_____|_|_| |___|');
		this.out('                           |___|');
		this.out(' Yet');
		this.out(' Another' + ' '.repeat(32 - yabs.version.length) + '[ v' + yabs.version + ' ]');
		this.out(' Build      https://github.com/pulzed/yabs.js');
		this.out(' System.js         (c) 2023 Danijel Durakovic');
		this.endl();
		this.out('---------------------------------------------');
		this.endl();
	}
};

////////////////////////////////////////////////////////////////////////////////
//
//  Build configuration
//
////////////////////////////////////////////////////////////////////////////////

yabs.BuildConfig = class {
	/**
	 * BuildConfig constructor.
	 * 
	 * @param {string} source_file - Build instructions JSON file.
	 */
	constructor(source_file) {
		// parse source JSON
		const file_data = fs.readFileSync(source_file);
		const json_data = JSON.parse(file_data);
		// check if this is a batch build
		if (json_data.hasOwnProperty('batch_build')) {
			this._is_batch = true;
			if (json_data.batch_build instanceof Array) {
				if (!json_data.batch_build.every(element => typeof element === 'string')) {
					throw 'Every element in "batch_build" entry listing has to be a String type!';
				}
				this._batch_listing = json_data.batch_build;
			}
			if (!this._batch_listing) {
				this._batch_listing = [];
			}	
			return; // since this is a batch build, we are all done here
		}
		// extract source_dir
		if (!json_data.hasOwnProperty('source_dir')) {
			throw 'Build instructions file is missing the source_dir entry!';
		}
		this._source_dir = json_data.source_dir;
		// extract destination_dir
		if (!json_data.hasOwnProperty('destination_dir')) {
			throw 'Build instructions file is missing the destination_dir entry!';
		}
		this._destination_dir = json_data.destination_dir;
		// extract html listing
		if (json_data.hasOwnProperty('html')) {
			if (json_data.html instanceof Array) {
				if (!json_data.html.every(element => typeof element === 'string')) {
					throw 'Every element in "html" entry listing has to be a String type!';
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
						if (source_entry.hasOwnProperty('file')) {
							if (typeof source_entry.file === 'string') {
								source_entry_object.file = source_entry.file;
							}
						}
						if (source_entry.hasOwnProperty('header')) {
							if (source_entry.header instanceof Array) {
								if (!source_entry.header.every(element => typeof element === 'string')) {
									throw 'Every element in "sources" entry "header" listing has to be a String type!';
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
											throw 'Every element in "headers" listing has to be a String type!';
										}
										source_entry_object.header = header_ref;
									}
									else if (typeof header_ref === 'string') {
										source_entry_object.header = [ header_ref ];
									}
								}
							}
						}
						if (source_entry_object.file) {
							this._sources_listing.push(source_entry_object);
						}
					}
				});
			}
			else {
				throw 'The "sources" entry in build instructions file has to be an Array type!';
			}
		}
		if (!this._sources_listing) {
			this._sources_listing = [];
		}
		// extract files listing
		if (json_data.hasOwnProperty('files')) {
			if (json_data.files instanceof Array) {
				if (!json_data.files.every(element => typeof element === 'string')) {
					throw 'Every element in "files" entry listing has to be a String type!';
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
		// extract variables
		this._variables = {};
		if (json_data.hasOwnProperty('variables')) {
			for (const variable_key in json_data.variables) {
				const variable_data = json_data.variables[variable_key];
				if (variable_data instanceof Array) {
					if (!variable_data.every(element => typeof element === 'string')) {
						throw 'Every element in "variables" entry listing has to be a String type!';
					}
					this._variables[variable_key] = variable_data;
				}
			}
		}
		///debug
		console.log('source_dir:', this._source_dir);
		console.log('destination_dir:', this._destination_dir);
		console.log('html_listing:', this._html_listing);
		console.log('sources_listing:', this._sources_listing);
		console.log('files_listing:', this._files_listing);
		console.log('variables:', this._variables);
		///debug
			
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
	 * Returns the variables collection.
	 * 
	 * @returns {object}
	 */
	getVariables() {
		return this._variables;
	}
};

////////////////////////////////////////////////////////////////////////////////
//
//  Builder
//
////////////////////////////////////////////////////////////////////////////////

yabs.Builder = class {
	/**
	 * Builder constructor.
	 * 
	 * @param {object} build_config
	 * @param {object} build_params
	 */
	constructor(build_config, build_params) {
	}

	/**
	 * Start the build.
	 */
	build() {
	}
};

////////////////////////////////////////////////////////////////////////////////
//
//  BatchBuilder
//
////////////////////////////////////////////////////////////////////////////////

yabs.BatchBuilder = class {
	/**
	 * BatchBuilder constructor.
	 * 
	 * @param {object} build_config
	 * @param {object} build_params
	 */
	constructor(build_config, build_params) {
	}

	/**
	 * Start the build.
	 */
	build() {
	}
};

////////////////////////////////////////////////////////////////////////////////
//
//  Application
//
////////////////////////////////////////////////////////////////////////////////

yabs.App = class {
	/**
	 * App constructor.
	 */
	constructor() {
		this._log = new yabs.Logger();
	}
	/**
	 * Program entry point.
	 */
	main(argv) {
		// parse build parameters
		const build_params = {
			option: [], // --option parameters
			variable: [], // -variable parameters (used for preprocessor)
			free: [] // freestanding parameters (should only contain a single item with the build instructions file)
		};
		argv.slice(2).forEach(str_value => {
			if (str_value.startsWith('--')) { // this is an --option parameter
				build_params.option.push(str_value.slice(2));
			}
			else if (str_value.startsWith('-')) { // this is a -variable parameter
				build_params.variable.push(str_value.slice(1));
			}
			else { // this is a freestanding parameter
				build_params.free.push(str_value);
			}
		});

		console.log('option parameters:', build_params.option);
		console.log('variable parameters:', build_params.variable);
		console.log('freestanding parameters:', build_params.free);
this._log.success('Build finished!');
		// print out header
		this._log.header();
		try {
			// figure out what we're building first
			let build_config = null;
			if (build_params.free.length === 0) { // parametress run
				if (yabs.util.exists(yabs.DEFAULT_BUILD_FILE)) {
					build_config = new yabs.BuildConfig(yabs.DEFAULT_BUILD_FILE);
				}
				else if (yabs.util.exists(yabs.DEFAULT_BUILD_ALL_FILE)) {
					build_config = new yabs.BuildConfig(yabs.DEFAULT_BUILD_ALL_FILE);
				}
			}
			else {
				const build_instr_file = build_params.free[0];
				if (yabs.util.exists(build_instr_file)) {
					build_config = new yabs.BuildConfig(build_instr_file);
				}
				else {
					throw 'Cannot find file: ' + build_instr_file;
				}
			}
			// make sure we have build configuration
			if (!build_config) {
				throw 'Missing input file!';
			}
			// check if this is a batch build
			if (build_config.isBatchBuild()) {
				// this is a batch build
				(new yabs.BatchBuilder(build_config, build_params)).build();
			}	
			else {
				// this is a normal build
				(new yabs.Builder(build_config, build_params)).build();
			}
		}
		catch(e) {
			this._log.error(e);
			this._log.out('\nBuild aborted.');
		}
		// print ouf final newline
		this._log.endl();
	}
};

(new yabs.App()).main(process.argv); // run yabs.js