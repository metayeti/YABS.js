/*
 * YABS.js game example
 * This example implements a simple HTML5 game.
 */

/*jshint esversion:9*/

/**
 * @author Danijel Durakovic
 * @version 1.0.0
 */

//
// utilty
//
function waitUntil(conditionf) {
	return new Promise((resolve, reject) => {
		(function waitForIt() {
			if (conditionf()) {
				return resolve();
			}
			setTimeout(waitForIt, 30); // poll until condition met
		}());
	});
}

function getBMPTextWidth(font, text) {
	let i, ci, acc = 0;
	for (i = 0; i < text.length; ++i) {
		ci = text.charCodeAt(i) - 32;
		acc += font.widths[ci] + font.spacing;
	}
	return acc;
}

//
// load state
//

const loadState = new myst.State();

loadState.init = function() {
	function EmulatedConsole() {
		this.surface = new myst.Surface({ width: 420, height: 340 });
		this.textBuffer = [''];
		this.textQueue = [];
		this.currentLine = 0;
		this.cursor = {
			position: [0, 0], // position of the cursor
			show: true // alternates on and off for blinking
		};
		const cursorBlinkTimer = new myst.Timer(15);
		const textFeedTimer = new myst.Timer(3);
		this.redraw = function() {
			// clear the surface before redrawing
			this.surface.clear();
			// draw the text
			for (let i = 0; i < this.textBuffer.length; ++i) {
				this.surface.render.bmptext(game.font, this.textBuffer[i], 10, 10 + 25 * i);
			}
			// draw the cursor
			if (this.cursor.show) {
				const cursorXOffset = getBMPTextWidth(game.font, this.textBuffer[this.currentLine]);
				this.surface.render.rectFill(10 + cursorXOffset, 10 + 25 * this.currentLine, 9, 16, '#fff');
			}
		};
		this.update = function() {
			let stateChanged = false;
			// blink the cursor
			if (cursorBlinkTimer.run()) {
				this.cursor.show = !this.cursor.show;
				stateChanged = true;
			}
			// process the text buffer
			const textQueueSize = this.textQueue.length;
			if (textQueueSize > 0 && textFeedTimer.run()) {
				const nextChar = this.textQueue.shift();
				if (nextChar === '\n') {
					this.textBuffer.push('');
					this.currentLine += 1;
				}
				else {
					this.textBuffer[this.currentLine] += nextChar;
					this.cursor.show = true
					cursorBlinkTimer.reset();
				}
				stateChanged = true;
			}
			// issue a redraw when the state has changed
			if (stateChanged) {
				this.redraw();
			}
		};
		this.pushText = function(text) {
			this.textQueue.push(...Array.from(text));
		};
		this.isQueueEmpty = function() {
			return this.textQueue.length === 0;
		};
	}
	this.emulatedConsole = new EmulatedConsole();
	this.emulatedConsole.redraw();

	// disallow input until everything is loaded and 
	this.inputAllowed = false;
};

loadState.draw = function() {
	this.surface.clear();
	// draw the emulated console
	this.paint.surface(this.emulatedConsole.surface, 0, 0);
	// draw the cursor
	this.paint.bmptext(game.font, 'v1.0.0', 414, 316, 0, 2);
};

loadState.update = function() {
	this.emulatedConsole.update();
	if (this.inputAllowed) {
		let KeyEvent;
		while (keyEvent = keyHandler.pollEvent()) {
			if (keyEvent.type === keyHandler.KEYDOWN) {
				// proceed to main state
				game.setState(mainState);
			}
		}
	}
};

loadState.doIntro = function() {
	this.emulatedConsole.pushText('DOS/5GW protected mode runtime\n');
	this.emulatedConsole.pushText('---\n');
	this.emulatedConsole.pushText('NOW LOADING GAME...');
	// wait until the intro finishes
	return waitUntil(() => this.emulatedConsole.isQueueEmpty());
};

loadState.doOutro = function() {
	this.emulatedConsole.pushText('\n(ok) All loaded! ^_^\n\n');
	this.emulatedConsole.pushText('Press any key...');
	// wait until the outro finishes
	return waitUntil(() => this.emulatedConsole.isQueueEmpty());
};

