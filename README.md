A tiny qiniu sdk for uploading file. (browser only)

## Differences from [qiniu.js](https://github.com/iwillwen/qiniu.js)

- Smaller
- No UI
- Support upload base64 string


## Requirements

- Qiniu developer account
- Promise polyfill for old version browser


## Installing

Using npm:

```bash
$ npm install tiny-qiniu
```

Using yarn:

```bash
$ yarn add tiny-qiniu
```


## Usage

### TinyQiniu#constructor(options)

#### Exapmle

```js
import TinyQiniu from 'tiny-qiniu';

const config = {
    bucket: 'my_bucket', // qiniu bucket name, requried

    /* one of `baseURL` or `mapResponse` is required */
    baseURL: 'http://cdn.awesome.com', // qiniu bucket domain, requried

    mapResponse: (data) => data, // a function to map final response data

    /* one of `uptoken`, `uptokenUrl`, `uptokenFunc` is required */

    // use a static uptoken string, it's NOT recommended
    uptoken: 'your_upload_token',

    // or use an url to dynamically get uptoken, should return json with `{ uptoken: 'uptoken_from_server' }`
    uptokenUrl: 'http://localhost/api/uptoken',

    // save zone
    // z0 - 华东 (by default), z1 - 华北, z2 - 华南, na0 - 北美
    zone: 'z2',

    // or use a function to dynamically return uptoken string
    uptokenFunc: () => {
        const fakeFetch = () => new Promise((resolve) => {
            setTimeout(() => resolve('my_uptoken'), 1000)
        });

        return fakeFetch('/fake/api'); // return a promise
    },

    mapUptoken: (data) => data.uptoken || data, // Optional, a function to map uptoken when fetch uptoken completed

    mapResponseURL: (url, hash, key, data) => url, // Optional, a function to map final url
};
const tinyQiniu = new TinyQiniu(config);
```

### TinyQiniu#uploadFile(file[, options])

Upload with a file object. You can also provide a remote file name by adding `options.key` as the second argument. Returns a promise.

###### options (Object)

- `key` (String): Remote file name
- `onProgress` (Function): The function called periodically with information when an [upload request](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequestEventTarget/onprogress) before success completely.

#### Example

```js
var file = document.querySelector('#fileInput').files[0];
tinyQiniu.uploadFile(file, { key: 'my_file_name' }).then((resp) => console.log(resp.url));
```

### TinyQiniu#uploadBase64(base64String[, options])

Upload with a base64 string. You can also provide a remote file name by adding `options.base64key` as the second argument. Returns a promise.

**NOTE** `base64key` should provide a base64 string. You can use `btoa()` or some other library to generate it.

#### Exapmle

```js
const base64Key = btoa('my_file_name');
tinyQiniu.uploadBase64(base64String, { base64key }).then((resp) => console.log(resp.url));
```


## Available Zones

- z0: `upload.qiniup.com` (default)
- z1: `upload-z1.qiniup.com`
- z2: `upload-z2.qiniup.com`
- na0: `upload-na0.qiniup.com`

Please checkout https://developer.qiniu.com/kodo/manual/1671/region-endpoint for detail


## Notes

- It is recommended to setup a server to get `uptoken` for security. To setup a `uptoken` server, please checkout [/test/server](/test/server.js)
- If you are looking for a react component, [tiny-qiniu-request](https://github.com/die-welle/tiny-qiniu-request) is a good helper


## Contributing

[Please checkout the contributing page](/CONTRIBUTING.md)


## ChangeLog

[Please checkout the Releases page](https://github.com/die-welle/tiny-qiniu/releases)


## License

MIT
