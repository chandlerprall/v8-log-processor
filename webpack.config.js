const glob = require('glob');
const path = require('path');

const moduleAliases = glob.sync(
	'**/*.@(js|css)',
	{realpath: true, cwd: path.join(__dirname, 'src')}
).reduce(
	(moduleAliases, filepath) => {
		const filename = path.basename(filepath, '.js');
		moduleAliases[filename] = filepath;
		return moduleAliases;
	},
	{}
);

module.exports = [
	{
		entry: 'AppEntry',
		target: 'electron',
		output: {
			path: 'build',
			filename: 'electron-main.js'
		},
		resolve: {
			alias: moduleAliases
		},
		node: {
			console: false,
			global: false,
			process: false,
			Buffer: false,
			__filename: false,
			__dirname: false,
			setImmediate: false
		}
	},
	{
		entry: 'GuiEntry',
		target: 'electron-renderer',
		output: {
			path: 'build',
			filename: 'electron-gui.js'
		},
		resolve: {
			alias: moduleAliases
		},
		module: {
			rules: [
				{
					test: /\.js$/,
					exclude: /node_modules/,
					loader: path.join(__dirname, 'scripts', 'jsx-style-imports-loader')
				},
				{
					test: /\.js$/,
					exclude: /node_modules\/[^(insula)]\/]/,
					loader: 'babel-loader',
					query: {
						babelrc: false,
						presets: ['react'],
						plugins: ['jsx-display-if', 'encapsulate-jsx', 'transform-object-rest-spread']
					}
				},
				{
					test: /\.css$/,
					loaders: ['style-loader', 'css-loader', 'css-encapsulation-loader']
				}
			]
		}
	}
];