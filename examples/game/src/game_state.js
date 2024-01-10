/*
 * YABS.js game example
 * This example implements a simple HTML5 game.
 */

// game_state.js | Main game state.

/*jshint esversion:9*/

//
// main state
//
const gameState  = new myst.State();

gameState.init = function() {
	// graphics
	//this.gfx_master = assets.game.master;

	this.world = null;

	this.camera = [0, 0];
};

gameState.enter = function() {
	this.startNewGame();
	// play game music as we enter game
	//assets.game.music.gametrack.play();
};

gameState.draw = function() {
	this.surface.clear();
};

gameState.update = function() {
};

gameState.startNewGame = function() {
	this.world = new World();
};