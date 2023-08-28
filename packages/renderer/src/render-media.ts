import type {ExecaChildProcess} from 'execa';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type {VideoConfig} from 'remotion';
import {Internals} from 'remotion';
import {type RenderMediaOnDownload} from './assets/download-and-map-assets-to-file';
import type {AudioCodec} from './audio-codec';
import type {BrowserExecutable} from './browser-executable';
import type {BrowserLog} from './browser-log';
import type {HeadlessBrowser} from './browser/Browser';
import {DEFAULT_TIMEOUT} from './browser/TimeoutSettings';
import {canUseParallelEncoding} from './can-use-parallel-encoding';
import type {Codec} from './codec';
import {codecSupportsMedia} from './codec-supports-media';
import {validateQualitySettings} from './crf';
import {deleteDirectory} from './delete-directory';
import {ensureFramesInOrder} from './ensure-frames-in-order';
import {ensureOutputDirectory} from './ensure-output-directory';
import type {FfmpegOverrideFn} from './ffmpeg-override';
import {findRemotionRoot} from './find-closest-package-json';
import type {FrameRange} from './frame-range';
import {getActualConcurrency} from './get-concurrency';
import {getFramesToRender} from './get-duration-from-frame-range';
import {getFileExtensionFromCodec} from './get-extension-from-codec';
import {getExtensionOfFilename} from './get-extension-of-filename';
import {getRealFrameRange} from './get-frame-to-render';
import type {VideoImageFormat} from './image-format';
import {
	DEFAULT_VIDEO_IMAGE_FORMAT,
	validateSelectedPixelFormatAndImageFormatCombination,
} from './image-format';
import {isAudioCodec} from './is-audio-codec';
import {DEFAULT_JPEG_QUALITY, validateJpegQuality} from './jpeg-quality';
import {type LogLevel} from './log-level';
import {getLogLevel, Log} from './logger';
import type {CancelSignal} from './make-cancel-signal';
import {cancelErrorMessages, makeCancelSignal} from './make-cancel-signal';
import type {ChromiumOptions} from './open-browser';
import type {ToOptions} from './options/option';
import type {optionsMap} from './options/options-map';
import {DEFAULT_OVERWRITE} from './overwrite';
import {startPerfMeasure, stopPerfMeasure} from './perf';
import type {PixelFormat} from './pixel-format';
import {
	DEFAULT_PIXEL_FORMAT,
	validateSelectedPixelFormatAndCodecCombination,
} from './pixel-format';
import type {RemotionServer} from './prepare-server';
import {makeOrReuseServer} from './prepare-server';
import {prespawnFfmpeg} from './prespawn-ffmpeg';
import {shouldUseParallelEncoding} from './prestitcher-memory-usage';
import type {ProResProfile} from './prores-profile';
import {validateSelectedCodecAndProResCombination} from './prores-profile';
import {internalRenderFrames} from './render-frames';
import {internalStitchFramesToVideo} from './stitch-frames-to-video';
import type {OnStartData} from './types';
import {validateFps} from './validate';
import {validateEvenDimensionsWithCodec} from './validate-even-dimensions-with-codec';
import {validateEveryNthFrame} from './validate-every-nth-frame';
import {validateFfmpegOverride} from './validate-ffmpeg-override';
import {validateNumberOfGifLoops} from './validate-number-of-gif-loops';
import {validateOutputFilename} from './validate-output-filename';
import {validateScale} from './validate-scale';
import {validateBitrate} from './validate-videobitrate';
import {wrapWithErrorHandling} from './wrap-with-error-handling';
import type {X264Preset} from './x264-preset';
import {validateSelectedCodecAndPresetCombination} from './x264-preset';

export type StitchingState = 'encoding' | 'muxing';

const SLOWEST_FRAME_COUNT = 10;

export type SlowFrame = {frame: number; time: number};

export type RenderMediaOnProgress = (progress: {
	renderedFrames: number;
	encodedFrames: number;
	encodedDoneIn: number | null;
	renderedDoneIn: number | null;
	progress: number;
	stitchStage: StitchingState;
}) => void;

