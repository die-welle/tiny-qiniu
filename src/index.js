
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

const validateConfig = (config) => {
	const { uptoken, uptokenUrl, uptokenFunc, domain, name } = config;
	if (!name) {
		throw new Error('name is required');
	}
	else if (!domain) {
		throw new Error('domain is required');
	}
	else if (!uptoken && !uptokenUrl && !uptokenFunc) {
		throw new Error('one of uptoken, uptokenUrl, uptokenFunc is required');
	}
	return config;
};

const generateToken = ({ uptoken, uptokenUrl, uptokenFunc }) => {
	if (uptoken) {
		return Promise.resolve(uptoken);
	}
	else if (uptokenUrl) {
		return fetch(uptokenUrl).then((data) => data.uptoken);
	}
	else if (uptokenFunc) {
		if (!isFunction(uptokenFunc)) {
			throw new Error('uptokenFunc should be a function');
		}
		return Promise.resolve(uptokenFunc());
	}
};

const responseURL = (config, data) => {
	if (data.error) {
		throw new Error(data.error);
	}
	const { domain } = config;
	const { hash, key } = data;
	const id = key ? key : hash;
	return { url: `${domain}/${id}` };
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

				return fetch(getUploadURL(this._config), {
					method: 'POST',
					body: formData
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
