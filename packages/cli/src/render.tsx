// eslint-disable-next-line no-restricted-imports
import {Internals} from 'remotion';
import {registerCleanupJob} from './cleanup-before-quit';
import {ConfigInternals} from './config';
import {convertEntryPointToServeUrl} from './convert-entry-point-to-serve-url';
import {findEntryPoint} from './entry-point';
import {getResolvedAudioCodec} from './get-audio-codec';
import {getCliOptions} from './get-cli-options';
import {Log} from './log';
import {parsedCli, quietFlagProvided} from './parse-command-line';
import {renderVideoFlow} from './render-flows/render';

export const render = async (remotionRoot: string, args: string[]) => {
	const {
		file,
		remainingArgs,
		reason: entryPointReason,
	} = findEntryPoint(args, remotionRoot);

	if (!file) {
		Log.error('No entry point specified. Pass more arguments:');
		Log.error(
			'   npx remotion render [entry-point] [composition-name] [out-name]',
		);
		Log.error('Documentation: https://www.remotion.dev/docs/render');
		process.exit(1);
	}

	const fullEntryPoint = convertEntryPointToServeUrl(file);

	if (parsedCli.frame) {
		Log.error(
			'--frame flag was passed to the `render` command. This flag only works with the `still` command. Did you mean `--frames`? See reference: https://www.remotion.dev/docs/cli/',
		);
		process.exit(1);
	}

	const {
		concurrency,
		frameRange,
		shouldOutputImageSequence,
		overwrite,
		inputProps,
		envVariables,
		jpegQuality,
		browser,
		browserExecutable,
		scale,
		chromiumOptions,
		port,
		everyNthFrame,
		puppeteerTimeout,
		publicDir,
		height,
		width,
		crf,
		ffmpegOverride,
		audioBitrate,
		muted,
		enforceAudioTrack,
		proResProfile,
		x264Preset,
		pixelFormat,
		videoBitrate,
		numberOfGifLoops,
		offthreadVideoCacheSizeInBytes,
	} = await getCliOptions({
		isLambda: false,
		type: 'series',
		remotionRoot,
	});

	const audioCodec = getResolvedAudioCodec();

	await renderVideoFlow({
		fullEntryPoint,
		remotionRoot,
		browserExecutable,
		indent: false,
		logLevel: ConfigInternals.Logging.getLogLevel(),
		browser,
		chromiumOptions,
		scale,
		shouldOutputImageSequence,
		publicDir,
		envVariables,
		serializedInputPropsWithCustomSchema: Internals.serializeJSONWithDate({
			indent: undefined,
			staticBase: null,
			data: inputProps,
		}).serializedString,
		puppeteerTimeout,
		port,
		height,
		width,
		remainingArgs,
		compositionIdFromUi: null,
		entryPointReason,
		overwrite,
		quiet: quietFlagProvided(),
		concurrency,
		everyNthFrame,
		frameRange,
		jpegQuality,
		onProgress: () => undefined,
		addCleanupCallback: (c) => {
			registerCleanupJob(c);
		},
		outputLocationFromUI: null,
		uiCodec: null,
		uiImageFormat: null,
		cancelSignal: null,
		crf,
		ffmpegOverride,
		audioBitrate,
		muted,
		enforceAudioTrack,
		proResProfile,
		x264Preset,
		pixelFormat,
		videoBitrate,
		numberOfGifLoops,
		audioCodec,
		disallowParallelEncoding: false,
		offthreadVideoCacheSizeInBytes,
	});
};
