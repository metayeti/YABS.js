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
	// we've entered the game state. we need to prepare the game state first
	// begin by creating the game world
	this.world = new World();
	// TODO: create the game camera
	// TODO: center the camera on the player
	// play game music as we enter game, this will just continuously loop
	assets.game.music.gametrack.seek(0.05); // makes cross-fade effect at start a little bit less annoying
	assets.game.music.gametrack.play();
	// we're all good now!
};

gameState.draw = function() {
	this.surface.clear();
};

gameState.update = function() {
};