export type InternalRenderMediaOptions = {
	outputLocation: string | null;
	codec: Codec;
	composition: Omit<VideoConfig, 'props' | 'defaultProps'>;
	serializedInputPropsWithCustomSchema: string;
	serializedResolvedPropsWithCustomSchema: string;
	crf: number | null;
	imageFormat: VideoImageFormat;
	pixelFormat: PixelFormat;
	envVariables: Record<string, string>;
	jpegQuality: number;
	frameRange: FrameRange | null;
	everyNthFrame: number;
	numberOfGifLoops: number | null;
	puppeteerInstance: HeadlessBrowser | undefined;
	overwrite: boolean;
	onProgress: RenderMediaOnProgress;
	onDownload: RenderMediaOnDownload;
	proResProfile: ProResProfile | undefined;
	x264Preset: X264Preset | undefined;
	onBrowserLog: ((log: BrowserLog) => void) | null;
	onStart: (data: OnStartData) => void;
	timeoutInMilliseconds: number;
	chromiumOptions: ChromiumOptions;
	scale: number;
	port: number | null;
	cancelSignal: CancelSignal | undefined;
	browserExecutable: BrowserExecutable | null;
	logLevel: LogLevel;
	onCtrlCExit: (fn: () => void) => void;
	indent: boolean;
	server: RemotionServer | undefined;
	preferLossless: boolean;
	muted: boolean;
	enforceAudioTrack: boolean;
	ffmpegOverride: FfmpegOverrideFn | undefined;
	audioBitrate: string | null;
	videoBitrate: string | null;
	disallowParallelEncoding: boolean;
	audioCodec: AudioCodec | null;
	serveUrl: string;
	concurrency: number | string | null;
} & ToOptions<typeof optionsMap.renderMedia>;

export type RenderMediaOptions = {
	outputLocation?: string | null;
	codec: Codec;
	composition: VideoConfig;
	inputProps?: Record<string, unknown>;
	crf?: number | null;
	imageFormat?: VideoImageFormat;
	pixelFormat?: PixelFormat;
	envVariables?: Record<string, string>;
	/**
	 * @deprecated Renamed to `jpegQuality`
	 */
	quality?: never;
	jpegQuality?: number;
	frameRange?: FrameRange | null;
	everyNthFrame?: number;
	numberOfGifLoops?: number | null;
	puppeteerInstance?: HeadlessBrowser;
	overwrite?: boolean;
	onProgress?: RenderMediaOnProgress;
	onDownload?: RenderMediaOnDownload;
	proResProfile?: ProResProfile;
	x264Preset?: X264Preset;
	/**
	 * @deprecated Use "logLevel": "verbose" instead
	 */
	dumpBrowserLogs?: boolean;
	onBrowserLog?: ((log: BrowserLog) => void) | undefined;
	onStart?: (data: OnStartData) => void;
	timeoutInMilliseconds?: number;
	chromiumOptions?: ChromiumOptions;
	scale?: number;
	port?: number | null;
	cancelSignal?: CancelSignal;
	browserExecutable?: BrowserExecutable;
	/**
	 * @deprecated Use "logLevel" instead
	 */
	verbose?: boolean;
	preferLossless?: boolean;
	muted?: boolean;
	enforceAudioTrack?: boolean;
	ffmpegOverride?: FfmpegOverrideFn;
	audioBitrate?: string | null;
	videoBitrate?: string | null;
	disallowParallelEncoding?: boolean;
	audioCodec?: AudioCodec | null;
	serveUrl: string;
	concurrency?: number | string | null;
	logLevel?: LogLevel;
	offthreadVideoCacheSizeInBytes?: number | null;
};

type Await<T> = T extends PromiseLike<infer U> ? U : T;

type RenderMediaResult = {
	buffer: Buffer | null;
	slowestFrames: SlowFrame[];
};

