const script = document.getElementsByTagName('script')[0];
const src_split = script.src.split('/');
const parsed_src = src_split.at(-2) + '/' + src_split.at(-1);
const $p = document.createElement('p');
$p.innerHTML = `If this text shows, the script <span class="highlight">${parsed_src}</span> has loaded successfully.`;
document.getElementById('content').appendChild($p);
