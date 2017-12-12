'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var isFunction = function isFunction(value) {
	return typeof value === 'function';
};
var isUndefined = function isUndefined(value) {
	return typeof value === 'undefined';
};

// https://developer.qiniu.com/kodo/manual/1671/region-endpoint
var zones = {
	z0: 'upload.qiniup.com',
	z1: 'upload-z1.qiniup.com',
	z2: 'upload-z2.qiniup.com',
	na0: 'upload-na0.qiniup.com'
};

var uploadURL = void 0;

var fetch = function fetch(url) {
	var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
	var onProgress = arguments[2];

	return new Promise(function (resolve, reject) {
		var xhr = new XMLHttpRequest();
		xhr.open(options.method || 'get', url);
		Object.keys(options.headers || {}).forEach(function (key) {
			xhr.setRequestHeader(key, options.headers[key]);
		});
		xhr.onload = function (ev) {
			try {
				resolve(JSON.parse(ev.target.responseText));
			} catch (err) {
				reject(err);
			}
		};
		xhr.onerror = reject;
		if (xhr.upload && onProgress) {
			xhr.upload.onprogress = onProgress;
		}
		xhr.send(options.body);
	});
};

var getUploadURL = function getUploadURL(config) {
	if (uploadURL) {
		return uploadURL;
	}

	var isHTTPS = true;
	if (!isUndefined(config.isHTTPS)) {
		isHTTPS = !!config.isHTTPS;
	} else {
		try {
			isHTTPS = window.location.protocol.toLowerCase() === 'https:';
		} catch (err) {} // eslint-disable-line
	}

	var protocol = isHTTPS ? 'https://' : 'http://';

	// uploadURL = isHTTPS ? '//up.qbox.me' : '//upload.qiniu.com';
	uploadURL = zones[config.zone];
	uploadURL = '' + protocol + (uploadURL || zones.z0);

	return uploadURL;
};

var defaultMapUptoken = function defaultMapUptoken(data) {
	return data.uptoken || data;
};
var defaultMapResponseURL = function defaultMapResponseURL(url) {
	return { url: url };
};

var validateConfig = function validateConfig(config) {
	var uptoken = config.uptoken,
	    uptokenUrl = config.uptokenUrl,
	    uptokenFunc = config.uptokenFunc,
	    mapUptoken = config.mapUptoken,
	    mapResponseURL = config.mapResponseURL,
	    bucket = config.bucket,
	    baseURL = config.baseURL,
	    name = config.name,
	    domain = config.domain;


	if (!bucket && !name) {
		throw new Error('`bucket` is required');
	}

	if (!baseURL && !domain) {
		throw new Error('`baseURL` is required');
	}

	if (!uptoken && !uptokenUrl && !uptokenFunc) {
		throw new Error('One of `uptoken`, `uptokenUrl` or `uptokenFunc` is required');
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

var generateToken = function generateToken(_ref) {
	var uptoken = _ref.uptoken,
	    uptokenUrl = _ref.uptokenUrl,
	    uptokenFunc = _ref.uptokenFunc,
	    mapUptoken = _ref.mapUptoken;

	if (uptoken) {
		return Promise.resolve(uptoken);
	} else if (uptokenUrl) {
		return fetch(uptokenUrl).then(mapUptoken);
	} else if (uptokenFunc) {
		return Promise.resolve(mapUptoken(uptokenFunc()));
	}
};

var responseURL = function responseURL(config, data) {
	if (data.error) {
		throw new Error(data.error);
	}
	var baseURL = config.baseURL,
	    mapResponseURL = config.mapResponseURL;
	var hash = data.hash,
	    key = data.key;

	var url = baseURL + '/' + (key || hash);
	return mapResponseURL(url, hash, key);
};

var TinyQiniu = function () {
	function TinyQiniu() {
		var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		_classCallCheck(this, TinyQiniu);

		this._config = validateConfig(config);
	}

	_createClass(TinyQiniu, [{
		key: 'uploadFile',
		value: function uploadFile(file) {
			var _this = this;

			var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
			var key = options.key,
			    onProgress = options.onProgress;

			return generateToken(this._config).then(function (uptoken) {
				var formData = new FormData();
				formData.append('token', uptoken);
				formData.append('file', file);

				if (key) {
					formData.append('key', key);
				}

				formData.append('scope', _this._config.bucket + ':' + key);

				return fetch(getUploadURL(_this._config), {
					method: 'POST',
					body: formData
				}, onProgress).then(function (data) {
					return responseURL(_this._config, data);
				});
			});
		}
	}, {
		key: 'uploadBase64',
		value: function uploadBase64(base64) {
			var _this2 = this;

			var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
			var base64Key = options.base64Key;


			return generateToken(this._config).then(function (uptoken) {
				var fetchUrl = getUploadURL(_this2._config) + '/putb64/-1';
				if (base64Key) {
					fetchUrl = fetchUrl + '/key/' + base64Key;
				}

				return fetch(fetchUrl, {
					method: 'POST',
					headers: {
						Authorization: 'UpToken ' + uptoken
					},
					body: base64.split(',')[1]
				}).then(function (data) {
					return responseURL(_this2._config, data);
				});
			});
		}
	}]);

	return TinyQiniu;
}();

exports.default = TinyQiniu;
module.exports = exports['default'];