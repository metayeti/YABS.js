/*
 * YABS.js game example
 * This example implements a simple HTML5 game.
 */

// player.js | Player

/*jshint esversion:9*/

class Player extends Entity {
	constructor() {
		this.gfx = assets.game.player;
	}
}