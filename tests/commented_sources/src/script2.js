{
	const $p = document.createElement('p');
	$p.innerHTML = 'Output from <span class="highlight">script2</span>. This script should be ignored.';
	document.getElementById('content').appendChild($p);
}

