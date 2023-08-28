import {Internals, type VideoConfig} from 'remotion';
import type {BrowserExecutable} from './browser-executable';
import type {BrowserLog} from './browser-log';
import type {HeadlessBrowser} from './browser/Browser';
import type {Page} from './browser/BrowserPage';
import {DEFAULT_TIMEOUT} from './browser/TimeoutSettings';
import {handleJavascriptException} from './error-handling/handle-javascript-exception';
import {findRemotionRoot} from './find-closest-package-json';
import {getPageAndCleanupFn} from './get-browser-instance';
import {type LogLevel} from './log-level';
import {getLogLevel} from './logger';
import type {ChromiumOptions} from './open-browser';
import type {ToOptions} from './options/option';
import type {optionsMap} from './options/options-map';
import type {RemotionServer} from './prepare-server';
import {makeOrReuseServer} from './prepare-server';
import {puppeteerEvaluateWithCatch} from './puppeteer-evaluate';
import {waitForReady} from './seek-to-frame';
import {setPropsAndEnv} from './set-props-and-env';
import {validatePuppeteerTimeout} from './validate-puppeteer-timeout';
import {wrapWithErrorHandling} from './wrap-with-error-handling';

type InternalGetCompositionsOptions = {
	serializedInputPropsWithCustomSchema: string;
	envVariables: Record<string, string>;
	puppeteerInstance: HeadlessBrowser | undefined;
	onBrowserLog: null | ((log: BrowserLog) => void);
	browserExecutable: BrowserExecutable | null;
	timeoutInMilliseconds: number;
	chromiumOptions: ChromiumOptions;
	port: number | null;
	server: RemotionServer | undefined;
	indent: boolean;
	logLevel: LogLevel;
	serveUrlOrWebpackUrl: string;
} & ToOptions<typeof optionsMap.getCompositions>;

export type GetCompositionsOptions = {
	inputProps?: Record<string, unknown> | null;
	envVariables?: Record<string, string>;
	puppeteerInstance?: HeadlessBrowser;
	onBrowserLog?: (log: BrowserLog) => void;
	browserExecutable?: BrowserExecutable;
	timeoutInMilliseconds?: number;
	chromiumOptions?: ChromiumOptions;
	port?: number | null;
	logLevel?: LogLevel;
	offthreadVideoCacheSizeInBytes?: number | null;
};

type InnerGetCompositionsParams = {
	serializedInputPropsWithCustomSchema: string;
	envVariables: Record<string, string>;
	onBrowserLog: null | ((log: BrowserLog) => void);
	timeoutInMilliseconds: number;
	serveUrl: string;
	page: Page;
	proxyPort: number;
	indent: boolean;
	logLevel: LogLevel;
};

const innerGetCompositions = async ({
	envVariables,
	serializedInputPropsWithCustomSchema,
	onBrowserLog,
	page,
	proxyPort,
	serveUrl,
	timeoutInMilliseconds,
	indent,
	logLevel,
}: InnerGetCompositionsParams): Promise<VideoConfig[]> => {
	if (onBrowserLog) {
		page.on('console', (log) => {
			onBrowserLog({
				stackTrace: log.stackTrace(),
				text: log.text,
				type: log.type,
			});
		});
	}

	validatePuppeteerTimeout(timeoutInMilliseconds);

	await setPropsAndEnv({
		serializedInputPropsWithCustomSchema,
		envVariables,
		page,
		serveUrl,
		initialFrame: 0,
		timeoutInMilliseconds,
		proxyPort,
		retriesRemaining: 2,
		audioEnabled: false,
		videoEnabled: false,
		indent,
		logLevel,
	});

	await puppeteerEvaluateWithCatch({
		page,
		pageFunction: () => {
			window.remotion_setBundleMode({
				type: 'evaluation',
			});
		},
		frame: null,
		args: [],
	});

	await waitForReady({page, timeoutInMilliseconds, frame: null});
	const {value: result} = await puppeteerEvaluateWithCatch({
		pageFunction: () => {
			return window.getStaticCompositions();
		},
		frame: null,
		page,
		args: [],
	});

	const res = result as Awaited<
		ReturnType<typeof window.getStaticCompositions>
	>;

	return res.map((r) => {
		const {width, durationInFrames, fps, height, id} = r;

		return {
			id,
			width,
			height,
			fps,
			durationInFrames,
			props: Internals.deserializeJSONWithCustomFields(
				r.serializedResolvedPropsWithCustomSchema,
			),
			defaultProps: Internals.deserializeJSONWithCustomFields(
				r.serializedDefaultPropsWithCustomSchema,
			),
		};
	});
};

