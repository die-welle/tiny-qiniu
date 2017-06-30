
const isFunction = (value) => typeof value === 'function';
const isUndefined = (value) => typeof value === 'undefined';

let uploadURL;

const fetch = function fetch(url, options = {}, onProgress) {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open(options.method || 'get', url);
		Object.keys(options.headers || {}).forEach((key) => {
			xhr.setRequestHeader(key, options.headers[key]);
		});
		xhr.onload = (ev) => {
			try { resolve(JSON.parse(ev.target.responseText)); }
			catch (err) { reject(err); }
		};
		xhr.onerror = reject;
		if (xhr.upload && onProgress) {
			xhr.upload.onprogress = onProgress;
		}
		xhr.send(options.body);
	});
};

const getUploadURL = (config) => {
	if (uploadURL) { return uploadURL; }

	let isHTTPS = true;
	if (!isUndefined(config.isHTTPS)) { isHTTPS = !!config.isHTTPS; }
	else {
		try { isHTTPS = window.location.protocol.toLowerCase() === 'https:'; }
		catch (err) {} // eslint-disable-line
	}
	uploadURL = isHTTPS ? '//up.qbox.me' : '//upload.qiniu.com';
	return uploadURL;
};

const defaultMapUptoken = (data) => (data.uptoken || data);
const defaultMapResponseURL = (url) => ({ url });

const validateConfig = (config) => {
	const {
		uptoken, uptokenUrl, uptokenFunc,

		mapUptoken,
		mapResponseURL,

		bucket,
		baseURL,

		name, // deprecated
		domain, // deprecated
	} = config;

	if (!bucket && !name) {
		throw new Error('`bucket` is required');
	}

	if (!baseURL && !domain) {
		throw new Error('`baseURL` is required');
	}

	if (!uptoken && !uptokenUrl && !uptokenFunc) {
		throw new Error(
			'One of `uptoken`, `uptokenUrl` or `uptokenFunc` is required'
		);
	}

	if (uptokenFunc && !isFunction(uptokenFunc)) {
		throw new Error('`UptokenFunc` must be a function');
	}

	if (!isFunction(mapUptoken)) {
		config.mapUptoken = defaultMapUptoken;
	}

	if (!isFunction(mapResponseURL)) {
		config.mapResponseURL = defaultMapResponseURL;
	}

	config.bucket = bucket || name;
	config.baseURL = baseURL || domain;

	return config;
};

const generateToken = ({ uptoken, uptokenUrl, uptokenFunc, mapUptoken }) => {
	if (uptoken) {
		return Promise.resolve(uptoken);
	}
	else if (uptokenUrl) {
		return fetch(uptokenUrl).then(mapUptoken);
	}
	else if (uptokenFunc) {
		return Promise.resolve(mapUptoken(uptokenFunc()));
	}
};

const responseURL = (config, data) => {
	if (data.error) {
		throw new Error(data.error);
	}
	const { baseURL, mapResponseURL } = config;
	const { hash, key } = data;
	const url = `${baseURL}/${key || hash}`;
	return mapResponseURL(url, hash, key);
};

export default class TinyQiniu {
	constructor(config = {}) {
		this._config = validateConfig(config);
	}

	uploadFile(file, options = {}) {
		const { key, onProgress } = options;
		return generateToken(this._config)
			.then((uptoken) => {
				const formData = new FormData();
				formData.append('token', uptoken);
				formData.append('file', file);

				if (key) {
					formData.append('key', key);
				}

				formData.append('scope', `${this._config.bucket}:${key}`);

				return fetch(getUploadURL(this._config), {
					method: 'POST',
					body: formData,
				}, onProgress).then((data) => responseURL(this._config, data));
			})
		;
	}

	uploadBase64(base64, options = {}) {
		const { base64Key } = options;

		return generateToken(this._config)
			.then((uptoken) => {
				let fetchUrl = `${getUploadURL(this._config)}/putb64/-1`;
				if (base64Key) {
					fetchUrl = `${fetchUrl}/key/${base64Key}`;
				}

				return fetch(fetchUrl, {
					method: 'POST',
					headers: {
						Authorization: `UpToken ${uptoken}`,
					},
					body: base64.split(',')[1],
				}).then((data) => responseURL(this._config, data));
			})
		;
	}
}
