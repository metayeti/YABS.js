const $content = document.getElementById('content');
const $p = document.createElement('p');
$p.innerHTML = 'If this text shows, the script <span class="highlight">src&sol;script.js</span> has loaded successfully.';
$content.appendChild($p);