
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import getConfig from '../webpack.config.babel';

const config = getConfig();
const compiler = webpack(config);
const server = new WebpackDevServer(compiler, config.devServer);

export const startDevServer = () => new Promise((resolve) => {
	server.listen(3000, resolve);
});

export const stopDevServer = () => server.close();
