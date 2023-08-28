import {RenderInternals} from '@remotion/renderer';
import {createWriteStream} from 'node:fs';
import {VERSION} from 'remotion/version';
import {afterAll, beforeAll, expect, test} from 'vitest';
import {LambdaRoutines} from '../../../defaults';
import {lambdaReadFile} from '../../../functions/helpers/io';
import {callLambda} from '../../../shared/call-lambda';
import {disableLogs, enableLogs} from '../../disable-logs';

beforeAll(() => {
	disableLogs();
});

afterAll(async () => {
	enableLogs();

	await RenderInternals.killAllBrowsers();
});

test('Should make a distributed GIF', async () => {
	process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE = '2048';

	const res = await callLambda({
		type: LambdaRoutines.start,
		payload: {
			serveUrl:
				'https://64d3734a6bb69052c34d3616--spiffy-kelpie-71657b.netlify.app/',
			chromiumOptions: {},
			codec: 'gif',
			composition: 'framer',
			crf: 9,
			envVariables: {},
			// 61 frames, which is uneven, to challenge the frame planner
			frameRange: [0, 60],
			framesPerLambda: 8,
			imageFormat: 'png',
			inputProps: {
				type: 'payload',
				payload: '{}',
			},
			logLevel: 'warn',
			maxRetries: 3,
			outName: 'out.gif',
			pixelFormat: 'yuv420p',
			privacy: 'public',
			proResProfile: undefined,
			x264Preset: null,
			jpegQuality: undefined,
			scale: 1,
			timeoutInMilliseconds: 12000,
			numberOfGifLoops: null,
			everyNthFrame: 2,
			concurrencyPerLambda: 1,
			downloadBehavior: {type: 'play-in-browser'},
			muted: false,
			version: VERSION,
			overwrite: true,
			webhook: null,
			audioBitrate: null,
			videoBitrate: null,
			forceHeight: null,
			forceWidth: null,
			rendererFunctionName: null,
			bucketName: null,
			audioCodec: null,
			renderFolderExpires: null,
			offthreadVideoCacheSizeInBytes: null,
		},
		functionName: 'remotion-dev-lambda',
		receivedStreamingPayload: () => undefined,
		region: 'eu-central-1',
		timeoutInTest: 120000,
		retriesRemaining: 0,
	});

	const progress = await callLambda({
		type: LambdaRoutines.status,
		payload: {
			bucketName: res.bucketName,
			renderId: res.renderId,
			version: VERSION,
			renderFolderExpires: null,
		},
		functionName: 'remotion-dev-lambda',
		receivedStreamingPayload: () => undefined,
		region: 'eu-central-1',
		timeoutInTest: 120000,
		retriesRemaining: 0,
	});

	const file = await lambdaReadFile({
		bucketName: progress.outBucket as string,
		key: progress.outKey as string,
		expectedBucketOwner: 'abc',
		region: 'eu-central-1',
	});
	await new Promise<void>((resolve) => {
		file.pipe(createWriteStream('gif.gif')).on('close', () => resolve());
	});
	const probe = await RenderInternals.callFf('ffprobe', ['gif.gif']);
	expect(probe.stderr).toMatch(/Video: gif, bgra, 1080x1080/);
}, 90000);
