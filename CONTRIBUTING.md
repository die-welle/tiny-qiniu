# Contributing

## Issues

Please provide a minimal, reproducible test-case.


## Pull Requests

Follow the instructions on the Pull Request Template (shown when you open a new PR) and make sure you've done the following:

- [ ] Add & update tests
- [ ] Update relevant documentation and/or examples


## Setup

This package uses [yarn](https://yarnpkg.com) for development dependency management. Ensure you have it installed before continuing.

```sh
yarn
```

## Running Tests

**IMPORTANT** Before run tests, you should create a `qiniu.config.json` in `test` directory with the following example content:

```json
{
  "accessKey": "<Your qiniu AccessKey>",
  "secretKey": "<Your qiniu SecretKey>",
  "bucket": "<Your qiniu bucket name>",
  "baseURL": "<Your qiniu bucket baseURL>",
  "zone": "<Qiniu upload zone>"
}
```

```sh
yarn test
```


## Building

```sh
yarn build
```
