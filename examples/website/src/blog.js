const $content = document.getElementById('content');
[1, 3, 3].forEach(i => {
	const $p = document.createElement('p');
	$p.innerText = `(Blog post ${i})`;
	content.appendChild($p);
});
