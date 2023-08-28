import {BrowserSafeApis} from '@remotion/renderer/client';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {parsedLambdaCli} from '../args';
import {Log} from '../log';

export const getWebhookCustomData = (): Record<string, unknown> | null => {
	const flagName = BrowserSafeApis.options.webhookCustomDataOption.cliFlag;
	const webhookFlag = parsedLambdaCli[flagName];

	if (!webhookFlag) {
		return null;
	}

	const jsonFile = path.resolve(process.cwd(), webhookFlag);
	try {
		if (fs.existsSync(jsonFile)) {
			const rawJsonData = fs.readFileSync(jsonFile, 'utf-8');

			return JSON.parse(rawJsonData);
		}

		return JSON.parse(webhookFlag);
	} catch (err) {
		Log.error(
			`You passed --${flagName} but it was neither valid JSON nor a file path to a valid JSON file. Provided value: ${webhookFlag}`,
		);
		Log.info('Got the following value:', webhookFlag);
		Log.error(
			'Check that your input is parseable using `JSON.parse` and try again.',
		);
		if (os.platform() === 'win32') {
			Log.warn(
				'Note: Windows handles escaping of quotes very weirdly in the command line.',
			);
			Log.warn('This might have led to you having this problem.');
			Log.warn(
				'Consider using the alternative API for --props which is to pass',
			);
			Log.warn('a path to a JSON file:');
			Log.warn(`  --${flagName}=path/to/props.json`);
		}

		process.exit(1);
	}
};