const internalRenderMediaRaw = ({
	proResProfile,
	x264Preset,
	crf,
	composition,
	serializedInputPropsWithCustomSchema,
	pixelFormat,
	codec,
	envVariables,
	frameRange,
	puppeteerInstance,
	outputLocation,
	onProgress,
	overwrite,
	onDownload,
	onBrowserLog,
	onStart,
	timeoutInMilliseconds,
	chromiumOptions,
	scale,
	browserExecutable,
	port,
	cancelSignal,
	muted,
	enforceAudioTrack,
	ffmpegOverride,
	audioBitrate,
	videoBitrate,
	audioCodec,
	concurrency,
	disallowParallelEncoding,
	everyNthFrame,
	imageFormat: provisionalImageFormat,
	indent,
	jpegQuality,
	numberOfGifLoops,
	onCtrlCExit,
	preferLossless,
	serveUrl,
	server: reusedServer,
	logLevel,
	serializedResolvedPropsWithCustomSchema,
	offthreadVideoCacheSizeInBytes,
}: InternalRenderMediaOptions): Promise<RenderMediaResult> => {
	validateJpegQuality(jpegQuality);
	validateQualitySettings({crf, codec, videoBitrate});
	validateBitrate(audioBitrate, 'audioBitrate');
	validateBitrate(videoBitrate, 'videoBitrate');

	validateSelectedCodecAndProResCombination({
		codec,
		proResProfile,
	});

	validateSelectedCodecAndPresetCombination({
		codec,
		x264Preset,
	});

	validateSelectedPixelFormatAndCodecCombination(pixelFormat, codec);
	if (outputLocation) {
		validateOutputFilename({
			codec,
			audioCodec,
			extension: getExtensionOfFilename(outputLocation) as string,
			preferLossless,
		});
	}

	const absoluteOutputLocation = outputLocation
		? path.resolve(process.cwd(), outputLocation)
		: null;

	validateScale(scale);

	validateFfmpegOverride(ffmpegOverride);

	validateEveryNthFrame(everyNthFrame, codec);
	validateNumberOfGifLoops(numberOfGifLoops, codec);

	let stitchStage: StitchingState = 'encoding';
	let stitcherFfmpeg: ExecaChildProcess<string> | undefined;
	let preStitcher: Await<ReturnType<typeof prespawnFfmpeg>> | null = null;
	let encodedFrames = 0;
	let muxedFrames = 0;
	let renderedFrames = 0;
	let totalFramesToRender = 0;
	let renderedDoneIn: number | null = null;
	let encodedDoneIn: number | null = null;
	let cancelled = false;

	const renderStart = Date.now();

	const {estimatedUsage, freeMemory, hasEnoughMemory} =
		shouldUseParallelEncoding({
			height: composition.height,
			width: composition.width,
		});
	const parallelEncoding =
		!disallowParallelEncoding &&
		hasEnoughMemory &&
		canUseParallelEncoding(codec);

	Log.verboseAdvanced(
		{
			indent,
			logLevel,
			tag: 'renderMedia()',
		},
		'Free memory:',
		freeMemory,
		'Estimated usage parallel encoding',
		estimatedUsage,
	);
	Log.verboseAdvanced(
		{
			indent,
			logLevel,
			tag: 'renderMedia()',
		},
		'Codec supports parallel rendering:',
		canUseParallelEncoding(codec),
	);
	if (disallowParallelEncoding) {
		Log.verboseAdvanced(
			{
				indent,
				logLevel,
				tag: 'renderMedia()',
			},
			'User disallowed parallel encoding.',
		);
	}

	if (parallelEncoding) {
		Log.verboseAdvanced(
			{
				indent,
				logLevel,
				tag: 'renderMedia()',
			},
			'Parallel encoding is enabled.',
		);
	} else {
		Log.verboseAdvanced(
			{
				indent,
				logLevel,
				tag: 'renderMedia()',
			},
			'Parallel encoding is disabled.',
		);
	}

	const imageFormat: VideoImageFormat = isAudioCodec(codec)
		? 'none'
		: provisionalImageFormat;

	validateSelectedPixelFormatAndImageFormatCombination(
		pixelFormat,
		imageFormat,
	);

	const workingDir = fs.mkdtempSync(
		path.join(os.tmpdir(), 'react-motion-render'),
	);

	const preEncodedFileLocation = parallelEncoding
		? path.join(
				workingDir,
				'pre-encode.' + getFileExtensionFromCodec(codec, audioCodec),
		  )
		: null;

	if (onCtrlCExit && workingDir) {
		onCtrlCExit(() => deleteDirectory(workingDir));
	}

	validateEvenDimensionsWithCodec({
		codec,
		height: composition.height,
		scale,
		width: composition.width,
	});

	const realFrameRange = getRealFrameRange(
		composition.durationInFrames,
		frameRange,
	);

	const callUpdate = () => {
		onProgress?.({
			encodedDoneIn,
			encodedFrames: Math.round(0.5 * encodedFrames + 0.5 * muxedFrames),
			renderedDoneIn,
			renderedFrames,
			stitchStage,
			progress:
				Math.round(
					(70 * renderedFrames + 15 * encodedFrames + 15 * muxedFrames) /
						totalFramesToRender,
				) / 100,
		});
	};

	const cancelRenderFrames = makeCancelSignal();
	const cancelPrestitcher = makeCancelSignal();
	const cancelStitcher = makeCancelSignal();

	cancelSignal?.(() => {
		cancelRenderFrames.cancel();
	});

	const {waitForRightTimeOfFrameToBeInserted, setFrameToStitch, waitForFinish} =
		ensureFramesInOrder(realFrameRange);

	const fps = composition.fps / everyNthFrame;

	validateFps(fps, 'in "renderMedia()"', codec === 'gif');

	const createPrestitcherIfNecessary = () => {
		if (preEncodedFileLocation) {
			preStitcher = prespawnFfmpeg({
				width: composition.width * scale,
				height: composition.height * scale,
				fps,
				outputLocation: preEncodedFileLocation,
				pixelFormat,
				codec,
				proResProfile,
				crf,
				onProgress: (frame: number) => {
					encodedFrames = frame;
					callUpdate();
				},
				logLevel,
				imageFormat,
				signal: cancelPrestitcher.cancelSignal,
				ffmpegOverride: ffmpegOverride ?? (({args}) => args),
				videoBitrate,
				indent,
			});
			stitcherFfmpeg = preStitcher.task;
		}
	};

	const waitForPrestitcherIfNecessary = async () => {
		if (stitcherFfmpeg) {
			await waitForFinish();
			stitcherFfmpeg?.stdin?.end();
			try {
				await stitcherFfmpeg;
			} catch (err) {
				throw new Error(preStitcher?.getLogs());
			}
		}
	};

	const mediaSupport = codecSupportsMedia(codec);
	const disableAudio = !mediaSupport.audio || muted;

	const slowestFrames: SlowFrame[] = [];
	let maxTime = 0;
	let minTime = 0;

	const recordFrameTime = (frameIndex: number, time: number) => {
		const frameTime: SlowFrame = {frame: frameIndex, time};

		if (time < minTime && slowestFrames.length === SLOWEST_FRAME_COUNT) {
			return;
		}

		if (time > maxTime) {
			// add at starting;
			slowestFrames.unshift(frameTime);
			maxTime = time;
		} else {
			// add frame at appropriate position
			const index = slowestFrames.findIndex(
				({time: indexTime}) => indexTime < time,
			);
			slowestFrames.splice(index, 0, frameTime);
		}

		if (slowestFrames.length > SLOWEST_FRAME_COUNT) {
			slowestFrames.pop();
		}

		minTime = slowestFrames[slowestFrames.length - 1]?.time ?? minTime;
	};

	let cleanupServerFn: (force: boolean) => Promise<unknown> = () =>
		Promise.resolve(undefined);

	const happyPath = new Promise<RenderMediaResult>((resolve, reject) => {
		Promise.resolve(createPrestitcherIfNecessary())
			.then(() => {
				return makeOrReuseServer(
					reusedServer,
					{
						concurrency: getActualConcurrency(concurrency),
						indent,
						port,
						remotionRoot: findRemotionRoot(),
						logLevel,
						webpackConfigOrServeUrl: serveUrl,
						offthreadVideoCacheSizeInBytes:
							offthreadVideoCacheSizeInBytes ?? null,
					},
					{
						onDownload,
						onError: (err) => reject(err),
					},
				);
			})
			.then(({server, cleanupServer}) => {
				cleanupServerFn = cleanupServer;
				const renderFramesProc = internalRenderFrames({
					composition,
					onFrameUpdate: (
						frame: number,
						frameIndex: number,
						timeToRenderInMilliseconds,
					) => {
						renderedFrames = frame;
						callUpdate();
						recordFrameTime(frameIndex, timeToRenderInMilliseconds);
					},
					concurrency,
					outputDir: parallelEncoding ? null : workingDir,
					onStart: (data) => {
						renderedFrames = 0;
						totalFramesToRender = data.frameCount;
						callUpdate();
						onStart?.(data);
					},
					serializedInputPropsWithCustomSchema,
					envVariables,
					imageFormat,
					jpegQuality,
					frameRange,
					puppeteerInstance,
					everyNthFrame,
					onFrameBuffer: parallelEncoding
						? async (buffer, frame) => {
								await waitForRightTimeOfFrameToBeInserted(frame);
								if (cancelled) {
									return;
								}

								const id = startPerfMeasure('piping');
								const exitStatus = preStitcher?.getExitStatus();
								if (exitStatus?.type === 'quit-successfully') {
									throw new Error(
										`FFmpeg already quit while trying to pipe frame ${frame} to it. Stderr: ${exitStatus.stderr}}`,
									);
								}

								if (exitStatus?.type === 'quit-with-error') {
									throw new Error(
										`FFmpeg quit with code ${exitStatus.exitCode} while piping frame ${frame}. Stderr: ${exitStatus.stderr}}`,
									);
								}

								stitcherFfmpeg?.stdin?.write(buffer);
								stopPerfMeasure(id);

								setFrameToStitch(
									Math.min(realFrameRange[1] + 1, frame + everyNthFrame),
								);
						  }
						: null,
					webpackBundleOrServeUrl: serveUrl,
					onBrowserLog,
					onDownload,
					timeoutInMilliseconds,
					chromiumOptions,
					scale,
					browserExecutable,
					port,
					cancelSignal: cancelRenderFrames.cancelSignal,
					muted: disableAudio,
					logLevel,
					indent,
					server,
					serializedResolvedPropsWithCustomSchema,
					offthreadVideoCacheSizeInBytes,
				});

				return renderFramesProc;
			})
			.then((renderFramesReturn) => {
				return Promise.all([
					renderFramesReturn,
					waitForPrestitcherIfNecessary(),
				]);
			})
			.then(([{assetsInfo}]) => {
				renderedDoneIn = Date.now() - renderStart;
				callUpdate();

				if (absoluteOutputLocation) {
					ensureOutputDirectory(absoluteOutputLocation);
				}

				const stitchStart = Date.now();
				return Promise.all([
					internalStitchFramesToVideo({
						width: composition.width * scale,
						height: composition.height * scale,
						fps,
						outputLocation: absoluteOutputLocation,
						preEncodedFileLocation,
						preferLossless,
						indent,
						force: overwrite,
						pixelFormat,
						codec,
						proResProfile,
						crf,
						assetsInfo,
						onProgress: (frame: number) => {
							stitchStage = 'muxing';
							if (preEncodedFileLocation) {
								muxedFrames = frame;
							} else {
								muxedFrames = frame;
								encodedFrames = frame;
							}

							callUpdate();
						},
						onDownload,
						numberOfGifLoops,
						logLevel,
						dir: workingDir,
						cancelSignal: cancelStitcher.cancelSignal,
						muted: disableAudio,
						enforceAudioTrack,
						ffmpegOverride: ffmpegOverride ?? null,
						audioBitrate,
						videoBitrate,
						audioCodec,
						x264Preset: x264Preset ?? null,
					}),
					stitchStart,
				]);
			})
			.then(([buffer, stitchStart]) => {
				encodedFrames = getFramesToRender(realFrameRange, everyNthFrame).length;
				encodedDoneIn = Date.now() - stitchStart;
				callUpdate();
				slowestFrames.sort((a, b) => b.time - a.time);
				const result: RenderMediaResult = {
					buffer,
					slowestFrames,
				};
				resolve(result);
			})
			.catch((err) => {
				/**
				 * When an error is thrown in renderFrames(...) (e.g., when delayRender() is used incorrectly), fs.unlinkSync(...) throws an error that the file is locked because ffmpeg is still running, and renderMedia returns it.
				 * Therefore we first kill the FFMPEG process before deleting the file
				 */
				cancelled = true;
				cancelRenderFrames.cancel();
				cancelStitcher.cancel();
				cancelPrestitcher.cancel();
				if (stitcherFfmpeg !== undefined && stitcherFfmpeg.exitCode === null) {
					const promise = new Promise<void>((res) => {
						setTimeout(() => {
							res();
						}, 2000);
						(stitcherFfmpeg as ExecaChildProcess<string>).on('close', res);
					});
					stitcherFfmpeg.kill();
					return promise.then(() => {
						reject(err);
					});
				}

				reject(err);
			})
			.finally(() => {
				if (
					preEncodedFileLocation !== null &&
					fs.existsSync(preEncodedFileLocation)
				) {
					deleteDirectory(path.dirname(preEncodedFileLocation));
				}

				// Clean temporary image frames when rendering ends or fails
				if (workingDir && fs.existsSync(workingDir)) {
					deleteDirectory(workingDir);
				}

				cleanupServerFn?.(false);
			});
	});

	return Promise.race([
		happyPath,
		new Promise<RenderMediaResult>((_resolve, reject) => {
			cancelSignal?.(() => {
				reject(new Error(cancelErrorMessages.renderMedia));
			});
		}),
	]);
};

