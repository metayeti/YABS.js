/**
 * yabs.js minimal testcase
 */

(function() {
	// get cat and dog objects
	const $cat = document.getElementById('cat');
	const $dog = document.getElementById('dog');

	// run a simple animation
	function updateAnim(angle) {
		const obj_size = 128;
		const obj_halfsize = 64;
		const center = [
			Math.floor(window.innerWidth / 2),
			Math.floor(window.innerHeight / 2)
		];
		const radius = 150;
		// calculate cat position
		const cat_x = center[0] - obj_halfsize + Math.cos(angle) * radius;
		const cat_y = center[1] - obj_halfsize + Math.sin(angle) * radius;
		// calculate dog position
		const dog_x = center[0] - obj_halfsize + Math.cos(angle + Math.PI) * radius;
		const dog_y = center[1] - obj_halfsize + Math.sin(angle + Math.PI) * radius;
		// update cat position
		$cat.style.left = cat_x + 'px';
		$cat.style.top = cat_y + 'px';
		// update dog position
		$dog.style.left = dog_x + 'px';
		$dog.style.top = dog_y + 'px';
	}

	let angle = 0;
	setInterval(() => {
		angle += 0.005;
		updateAnim(angle);
	}, 15);
}());
