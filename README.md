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
    name: 'my_bucket', // qiniu bucket name, requried
    domain: 'http://cdn.awesome.com', // qiniu bucket domain, requried

    /* one of `uptoken`, `uptokenUrl`, `uptokenFunc` is required */

    // use a static uptoken string, it's NOT recommended
    uptoken: 'your_upload_token',

    // or use a url to dynamically get an uptoken, should return json with `{ uptoken: 'uptoken_from_server' }`
    uptokenUrl: 'http://localhost/api/uptoken',

    // or use a function to dynamically return an uptoken string.
    uptokenFunc: () => {
        const fakeFetch = () => new Promise((resolve) => {
            setTimeout(() => resolve('my_uptoken'), 1000)
        });

        return fakeFetch('/fake/api'); // return a promise
    },
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

## Notes

- It is recommended to setup a server to get `uptoken` for security. To setup a `uptoken` server, please checkout [/test/server](/test/server.js)
- If you are looking for a react component, [tiny-qiniu-request](https://github.com/die-welle/tiny-qiniu-request) is a good helper


## Testing

For more usage, please check the `./test` directory, or clone this repo and run `npm test` to start testing.

**IMPORTANT** Before run `npm test`, you should create a `qiniu.config.json` on `test` directory with the following example content:

```json
{
  "key": "<Your qiniu AccessKey>",
  "secret": "<Your qiniu SecretKey>",
  "bucket": "<Your qiniu bucket name>",
  "domain": "<Your qiniu bucket domain>"
}
```


## License

MIT