loadState.allowInput = function() {
	this.inputAllowed = true;
	keyHandler.clear(); // clear key buffer
};

//
// main state
//
const mainState  = new myst.State();

mainState.init = function() {
};

mainState.draw = function() {
	this.surface.clear();
};

mainState.update = function() {
};

//
// game object
//
const game = new myst.Game({
	canvasId: 'game',
	state: loadState,
	viewMode: 'center'
});

game.createFont = function() {
	// create a non-monospaced font by specifying widths for characters
	// it is safe to skip characters that have the same width as the
	// default character width
	this.font = new myst.Font({
		graphics: assetList.preload.graphics.gamefont, // font graphics
		size: [12, 18], // default character width and height
		spacing: 3, // font spacing
		widths: { // character widths, this can either be a key-value map or an ordered array
			' ': 10,
			'!': 4,
			'"': 10,
			'#': 10,
			'$': 10,
			'%': 12,
			'&': 12,
			'\'': 4,
			'(': 6,
			')': 6,
			'*': 8,
			'+': 10,
			',': 4,
			'-': 8,
			'.': 4,
			'/': 8,
			'0': 10,
			'1': 6,
			'2': 10,
			'3': 10,
			'4': 10,
			'5': 10,
			'5': 10,
			'6': 10,
			'7': 10,
			'8': 10,
			'9': 10,
			':': 4,
			';': 4,
			'<': 8,
			'=': 10,
			'>': 8,
			'?': 8,
			'@': 10,
			'A': 10,
			'B': 10,
			'C': 10,
			'D': 10,
			'E': 8,
			'F': 8,
			'G': 10,
			'H': 10,
			'I': 2,
			'J': 8,
			'K': 10,
			'L': 8,
			'M': 12,
			'N': 10,
			'O': 10,
			'P': 10,
			'Q': 10,
			'R': 10,
			'S': 10,
			'T': 10,
			'U': 10,
			'V': 10,
			'W': 12,
			'X': 10,
			'Y': 10,
			'Z': 10,
			'[': 8,
			'\\': 8,
			']': 8,
			'^': 10,
			'_': 10,
			'`': 6,
			'a': 8,
			'b': 8,
			'c': 8,
			'd': 8,
			'e': 8,
			'f': 8,
			'g': 8,
			'h': 8,
			'i': 2,
			'j': 4,
			'k': 8,
			'l': 2,
			'm': 10,
			'n': 8,
			'o': 8,
			'p': 8,
			'q': 8,
			'r': 6,
			's': 8,
			't': 6,
			'u': 8,
			'v': 8,
			'w': 10,
			'x': 10,
			'y': 8,
			'z': 8,
			'{': 8,
			'|': 2,
			'}': 8,
			'~': 10
		}
	});
};

//
// asset lists
//
const assetList = {
	// preload assets, required for loadscreen
	preload: {
		graphics: {
			gamefont: 'data/gfx/gamefont.png'
		}
	},
	// main game assets
	game: {
		graphics: {
			gamefont: 'data/gfx/gamefont.png'
		}
	}
};

// asset loader
const loader = new myst.AssetLoader();

// key handler
const keyHandler = new myst.KeyInput();

// run game on window load
window.addEventListener('load', function() {
	// load the preload assets
	assetList.preload = loader.load({
		assets: assetList.preload,
		done: function() {
			// create the game font
			game.createFont();
			// we have all assets required for the loadscreen
			// run the game
			game.run();
			// play the loadscreen intro and wait until it's done
			loadState.doIntro().then(() => {
				// add a slight delay just for effect
				const delay = 1500;
				setTimeout(() => {
					// start loading the game assets
					assetList.game = loader.load({
						assets: assetList.game,
						done: function() {
							// play the loadscreen outro
							loadState.doOutro().then(() => {
								// all done loading, allow input from the loadscreen
								loadState.allowInput();
							});
						}
					});
				}, delay);
			});
		}
	});
});
