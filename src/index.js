
const isFunction = (value) => typeof value === 'function';
const isUndefined = (value) => typeof value === 'undefined';

// https://developer.qiniu.com/kodo/manual/1671/region-endpoint
const zones = {
	z0: 'upload.qiniup.com',
	z1: 'upload-z1.qiniup.com',
	z2: 'upload-z2.qiniup.com',
	na0: 'upload-na0.qiniup.com'
};

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

const defaultMapUptoken = (data) => (data.uptoken || data);
const defaultMapResponseURL = (url) => ({ url });

const validateConfig = (config) => {
	const {
		uptoken, uptokenUrl, uptokenFunc,

		mapUptoken,
		mapResponseURL,
		mapResponse,

		zone,

		bucket,
		baseURL,

		name, // deprecated
		domain, // deprecated
	} = config;

	if (!bucket && !name) {
		throw new Error('`bucket` is required');
	}

	if (!baseURL && !domain && !mapResponse) {
		throw new Error('One of `baseURL` or `mapResponse` is required');
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

	if (mapResponseURL && mapResponse) {
		throw new Error('Can NOT set both `mapResponseURL` and `mapResponse`');
	}

	if (!isFunction(mapResponseURL)) {
		config.mapResponseURL = defaultMapResponseURL;
	}

	config.bucket = bucket || name;
	config.baseURL = baseURL || domain;

	config.zone = zone || 'z0';

	if (!zones[config.zone]) {
		throw new Error(
			`Zone only support one of ${Object.keys(zones).join(', ')}, ` +
			`but received "${config.zone}"`,
		);
	}

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

const resp = (config, data) => {
	if (data.error) {
		throw new Error(data.error);
	}
	const { baseURL, mapResponseURL, mapResponse } = config;
	if (isFunction(mapResponse)) { return mapResponse(data); }

	const { hash, key } = data;
	const url = `${baseURL}/${key || hash}`;
	return mapResponseURL(url, hash, key, data);
};

export default class TinyQiniu {
	constructor(config = {}) {
		this._config = validateConfig(config);
	}

	_getUploadURL() {
		if (this._uploadURL) { return this._uploadURL; }

		const config = this._config;
		let isHTTPS = true;
		if (!isUndefined(config.isHTTPS)) { isHTTPS = !!config.isHTTPS; }
		else {
			try { isHTTPS = window.location.protocol.toLowerCase() === 'https:'; }
			catch (err) {} // eslint-disable-line
		}

		const protocol = isHTTPS ? 'https://' : 'http://';
		return (this._uploadURL = `${protocol}${zones[config.zone]}`);
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

				return fetch(this._getUploadURL(), {
					method: 'POST',
					body: formData,
				}, onProgress).then((data) => resp(this._config, data));
			})
		;
	}

	uploadBase64(base64, options = {}) {
		const { base64Key } = options;

		return generateToken(this._config)
			.then((uptoken) => {
				let fetchUrl = `${this._getUploadURL()}/putb64/-1`;
				if (base64Key) {
					fetchUrl = `${fetchUrl}/key/${base64Key}`;
				}

				return fetch(fetchUrl, {
					method: 'POST',
					headers: {
						Authorization: `UpToken ${uptoken}`,
					},
					body: base64.split(',')[1],
				}).then((data) => resp(this._config, data));
			})
		;
	}
}
