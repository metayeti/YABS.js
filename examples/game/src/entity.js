/*
 * YABS.js game example
 * This example implements a simple HTML5 game.
 */

// entity.js | Implements the Entity class and defines all game entities.

/*jshint esversion:9*/

//
//  Entity base class
//
class Entity {
	constructor() {
		this.x = 0;
		this.y = 0;
		this.bbox = 0;
	}
	draw() {
		console.log('draw from entity!');
	}
}

//
//  Player class
//
class Player extends Entity {
	constructor() {
		super();
	}
	draw() {
		console.log('draw from player!');
	}	
}
