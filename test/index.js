
import 'phantom-page-promise';
import 'isomorphic-fetch';
import { createPage, closePage } from './page';
import { startServer, stopServer } from './server';
import { startDevServer, stopDevServer } from './devServer';
import assert from 'assert';
import { join } from 'path';
import { bucket, domain } from './qiniu.config.json';
import sizeOf from 'image-size';
import fs from 'fs';

const inDir = (...args) => join(__dirname, ...args);

const init = async () => {
	await startDevServer();
	const host = await startServer();
	const page = await createPage();
	const imgFile = inDir('images/1.png');
	const img = sizeOf(imgFile);

	describe('qiniu-js', () => {
		const config = {
			name: bucket,
			domain,
		};

		it('upload image file', async () => {
			const { uptoken } = await fetch(`${host}/uptoken`, {
				method: 'GET',
			})
			.then((res) => res.json());
			config.uptoken = uptoken;
			const configStr = JSON.stringify(config);
			const selector = '#uploader';
			await page.uploadFile(selector, imgFile);
			const { url } = await page.evaluatePromise(
				`function () {
					var tinyQiniu = new window.TinyQiniu(${configStr});
					var file = document.querySelector("${selector}").files[0];
					return tinyQiniu.uploadFile(file);
				}`
			);
			const imgInfo = await fetch(`${url}?imageInfo`).then((res) => res.json());
			assert.equal(img.width, imgInfo.width);
			assert.equal(img.height, imgInfo.height);
			assert.equal(img.type, imgInfo.format);
		});

		it('upload image file with key', async () => {
			const { uptoken } = await fetch(`${host}/uptoken`, {
				method: 'GET',
			})
			.then((res) => res.json());
			config.uptoken = uptoken;
			const configStr = JSON.stringify(config);
			const selector = '#uploader';
			await page.uploadFile(selector, imgFile);
			const { url } = await page.evaluatePromise(
				`function () {
					var tinyQiniu = new window.TinyQiniu(${configStr});
					var file = document.querySelector("${selector}").files[0];
					var options = {
						key: 'customName'
					};
					return tinyQiniu.uploadFile(file, options);
				}`
			);
			const imgInfo = await fetch(`${url}?imageInfo`).then((res) => res.json());
			assert.equal(img.width, imgInfo.width);
			assert.equal(img.height, imgInfo.height);
			assert.equal(img.type, imgInfo.format);
			assert.notEqual(url.indexOf('customName'), -1);
		});

		it('upload base64', async () => {
			const { uptoken } = await fetch(`${host}/uptoken`, {
				method: 'GET',
			})
			.then((res) => res.json());
			config.uptoken = uptoken;
			const configStr = JSON.stringify(config);
			const bitmap = fs.readFileSync(imgFile);
			const base64 = new Buffer(bitmap).toString('base64');
			const fullBase64 = `data:image/${img.type};base64,${base64}`;
			const { url } = await page.evaluatePromise(
				`function () {
					var tinyQiniu = new window.TinyQiniu(${configStr});
					return tinyQiniu.uploadBase64("${fullBase64}" );
				}`
			);
			const imgInfo = await fetch(`${url}?imageInfo`).then((res) => res.json());
			assert.equal(img.width, imgInfo.width);
			assert.equal(img.height, imgInfo.height);
			assert.equal(img.type, imgInfo.format);
		});

		it('upload base64 with key', async () => {

			const { uptoken } = await fetch(`${host}/uptoken`, {
				method: 'GET',
			})
			.then((res) => res.json());
			config.uptoken = uptoken;
			const configStr = JSON.stringify(config);
			const bitmap = fs.readFileSync(imgFile);
			const base64 = new Buffer(bitmap).toString('base64');
			const base64Key = new Buffer('customName').toString('base64');
			const fullBase64 = `data:image/${img.type};base64,${base64}`;
			const { url } = await page.evaluatePromise(
				`function () {
					var tinyQiniu = new window.TinyQiniu(${configStr});
					var options = {
						base64Key: "${base64Key}"
					};
					return tinyQiniu.uploadBase64("${fullBase64}", options);
				}`
			);
			const imgInfo = await fetch(`${url}?imageInfo`).then((res) => res.json());
			assert.equal(img.width, imgInfo.width);
			assert.equal(img.height, imgInfo.height);
			assert.equal(img.type, imgInfo.format);
			assert.notEqual(url.indexOf('customName'), -1);
		});

		it('use uptokenUrl to upload image file ', async () => {
			config.uptokenUrl = `${host}/uptoken`;
			const selector = '#uploader';
			const configStr = JSON.stringify(config);
			await page.uploadFile(selector, imgFile);
			const { url } = await page.evaluatePromise(
				`function () {
					var tinyQiniu = new window.TinyQiniu(${configStr});
					var file = document.querySelector("${selector}").files[0];
					return tinyQiniu.uploadFile(file);
				}`
			);
			const imgInfo = await fetch(`${url}?imageInfo`).then((res) => res.json());
			assert.equal(img.width, imgInfo.width);
			assert.equal(img.height, imgInfo.height);
			assert.equal(img.type, imgInfo.format);
		});

		it('use uptokenFunc to upload image file ', async () => {
			config.uptokenFunc = () => {
				const { uptoken } = fetch(`${host}/uptoken`, {
					method: 'GET',
				})
				.then((res) => res.json());
				return uptoken;
			};
			const selector = '#uploader';
			const configStr = JSON.stringify(config);
			await page.uploadFile(selector, imgFile);
			const { url } = await page.evaluatePromise(
				`function () {
					var tinyQiniu = new window.TinyQiniu(${configStr});
					var file = document.querySelector("${selector}").files[0];
					return tinyQiniu.uploadFile(file);
				}`
			);
			const imgInfo = await fetch(`${url}?imageInfo`).then((res) => res.json());
			assert.equal(img.width, imgInfo.width);
			assert.equal(img.height, imgInfo.height);
			assert.equal(img.type, imgInfo.format);
		});

		after(() => {
			closePage();
			stopServer();
			stopDevServer();
		});
	});

	run();
};

init();