type CleanupFn = () => void;

const internalGetCompositionsRaw = async ({
	browserExecutable,
	chromiumOptions,
	envVariables,
	indent,
	serializedInputPropsWithCustomSchema,
	onBrowserLog,
	port,
	puppeteerInstance,
	serveUrlOrWebpackUrl,
	server,
	timeoutInMilliseconds,
	logLevel,
	offthreadVideoCacheSizeInBytes,
}: InternalGetCompositionsOptions) => {
	const {page, cleanup: cleanupPage} = await getPageAndCleanupFn({
		passedInInstance: puppeteerInstance,
		browserExecutable,
		chromiumOptions,
		context: null,
		forceDeviceScaleFactor: undefined,
		indent,
		logLevel,
	});

	const cleanup: CleanupFn[] = [cleanupPage];

	return new Promise<VideoConfig[]>((resolve, reject) => {
		const onError = (err: Error) => reject(err);

		cleanup.push(
			handleJavascriptException({
				page,
				frame: null,
				onError,
			}),
		);

		makeOrReuseServer(
			server,
			{
				webpackConfigOrServeUrl: serveUrlOrWebpackUrl,
				port,
				remotionRoot: findRemotionRoot(),
				concurrency: 1,
				logLevel,
				indent,
				offthreadVideoCacheSizeInBytes,
			},
			{
				onDownload: () => undefined,
				onError,
			},
		)
			.then(({server: {serveUrl, offthreadPort, sourceMap}, cleanupServer}) => {
				page.setBrowserSourceMapContext(sourceMap);

				cleanup.push(() => cleanupServer(true));

				return innerGetCompositions({
					envVariables,
					serializedInputPropsWithCustomSchema,
					onBrowserLog,
					page,
					proxyPort: offthreadPort,
					serveUrl,
					timeoutInMilliseconds,
					indent,
					logLevel,
				});
			})

			.then((comp) => {
				return resolve(comp);
			})
			.catch((err) => {
				reject(err);
			})
			.finally(() => {
				cleanup.forEach((c) => {
					c();
				});
			});
	});
};

export const internalGetCompositions = wrapWithErrorHandling(
	internalGetCompositionsRaw,
);

/**
 * @description Gets the compositions defined in a Remotion project based on a Webpack bundle.
 * @see [Documentation](https://www.remotion.dev/docs/renderer/get-compositions)
 */
export const getCompositions = (
	serveUrlOrWebpackUrl: string,
	config?: GetCompositionsOptions,
): Promise<VideoConfig[]> => {
	const {
		browserExecutable,
		chromiumOptions,
		envVariables,
		inputProps,
		onBrowserLog,
		port,
		puppeteerInstance,
		timeoutInMilliseconds,
		logLevel,
	} = config ?? {};
	return internalGetCompositions({
		browserExecutable: browserExecutable ?? null,
		chromiumOptions: chromiumOptions ?? {},
		envVariables: envVariables ?? {},
		serializedInputPropsWithCustomSchema: Internals.serializeJSONWithDate({
			data: inputProps ?? {},
			indent: undefined,
			staticBase: null,
		}).serializedString,
		indent: false,
		onBrowserLog: onBrowserLog ?? null,
		port: port ?? null,
		puppeteerInstance: puppeteerInstance ?? undefined,
		serveUrlOrWebpackUrl,
		server: undefined,
		timeoutInMilliseconds: timeoutInMilliseconds ?? DEFAULT_TIMEOUT,
		logLevel: logLevel ?? getLogLevel(),
		offthreadVideoCacheSizeInBytes:
			config?.offthreadVideoCacheSizeInBytes ?? null,
	});
};
