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
	VERSION: '0.0.1',
	// build output directory
	OUTPUT: 'build'
};

const YABS = (function() {

	// detect whether output is a terminal or not
	// (so color codes can be stripped for redirected output)
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
			process.stdout.write(OUTPUT_FG_RED + '\\!/ ' + OUTPUT_RESET + message + '\n');
		},
		header: function() {
			log.out('  __ __ _____ _____ _____     _');
			log.out(' |  |  |  _  |  _  |   __|   |_|___');
			log.out('  \\_   |     |  _ -|__   |_  | |_ -|');
			log.out('   /__/|__|__|_____|_____|_|_| |___|');
			log.out('                           |___|');
			//log.endl();
			//log.out(' '.repeat(31 - BUILDSYS_GLOBALS.VERSION.length) + '[ v' + BUILDSYS_GLOBALS.VERSION + ' ]');
			log.out(' ( Yet');
			log.out('   Another' + ' '.repeat(28 - BUILDSYS_GLOBALS.VERSION.length) + '[ v' + BUILDSYS_GLOBALS.VERSION + ' ]');
			log.out('   Build');
			log.out('   System ).js   (c) 2023 Danijel Durakovic');
			log.endl();
			log.out('  - - - - - - - - - - - - - - - - - - - - -');
			log.endl();
		},
		help: function() {
		}
	};

	return {
		run: function(argv) {
			log.header();
			log.error('Missing input file!');
			log.endl();
			log.out('Use --help to display help.');
		}
	};
}());

YABS.run(process.argv);
