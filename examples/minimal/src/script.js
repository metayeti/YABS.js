const $content = document.getElementById('content');
const $p = document.createElement('p');
const scriptSrc = document.getElementsByTagName('script')[0].getAttribute('src');
$p.innerHTML = `If this text shows, the script <span class="highlight">${scriptSrc}</span> has loaded successfully.`;
$content.appendChild($p);