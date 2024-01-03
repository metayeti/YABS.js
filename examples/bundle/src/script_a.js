{
	const $content = document.getElementById('content');
	const $p = document.createElement('p');
	$p.innerHTML = 'Output from <span class="highlight">script_a</span>!';
	$content.appendChild($p);
}
