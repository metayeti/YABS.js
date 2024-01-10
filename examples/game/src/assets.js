/*
 * YABS.js game example
 * This example implements a simple HTML5 game.
 */

// assets.js | Instantiates the asset loader and Lists game assets to be loaded. Also defines custom asset handlers.

/*jshint esversion:9*/

//
// asset loader
//
const loader = new myst.AssetLoader();

//
// asset lists
//
const assets = {
	// preload assets, required for loadscreen
	preload: {
		graphics: {
			gamefont: 'data/gfx/gamefont.png'
		}
	},
	// main game assets
	game: {
		graphics: {
			gamefont: 'data/gfx/gamefont.png',
			player: 'data/gfx/player.png'
		},
		music: {
			//gametrack: 'data/music/game.mp3'
		}
	}
};

//
// custom asset handlers
//
loader.handler.sfx = (filenames, ready) => {
	const sfx = new Howl({
		src: filenames,
		autoplay: false,
		loop: false,
		volume: 1,
		onload: () => ready(sfx),
		onloaderror: ready
	});
};

loader.handler.music = (filenames, ready) => {
	const sfx = new Howl({
		src: filenames,
		autoplay: false,
		loop: true,
		volume: 1,
		onload: () => ready(sfx),
		onloaderror: ready
	});
};