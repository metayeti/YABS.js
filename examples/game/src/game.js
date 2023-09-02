/*
 * YABS.js game example
 * This example implements a simple HTML5 game.
 */

/*jshint esversion:9*/

/**
 * @author Danijel Durakovic
 * @version 1.0.0
 */

const mainState  = new myst.State();

mainState.draw = function() {
	this.surface.clear();
	this.paint.rectFill(10, 10, 20, 20, 'red');
};

mainState.update = function() {
};

//
// game object
//
const game = new myst.Game({
	canvasId: 'game',
	state: mainState,
	viewMode: 'center',
	simpleLoop: true
});

// run game on window load
window.addEventListener('load', game.run);
