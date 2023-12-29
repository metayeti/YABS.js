//
// utilty
//
function waitUntil(conditionf) {
	return new Promise((resolve, reject) => {
		(function waitForIt() {
			if (conditionf()) {
				return resolve();
			}
			setTimeout(waitForIt, 30); // poll until condition met
		}());
	});
}

function getBMPTextWidth(font, text) {
	let i, ci, acc = 0;
	for (i = 0; i < text.length; ++i) {
		ci = text.charCodeAt(i) - 32;
		acc += font.widths[ci] + font.spacing;
	}
	return acc;
}