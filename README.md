A tiny qiniu sdk for uploading file. (browser only)

## Differences from [qiniu.js](https://github.com/iwillwen/qiniu.js)

- Smaller
- No UI
- Support upload base64 string

## Requirements

- Qiniu developer account.
- Promise polyfill for old version browser.

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

### constructor(options)

#### Exapmle

```js
import TinyQiniu from 'tiny-qiniu';

const config = {
    name: 'my_bucket', // qiniu bucket name, requried
    domain: 'http://cdn.awesome.com', // qiniu bucket domain, requried

    /* one of `uptoken`, `uptokenUrl`, `uptokenFunc` is required */

    // use a static uptoken string
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

### tinyQiniu.uploadFile(file, options)

#### Example

```js
var file = document.querySelector('#fileInput').files[0];
tinyQiniu.uploadFile(file, { key: 'my_file_name' });
```

### tinyQiniu.uploadBase64(base64String, options)

#### Exapmle

```js
const base64Key = btoa('my_file_name');
tinyQiniu.uploadBase64(base64String, { base64key });
```

## Testing

For more usage, please check the `./test` directory, or clone this repo and run `npm test` to start testing.

**IMPORT** Before run `npm test`, you should create a `qiniu.config.json` on `test` directory with the following content:

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
