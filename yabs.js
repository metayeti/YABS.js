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

const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { EOL } = require('os');

const BUILDSYS_GLOBALS = {
	// build system version
	VERSION: '0.0.2',
	// build output directory
	OUTPUT: 'build'
};

const YABS = (function() {
	// detect whether output is a terminal or not
	// (so color codes can be stripped when output is redirected)
	const IS_TTY = process.stdout.isTTY;

	// logger output constants
	const OUTPUT_RESET    = (IS_TTY) ? '\x1b[0m'  : '';
	const OUTPUT_BRIGHT   = (IS_TTY) ? '\x1b[1m'  : '';
	const OUTPUT_FG_BLACK = (IS_TTY) ? '\x1b[30m' : '';
	const OUTPUT_FG_GREEN = (IS_TTY) ? '\x1b[32m' : '';
	const OUTPUT_FG_RED   = (IS_TTY) ? '\x1b[31m' : '';

	const log = {
		out: function(msg) {
			process.stdout.write(msg + '\n');
		},
		endl: function() {
			process.stdout.write('\n');
		},
		error: function(message) {
			process.stdout.write(
				OUTPUT_FG_RED + '(' +
				OUTPUT_RESET + '!' + 
				OUTPUT_FG_RED + ') Error: ' +
				OUTPUT_RESET + message + '\n');
		},
		header: function() {
			log.out('  __ __ _____ _____ _____     _');
			log.out(' |  |  |  _  |  _  |   __|   |_|___');
			log.out('  \\_   |     |  _ -|__   |_  | |_ -|');
			log.out('   /__/|__|__|_____|_____|_|_| |___|');
			log.out('                           |___|');
			//log.endl();
			//log.out(' '.repeat(31 - BUILDSYS_GLOBALS.VERSION.length) + '[ v' + BUILDSYS_GLOBALS.VERSION + ' ]');
			log.out('  Yet');
			log.out('  Another' + ' '.repeat(32 - BUILDSYS_GLOBALS.VERSION.length) + '[ v' + BUILDSYS_GLOBALS.VERSION + ' ]');
			log.out('  Build      https://github.com/pulzed/yabs.js');
			log.out('  System.js         (c) 2023 Danijel Durakovic');
			log.endl();
			log.out(' - - - - - - - - - - - - - - - - - - - - - - -');
			log.endl();
		},
		help: function() {
		}
	};

	// build configuration class
	const BuildConfig = class {
		constructor(buildInstructionsRawData) {
			this._buildInstructions = JSON.Parse(buildInstructionsRawData || '{}');
		}
	}

	// util functions and features
	const util = {
		fileExists: function(filename) {
			return fs.existsSync(filename);
		},
		generateFileListRecursively: function(source_path, destination_path, file_list, depth = -1) {
			let list = [];
			if (!util.fileExists(source_path)) {
				throw 'Could not locate "' + source_path + '"';
			}
			const dirs = fs.readdirSync(source_path);
			dirs.forEach(item => {
				const nested_source_path = path.join(source_path, item);
				const nested_destination_path = path.join(destination_path, item);
				const is_directory = fs.lstatSync(nested_source_path).isDirectory();
				if (is_directory) {
					if (depth == 0) {
						return list;
					}
					list = list.concat(util.generateFileListRecursively(nested_source_path, nested_destination_path, file_list, depth - 1));
				}
				else {
					let include_file = false;
					if (file_list instanceof Array) {
						// we have a file list, check for matches
						if (file_list.indexOf(nested_source_path) === -1) {
							// we've not found a match, we can skip current item
							return;
						}
					}
					if (util.fileExists(nested_destination_path)) {
						// this file already exist; check if source is newer
						const stats_source = fs.statSync(nested_source_path);
						const stats_destination = fs.statSync(nested_destination_path);
						const time_modified_source = (Date.now() - stats_source.mtime);
						const time_modified_destination = (Date.now() - stats_destination.mtime);
						if ((time_modified_source - time_modified_destination) < -1000) {
							// source file is newer than destination, add it to list
							include_file = true;
						}
					}
					else {
						// this file does not exist, add it to list
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
			return list;
		}
	};

	return {
		run: function(argv) {
			// display the header first
			log.header();
			// check if the very first parameter is significant
			const first_param = argv[2];
			if (first_param) {
				// TODO make some kind of parameter tokenizer
				const first_param_norm = first_param.toString().toLowerCase();
				if (first_param_norm === '--help' || first_param_norm === '-h') {
					log.out('TODO display help');
				}
				else {
					log.error('Unknown parameter: ' + first_param_norm);
				}
			}
			else {
				log.error('Missing input file!');
				log.endl();
				log.out('Use --help for more information');
			}
			log.endl();
		}
	};
}());

YABS.run(process.argv);
