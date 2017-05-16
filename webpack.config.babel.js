
import { resolve } from 'path';
import webpack from 'webpack';

const { env } = process;

env.NODE_ENV = env.NODE_ENV || 'development';
const port = env.PORT || 3000;

const PROJECT_PATH = __dirname;
const inProject = (...args) => resolve(PROJECT_PATH, ...args);
const inSrc = inProject.bind(null, 'src');
const inTest = inProject.bind(null, 'test');
const srcDir = inSrc();
const testDir = inTest();

export default (configEnv) => {
	const config = {
		output: {
			library: 'TinyQiniu',
			libraryTarget: 'umd',
		},
		module: {
			rules: [
				{
					test: /\.jsx?$/,
					include: [srcDir, testDir],
					loader: 'babel',
					options: {
						presets: [
							['es2015', { modules: false }],
							'stage-0',
						],
						plugins: [
							'add-module-exports',
						],
						cacheDirectory: true,
						babelrc: false,
					},
				},
			],
			noParse: [
				inProject('node_modules', 'babel-core', 'browser.min.js')
			],
		},
		plugins: [
			new webpack.DefinePlugin({
				'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV),
			}),
		],
		resolve: {
			modules: [srcDir, 'node_modules'],
			extensions: ['.js'],
		},
		devtool: 'source-map',
		devServer: {
			contentBase: './test',
			port,
			stats: {
				chunkModules: false,
				colors: true,
			},
		},
	};

	if (configEnv !== 'build') {
		config.entry = {
			test: [
				'webpack-dev-server/client?http://127.0.0.1:' + port,
				'./src/index.js',
			],
		};

		config.output.filename = '[name].js';
		config.output.publicPath = '/';
		config.output.path = __dirname + '/test/';
	}

	return config;
};
