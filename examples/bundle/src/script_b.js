{
	const $content = document.getElementById('content');
	const $p = document.createElement('p');
	$p.innerHTML = 'Output from <span class="highlight">script_b.js</span>!';
	$content.appendChild($p);
}
