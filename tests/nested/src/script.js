/* a simple script that toggles image rotation on click */

const $spiral = document.getElementById('spiral');

$spiral.addEventListener('click', () => {
	$spiral.classList.toggle('rotate');
});