export const internalRenderMedia = wrapWithErrorHandling(
	internalRenderMediaRaw,
);

/**
 *
 * @description Render a video from a composition
 * @see [Documentation](https://www.remotion.dev/docs/renderer/render-media)
 */
export const renderMedia = ({
	proResProfile,
	x264Preset,
	crf,
	composition,
	inputProps,
	pixelFormat,
	codec,
	envVariables,
	frameRange,
	puppeteerInstance,
	outputLocation,
	onProgress,
	overwrite,
	onDownload,
	onBrowserLog,
	onStart,
	timeoutInMilliseconds,
	chromiumOptions,
	scale,
	browserExecutable,
	port,
	cancelSignal,
	muted,
	enforceAudioTrack,
	ffmpegOverride,
	audioBitrate,
	videoBitrate,
	audioCodec,
	jpegQuality,
	concurrency,
	serveUrl,
	disallowParallelEncoding,
	everyNthFrame,
	imageFormat,
	numberOfGifLoops,
	dumpBrowserLogs,
	preferLossless,
	verbose,
	quality,
	logLevel,
	offthreadVideoCacheSizeInBytes,
}: RenderMediaOptions): Promise<RenderMediaResult> => {
	if (quality !== undefined) {
		console.warn(
			`The "quality" option has been renamed. Please use "jpegQuality" instead.`,
		);
	}

	return internalRenderMedia({
		proResProfile: proResProfile ?? undefined,
		x264Preset,
		codec,
		composition,
		serveUrl,
		audioBitrate: audioBitrate ?? null,
		audioCodec: audioCodec ?? null,
		browserExecutable: browserExecutable ?? null,
		cancelSignal,
		chromiumOptions: chromiumOptions ?? {},
		concurrency: concurrency ?? null,
		crf: crf ?? null,
		disallowParallelEncoding: disallowParallelEncoding ?? false,
		enforceAudioTrack: enforceAudioTrack ?? false,
		envVariables: envVariables ?? {},
		everyNthFrame: everyNthFrame ?? 1,
		ffmpegOverride: ffmpegOverride ?? undefined,
		frameRange: frameRange ?? null,
		imageFormat: imageFormat ?? DEFAULT_VIDEO_IMAGE_FORMAT,
		serializedInputPropsWithCustomSchema: Internals.serializeJSONWithDate({
			indent: undefined,
			staticBase: null,
			data: inputProps ?? {},
		}).serializedString,
		jpegQuality: jpegQuality ?? quality ?? DEFAULT_JPEG_QUALITY,
		muted: muted ?? false,
		numberOfGifLoops: numberOfGifLoops ?? null,
		onBrowserLog: onBrowserLog ?? null,
		onDownload: onDownload ?? (() => undefined),
		onProgress: onProgress ?? (() => undefined),
		onStart: onStart ?? (() => undefined),
		outputLocation: outputLocation ?? null,
		overwrite: overwrite ?? DEFAULT_OVERWRITE,
		pixelFormat: pixelFormat ?? DEFAULT_PIXEL_FORMAT,
		port: port ?? null,
		puppeteerInstance: puppeteerInstance ?? undefined,
		scale: scale ?? 1,
		timeoutInMilliseconds: timeoutInMilliseconds ?? DEFAULT_TIMEOUT,
		videoBitrate: videoBitrate ?? null,
		logLevel:
			verbose || dumpBrowserLogs ? 'verbose' : logLevel ?? getLogLevel(),
		preferLossless: preferLossless ?? false,
		indent: false,
		onCtrlCExit: () => undefined,
		server: undefined,
		serializedResolvedPropsWithCustomSchema: Internals.serializeJSONWithDate({
			indent: undefined,
			staticBase: null,
			data: composition.props ?? {},
		}).serializedString,
		offthreadVideoCacheSizeInBytes: offthreadVideoCacheSizeInBytes ?? null,
	});
};
