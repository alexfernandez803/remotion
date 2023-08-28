import {RenderInternals} from '@remotion/renderer';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import {chalk} from './chalk';
import {ConfigInternals} from './config';
import {installFileWatcher} from './file-watcher';
import {Log} from './log';
import {parsedCli} from './parse-command-line';

function getProcessEnv(): Record<string, string> {
	const env: Record<string, string> = {};

	const validKeys = Object.keys(process.env).filter((key) =>
		key.startsWith('REMOTION_'),
	);

	for (const key of validKeys) {
		env[key] = process.env[key] as string;
	}

	return env;
}

const watchEnvFile = ({
	processEnv,
	envFile,
	onUpdate,
}: {
	processEnv: ReturnType<typeof getProcessEnv>;
	envFile: string;
	onUpdate: (newProps: Record<string, string>) => void;
}): (() => void) => {
	const updateFile = async () => {
		const file = await fs.promises.readFile(envFile, 'utf-8');
		onUpdate({
			...processEnv,
			...dotenv.parse(file),
		});
	};

	const {unwatch} = installFileWatcher({
		file: envFile,
		onChange: async (type) => {
			try {
				if (type === 'deleted') {
					Log.warn(`${envFile} was deleted.`);
				} else if (type === 'changed') {
					await updateFile();
					Log.info(chalk.blueBright(`Updated env file ${envFile}`));
				} else if (type === 'created') {
					await updateFile();
					Log.info(chalk.blueBright(`Created env file ${envFile}`));
				}
			} catch (err) {
				Log.error(
					`${envFile} update failed with error ${(err as Error).stack}`,
				);
			}
		},
	});
	return unwatch;
};

const getEnvForEnvFile = async (
	processEnv: ReturnType<typeof getProcessEnv>,
	envFile: string,
	onUpdate: null | ((newProps: Record<string, string>) => void),
) => {
	try {
		const envFileData = await fs.promises.readFile(envFile);
		if (onUpdate) {
			if (typeof fs.watchFile === 'undefined') {
				Log.warn(
					'Unsupported feature (fs.watchFile): .env file will not hot reload.',
				);
			} else {
				watchEnvFile({processEnv, envFile, onUpdate});
			}
		}

		return {
			...processEnv,
			...dotenv.parse(envFileData),
		};
	} catch (err) {
		Log.error(`Your .env file at ${envFile} could not not be parsed.`);
		Log.error(err);
		process.exit(1);
	}
};

export const getEnvironmentVariables = (
	onUpdate: null | ((newProps: Record<string, string>) => void),
): Promise<Record<string, string>> => {
	const processEnv = getProcessEnv();

	if (parsedCli['env-file']) {
		const envFile = path.resolve(process.cwd(), parsedCli['env-file']);
		if (!fs.existsSync(envFile)) {
			Log.error('You passed a --env-file but it could not be found.');
			Log.error('We looked for the file at:', envFile);
			Log.error('Check that your path is correct and try again.');
			process.exit(1);
		}

		return getEnvForEnvFile(processEnv, envFile, onUpdate);
	}

	const remotionRoot = RenderInternals.findRemotionRoot();

	const configFileSetting = ConfigInternals.getDotEnvLocation();
	if (configFileSetting) {
		const envFile = path.resolve(remotionRoot, configFileSetting);
		if (!fs.existsSync(envFile)) {
			Log.error(
				'You specified a custom .env file using `Config.setDotEnvLocation()` in the config file but it could not be found',
			);
			Log.error('We looked for the file at:', envFile);
			Log.error('Check that your path is correct and try again.');
			process.exit(1);
		}

		return getEnvForEnvFile(processEnv, envFile, onUpdate);
	}

	const defaultEnvFile = path.resolve(remotionRoot, '.env');
	if (!fs.existsSync(defaultEnvFile)) {
		if (onUpdate) {
			if (typeof fs.watchFile === 'undefined') {
				Log.warn('Unsupported Bun feature: .env file will not hot reload.');
			} else {
				watchEnvFile({
					processEnv,
					envFile: defaultEnvFile,
					onUpdate,
				});
			}
		}

		return Promise.resolve(processEnv);
	}

	return getEnvForEnvFile(processEnv, defaultEnvFile, onUpdate);
};
