const fs = require('fs');
const path = require('path');

function safeString(string) {
	return string.replace(/\W/g, '_');
}

module.exports = function(source) {
	const callback = this.async();

	const targetCssFilePath = path.join(this.context, path.basename(this.resourcePath, path.extname(this.resourcePath))) + '.css';

	if (fs.existsSync(targetCssFilePath)) {
		callback(
			null,
			`import ${safeString(targetCssFilePath)} from './${path.relative(this.context, targetCssFilePath)}';
${source}`
		);
	} else {
		callback(null, source);
	}
};
