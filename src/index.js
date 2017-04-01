import 'isomorphic-fetch';

const isFunction = (value) => {
	return typeof value === 'function';
};

const isHttps = window.location.protocol.toLowerCase() === 'https:';
const UPLOAD_URL = isHttps ? '//up.qbox.me' : '//upload.qiniu.com';

const checkConfig = (config) => {
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
		const resp = await fetch(uptokenUrl, {
			method: 'GET',
		}).then((res) => res.json());
		return resp.uptoken;
	}
	else if (uptokenFunc) {
		if (!isFunction(uptokenFunc)) {
			throw new Error('uptokenFunc should be a function');
		}
		else {
			return await uptokenFunc();
		}
	}
};


class TinyQiniu {
	constructor(config = {}) {
		checkConfig(config);
		this._config = config;
	}

	async uploadFile(file, options = {}) {
		const { domain } = this._config;
		const { key } = options;
		const uptoken = await generateToken(this._config);
		const formData = new FormData();
		formData.append('token', uptoken);
		formData.append('file', file);

		if (key) {
			formData.append('key', key);
		}

		return fetch(UPLOAD_URL, {
			method: 'POST',
			body: formData
		})
		.then((res) => res.json())
		.then((data) => {
			if (data.error) {
				throw new Error(data.error);
			}
			const { hash, key } = data;
			const id = key ? key : hash;
			return { url: `${domain}/${id}` };
		})
		;
	}

	async uploadBase64(base64, options = {}) {
		const { domain } = this._config;
		const { base64Key } = options;
		const uptoken = await generateToken(this._config);
		let fetchUrl = `${UPLOAD_URL}/putb64/-1`;
		if (base64Key) {
			fetchUrl = `${fetchUrl}/key/${base64Key}`;
		}
		return fetch(fetchUrl, {
			method: 'POST',
			headers: {
				Authorization: `UpToken ${uptoken}`,
			},
			body: base64.split(',')[1],
		})
		.then((res) => res.json())
		.then((data) => {
			if (data.error) {
				throw new Error(data.error);
			}
			const { hash, key } = data;
			const id = key ? key : hash;
			return { url: `${domain}/${id}` };
		})
		;
	}
}
export default TinyQiniu;
