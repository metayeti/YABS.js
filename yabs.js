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

yabs.version = '0.0.3'; // YABS.js version

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
	const list = [];
	if (!yabs.util.exists(source_path)) {
		throw `Could not locate: ${source_path}`;
	}
	const dir_listing = fs.readdirSync(source_path);
	dir_listing.forEach(item => {
		//TODO
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
			`${this._OUTPUT_RESET} ${message}\n`
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
		this.out('- - - - - - - - - - - - - - - - - - - - - - -');
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
	 */
	constructor(source_file) {
		const file_data = fs.readFileSync(source_file);
		const json_data = JSON.parse(file_data);

		///debug
		//process.stdout.write(file_data);
		//process.stdout.write(JSON.stringify(json_data));
		///~debug
	}
	/**
	 * Returns whether or not this is a batch build.
	 * 
	 * @returns {bool}
	 */
	isBatchBuild() {
		return this._isBatch;
	}
};

////////////////////////////////////////////////////////////////////////////////
//
//  Builder
//
////////////////////////////////////////////////////////////////////////////////

yabs.Builder = class {
};

////////////////////////////////////////////////////////////////////////////////
//
//  BatchBuilder
//
////////////////////////////////////////////////////////////////////////////////

yabs.BatchBuilder = class {
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
		// print out header
		this._log.header();
		try {
			// figure out what we're building first
			let buildCfg = null;
			if (!argv[2]) { // parametress run
				if (yabs.util.exists(yabs.DEFAULT_BUILD_FILE)) {
					buildCfg = new yabs.BuildConfig(yabs.DEFAULT_BUILD_FILE);
				}
				else if (yabs.util.exists(yabs.DEFAULT_BUILD_ALL_FILE)) {
					buildCfg = new yabs.BuildConfig(yabs.DEFAULT_BUILD_ALL_FILE);
				}
			}
			else {
				// parse command line parameters
				const build_instr_file = argv[2];
				if (yabs.util.exists(build_instr_file)) {
					buildCfg = new yabs.BuildConfig(build_instr_file);
				}
				else {
					throw 'Cannot find file: ' + build_instr_file;
				}
			}
			// make sure we have build configuration
			if (!buildCfg) {
				throw 'Missing input file!';
			}
			// check if this is a batch build
			if (buildCfg.isBatchBuild()) {
				// this is a batch build
				const batchBuild = new yabs.BatchBuilder();
				// TODO
			}	
			else {
				// this is a normal build
				const build = new yabs.Builder();
				// TODO
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