{
	const $content = document.getElementById('content');
	const $p = document.createElement('p');
	$p.innerHTML = 'This is output from included script at <span class="highlight">include\\include_b.js</span>!';
	$content.appendChild($p);
}
