
import phantom from 'phantom';

const port = process.env.PORT || 3000;

let ph;
let page;

export const closePage = () => {
	ph && ph.exit();
	page && page.close();
};

export const createPage = async () => {
	ph = await phantom.create();

	try {
		page = await ph.createPage();

		const status = await page.open(`http://localhost:${port}`);

		page.on('onConsoleMessage', (msg) => {
			console.log(msg);
		});

		if (status.toLowerCase() !== 'success') { throw new Error(status); }

		return page;
	}
	catch (err) {
		console.error('Create Page ERROR:', err);
		closePage();
	}
};
