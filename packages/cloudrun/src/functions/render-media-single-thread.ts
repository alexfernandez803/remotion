import type * as ff from '@google-cloud/functions-framework';
import {Storage} from '@google-cloud/storage';
import type {ChromiumOptions, RenderMediaOnProgress} from '@remotion/renderer';
import {RenderInternals} from '@remotion/renderer';
import {Internals} from 'remotion';
import {randomHash} from '../shared/random-hash';
import {getCompositionFromBody} from './helpers/get-composition-from-body';
import type {
	CloudRunPayloadType,
	RenderMediaOnCloudrunOutput,
} from './helpers/payloads';
import {writeCloudrunError} from './helpers/write-cloudrun-error';

export const renderMediaSingleThread = async (
	body: CloudRunPayloadType,
	res: ff.Response,
) => {
	if (body.type !== 'media') {
		throw new Error('expected type media');
	}

	const renderId = randomHash({randomInTests: true});

	try {
		const composition = await getCompositionFromBody(body);

		const defaultOutName = `out.${RenderInternals.getFileExtensionFromCodec(
			body.codec,
			body.audioCodec,
		)}`;
		const tempFilePath = `/tmp/${defaultOutName}`;
		let previousProgress = 2;
		const onProgress: RenderMediaOnProgress = ({progress}) => {
			if (previousProgress !== progress) {
				res.write(JSON.stringify({onProgress: progress}) + '\n');
				previousProgress = progress;
			}
		};

		res.writeHead(200, {'Content-Type': 'text/html'});

		const actualChromiumOptions: ChromiumOptions = {
			...body.chromiumOptions,
			// Override the `null` value, which might come from CLI with swANGLE
			gl: body.chromiumOptions?.gl ?? 'swangle',
		};

		await RenderInternals.internalRenderMedia({
			composition: {
				...composition,
				height: body.forceHeight ?? composition.height,
				width: body.forceWidth ?? composition.width,
			},
			serveUrl: body.serveUrl,
			codec: body.codec,
			outputLocation: tempFilePath,
			serializedInputPropsWithCustomSchema:
				body.serializedInputPropsWithCustomSchema,
			serializedResolvedPropsWithCustomSchema: Internals.serializeJSONWithDate({
				data: composition.props,
				indent: undefined,
				staticBase: null,
			}).serializedString,
			jpegQuality: body.jpegQuality,
			audioCodec: body.audioCodec,
			audioBitrate: body.audioBitrate,
			videoBitrate: body.videoBitrate,
			crf: body.crf,
			pixelFormat: body.pixelFormat,
			imageFormat: body.imageFormat,
			scale: body.scale,
			proResProfile: body.proResProfile ?? undefined,
			x264Preset: body.x264Preset ?? undefined,
			everyNthFrame: body.everyNthFrame,
			numberOfGifLoops: body.numberOfGifLoops,
			onProgress,
			frameRange: body.frameRange,
			envVariables: body.envVariables,
			chromiumOptions: actualChromiumOptions,
			muted: body.muted,
			logLevel: body.logLevel,
			browserExecutable: null,
			timeoutInMilliseconds: body.delayRenderTimeoutInMilliseconds,
			cancelSignal: undefined,
			concurrency: body.concurrency ?? '100%',
			disallowParallelEncoding: false,
			enforceAudioTrack: body.enforceAudioTrack,
			ffmpegOverride: undefined,
			indent: false,
			onBrowserLog: null,
			onCtrlCExit: () => undefined,
			onDownload: () => undefined,
			onStart: () => undefined,
			overwrite: true,
			port: null,
			preferLossless: body.preferLossless,
			puppeteerInstance: undefined,
			server: undefined,
			offthreadVideoCacheSizeInBytes: body.offthreadVideoCacheSizeInBytes,
		});

		const storage = new Storage();

		const publicUpload = body.privacy === 'public' || !body.privacy;

		const uploadedResponse = await storage
			.bucket(body.outputBucket)
			.upload(tempFilePath, {
				destination: `renders/${renderId}/${body.outName ?? defaultOutName}`,
				predefinedAcl: publicUpload ? 'publicRead' : 'projectPrivate',
			});

		const uploadedFile = uploadedResponse[0];
		const renderMetadata = await uploadedFile.getMetadata();
		const responseData: RenderMediaOnCloudrunOutput = {
			type: 'success',
			publicUrl: publicUpload ? uploadedFile.publicUrl() : null,
			cloudStorageUri: uploadedFile.cloudStorageURI.href,
			size: renderMetadata[0].size,
			bucketName: body.outputBucket,
			renderId,
			privacy: publicUpload ? 'public-read' : 'project-private',
		};

		RenderInternals.Log.info('Render Completed:', responseData);
		res.end(JSON.stringify({response: responseData}));
	} catch (err) {
		await writeCloudrunError({
			bucketName: body.outputBucket,
			renderId,
			errorInfo: {
				name: (err as Error).name as string,
				message: (err as Error).message as string,
				stack: (err as Error).stack as string,
				type: 'renderer',
			},
			publicUpload: body.privacy === 'public' || !body.privacy,
		});

		throw err;
	}
};
