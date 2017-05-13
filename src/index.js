import 'isomorphic-fetch';

const isFunction = (value) => typeof value === 'function';
const isUndefined = (value) => typeof value === 'undefined';

let uploadURL;

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
};

const generateToken = async ({ uptoken, uptokenUrl, uptokenFunc }) => {
	if (uptoken) {
		return uptoken;
	}
	else if (uptokenUrl) {
		const res = await fetch(uptokenUrl);
		const data = await res.json();
		return data.uptoken;
	}
	else if (uptokenFunc) {
		if (!isFunction(uptokenFunc)) {
			throw new Error('uptokenFunc should be a function');
		}
		return uptokenFunc();
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
		validateConfig(config);
		this._config = config;
	}

	async uploadFile(file, options = {}) {
		const { key } = options;
		const uptoken = await generateToken(this._config);
		const formData = new FormData();
		formData.append('token', uptoken);
		formData.append('file', file);

		if (key) {
			formData.append('key', key);
		}

		const res = await fetch(getUploadURL(this._config), {
			method: 'POST',
			body: formData
		});

		const data = await res.json();

		return responseURL(this._config, data);
	}

	async uploadBase64(base64, options = {}) {
		const { base64Key } = options;
		const uptoken = await generateToken(this._config);
		let fetchUrl = `${getUploadURL(this._config)}/putb64/-1`;
		if (base64Key) {
			fetchUrl = `${fetchUrl}/key/${base64Key}`;
		}

		const res = await fetch(fetchUrl, {
			method: 'POST',
			headers: {
				Authorization: `UpToken ${uptoken}`,
			},
			body: base64.split(',')[1],
		});

		const data = await res.json();

		return responseURL(this._config, data);
	}
}
