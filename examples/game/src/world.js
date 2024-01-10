/*
 * YABS.js game example
 * This example implements a simple HTML5 game.
 */

// world.js | Implements the World class.

/*jshint esversion:9*/

class World {
	constructor() {
		// level data
		this.map = null;
		// entities
		this.entities = [];
	}

	/**
	 * Loads a map into memory.
	 * @param {object} mapData Tiled-exported JSON data.
	 */
	loadMap(mapData) {
		// add the player entity
		this.entities.push(new Player());
	}
}