{
	const $content = document.getElementById('content');
	const $p = document.createElement('p');
	$p.innerHTML = 'Output from <span class="highlight">included_a.js</span>!';
	$content.appendChild($p);
}
