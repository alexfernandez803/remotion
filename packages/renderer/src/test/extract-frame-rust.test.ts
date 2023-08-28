import {interpolate} from 'remotion';
import {expect, test} from 'vitest';
import {
	getIdealMaximumFrameCacheSizeInBytes,
	startLongRunningCompositor,
} from '../compositor/compositor';
import {exampleVideos} from './example-videos';

const BMP_HEADER_SIZE = 54;

test(
	'Should be able to extract a frame using Rust',
	async () => {
		const compositor = startLongRunningCompositor(
			getIdealMaximumFrameCacheSizeInBytes(),
			'info',
			false,
		);

		const data = await compositor.executeCommand('ExtractFrame', {
			src: exampleVideos.bigBuckBunny,
			original_src: exampleVideos.bigBuckBunny,
			time: 40,
			transparent: false,
		});
		expect(data.length).toBe(1280 * 720 * 3 + BMP_HEADER_SIZE);

		const data2 = await compositor.executeCommand('ExtractFrame', {
			src: exampleVideos.bigBuckBunny,
			original_src: exampleVideos.bigBuckBunny,
			time: 40.4,
			transparent: false,
		});
		expect(data2.length).toBe(1280 * 720 * 3 + BMP_HEADER_SIZE);

		compositor.finishCommands();
		await compositor.waitForDone();

		expect(data.subarray(0, 1000)).not.toEqual(data2.subarray(0, 1000));
	},
	{timeout: 10000},
);

test(
	'Should be able to get a PNG',
	async () => {
		const compositor = startLongRunningCompositor(
			getIdealMaximumFrameCacheSizeInBytes(),
			'info',
			false,
		);

		const data = await compositor.executeCommand('ExtractFrame', {
			src: exampleVideos.transparentWebm,
			original_src: exampleVideos.transparentWebm,
			time: 1,
			transparent: true,
		});

		// Platform specific PNG encoder settings
		if (data.length === 195708) {
			expect(data[100000] / 100).toBeCloseTo(0.04, 0.01);
			expect(data[100001] / 100).toBeCloseTo(0.16, 0.01);
			expect(data[140001] / 100).toBeCloseTo(0.76, 0.01);
			expect(data[170001] / 100).toBeCloseTo(1.23, 0.01);
		} else {
			expect(data.length).toBe(191797);
			expect(data[100000] / 100).toBeCloseTo(0.82, 0.01);
			expect(data[100001] / 100).toBeCloseTo(2.41, 0.01);
			expect(data[140001] / 100).toBeCloseTo(0.03, 0.01);
			expect(data[170001] / 100).toBeCloseTo(0.33, 0.01);
		}

		compositor.finishCommands();
		await compositor.waitForDone();
	},
	{timeout: 10000},
);

test('Should be able to start two compositors', async () => {
	const compositor = startLongRunningCompositor(
		getIdealMaximumFrameCacheSizeInBytes(),
		'info',
		false,
	);

	const compositor2 = startLongRunningCompositor(
		getIdealMaximumFrameCacheSizeInBytes(),
		'info',
		false,
	);

	await compositor.executeCommand('ExtractFrame', {
		src: exampleVideos.bigBuckBunny,
		original_src: exampleVideos.bigBuckBunny,
		time: 40,
		transparent: false,
	});
	await compositor2.executeCommand('ExtractFrame', {
		src: exampleVideos.bigBuckBunny,
		original_src: exampleVideos.bigBuckBunny,
		time: 40,
		transparent: false,
	});
});

test('Should be able to seek backwards', async () => {
	const compositor = startLongRunningCompositor(
		getIdealMaximumFrameCacheSizeInBytes(),
		'info',
		false,
	);

	const data = await compositor.executeCommand('ExtractFrame', {
		src: exampleVideos.bigBuckBunny,
		original_src: exampleVideos.bigBuckBunny,
		time: 40,
		transparent: false,
	});
	expect(data.length).toBe(2764854);
	const data2 = await compositor.executeCommand('ExtractFrame', {
		src: exampleVideos.bigBuckBunny,
		original_src: exampleVideos.bigBuckBunny,
		time: 35,
		transparent: false,
	});
	expect(data2.length).toBe(2764854);

	compositor.finishCommands();
	await compositor.waitForDone();
});

test(
	'Should be able to extract a frame that has no file extension',
	async () => {
		const compositor = startLongRunningCompositor(
			getIdealMaximumFrameCacheSizeInBytes(),
			'info',
			false,
		);

		const data = await compositor.executeCommand('ExtractFrame', {
			src: exampleVideos.framerWithoutFileExtension,
			original_src: exampleVideos.framerWithoutFileExtension,
			time: 0.04,
			transparent: false,
		});
		expect(data.length).toBe(3499254);

		compositor.finishCommands();
		await compositor.waitForDone();
	},
	{timeout: 10000},
);

test(
	'Should get the last frame if out of range',
	async () => {
		const compositor = startLongRunningCompositor(
			getIdealMaximumFrameCacheSizeInBytes(),
			'info',
			false,
		);

		const data = await compositor.executeCommand('ExtractFrame', {
			src: exampleVideos.framerWithoutFileExtension,
			original_src: exampleVideos.framerWithoutFileExtension,
			time: 3.33,
			transparent: false,
		});

		const expectedLength = BMP_HEADER_SIZE + 1080 * 1080 * 3;
		expect(data.length).toBe(expectedLength);
		const topLeftPixelR = data[expectedLength - 1];
		const topLeftPixelG = data[expectedLength - 2];
		const topLeftPixelB = data[expectedLength - 3];

		expect(topLeftPixelR / 100).toBeCloseTo(0.48, 0.01);
		expect(topLeftPixelG / 100).toBeCloseTo(1.13, 0.01);
		expect(topLeftPixelB / 100).toBeCloseTo(1.96, 0.01);

		compositor.finishCommands();
		await compositor.waitForDone();
	},
	{timeout: 10000},
);

test(
	'Should get the last frame of a corrupted video',
	async () => {
		const compositor = startLongRunningCompositor(
			getIdealMaximumFrameCacheSizeInBytes(),
			'info',
			false,
		);

		const data = await compositor.executeCommand('ExtractFrame', {
			src: exampleVideos.corrupted,
			original_src: exampleVideos.corrupted,
			time: 100,
			transparent: false,
		});

		// Pixel fixing
		expect(data.length).toBe(6220854);
		expect(data[1045650] / 100).toBeCloseTo(0.18, 0.01);
		expect(data[1645650] / 100).toBeCloseTo(0.41, 0.01);
		expect(data[2000000] / 100).toBeCloseTo(0.2, 0.01);

		compositor.finishCommands();
		await compositor.waitForDone();
	},
	{timeout: 10000},
);

test('Should be able to extract a frame with abnormal DAR', async () => {
	const compositor = startLongRunningCompositor(
		getIdealMaximumFrameCacheSizeInBytes(),
		'info',
		false,
	);

	const data = await compositor.executeCommand('ExtractFrame', {
		src: exampleVideos.customDar,
		original_src: exampleVideos.customDar,
		time: 3.33,
		transparent: false,
	});

	const header = data.subarray(0, BMP_HEADER_SIZE);

	const width = header.readInt32LE(18);
	const height = header.readInt32LE(22);

	expect(height).toBe(1280);
	expect(width).toBe(720);

	expect(data[0x00169915]).approximately(144, 2);
	expect(data[0x0012dd58]).approximately(159, 2);
	expect(data[0x00019108]).approximately(209, 2);

	compositor.finishCommands();
	await compositor.waitForDone();
});

test('Should be able to extract the frames in reverse order', async () => {
	const compositor = startLongRunningCompositor(
		getIdealMaximumFrameCacheSizeInBytes(),
		'info',
		false,
	);

	let prevPixel = '';

	for (let i = 30; i > 0; i -= 2) {
		const data = await compositor.executeCommand('ExtractFrame', {
			src: exampleVideos.bigBuckBunny,
			original_src: exampleVideos.bigBuckBunny,
			time: i,
			transparent: false,
		});

		const expectedLength = BMP_HEADER_SIZE + 1280 * 720 * 3;
		expect(data.length).toBe(expectedLength);

		const topLeftPixelR = data[expectedLength - 1];
		const topLeftPixelG = data[expectedLength - 2];
		const topLeftPixelB = data[expectedLength - 3];

		const centerLeftPixelR =
			data[Math.round(expectedLength - expectedLength / 2 - 1)];
		const centerLeftPixelG =
			data[Math.round(expectedLength - expectedLength / 2 - 2)];
		const centerLeftPixelB =
			data[Math.round(expectedLength - expectedLength / 2 - 3)];

		const pixels = [
			topLeftPixelR,
			topLeftPixelG,
			topLeftPixelB,
			centerLeftPixelB,
			centerLeftPixelR,
			centerLeftPixelG,
		].join('-');
		expect(pixels).not.toBe(prevPixel);
		prevPixel = pixels;
	}
});

test('Last frame should be fast', async () => {
	const compositor = startLongRunningCompositor(
		getIdealMaximumFrameCacheSizeInBytes(),
		'info',
		false,
	);

	const time = Date.now();

	const data = await compositor.executeCommand('ExtractFrame', {
		src: exampleVideos.transparentWebm,
		original_src: exampleVideos.transparentWebm,
		time: 5.0,
		transparent: false,
	});

	const time_end = Date.now();
	expect(data.length).toBe(6220854);

	const time2 = Date.now();
	const data2 = await compositor.executeCommand('ExtractFrame', {
		src: exampleVideos.transparentWebm,
		original_src: exampleVideos.transparentWebm,
		time: 5.0,
		transparent: false,
	});

	// Time should be way less now
	const time2_end = Date.now();
	expect(time2_end - time2).toBeLessThan(time_end - time);
	expect(data2.length).toBe(6220854);

	const time3 = Date.now();
	const data3 = await compositor.executeCommand('ExtractFrame', {
		src: exampleVideos.transparentWebm,
		original_src: exampleVideos.transparentWebm,
		time: 100,
		transparent: false,
	});

	// Time should be way less now
	const time3_end = Date.now();
	expect(time3_end - time3).toBeLessThan(time_end - time);
	expect(data3.length).toBe(6220854);

	// Transparent frame should be different, so it should take a lot more time
	// Improve me: This file is corrupt and cannot seek to the last frame.. get a better example
	const time4 = Date.now();
	const data4 = await compositor.executeCommand('ExtractFrame', {
		src: exampleVideos.transparentWebm,
		original_src: exampleVideos.transparentWebm,
		time: 1,
		transparent: true,
	});

	const time4_end = Date.now();
	expect(time4_end - time4).toBeGreaterThan((time3_end - time3) * 2);
	expect(data4.length).not.toBe(6220854);

	compositor.finishCommands();
	await compositor.waitForDone();
});

test('Should get from a screen recording', async () => {
	const compositor = startLongRunningCompositor(
		getIdealMaximumFrameCacheSizeInBytes(),
		'info',
		false,
	);

	const data = await compositor.executeCommand('ExtractFrame', {
		src: exampleVideos.screenrecording,
		original_src: exampleVideos.screenrecording,
		time: 0.5,
		transparent: false,
	});

	expect(data.length).toBe(15230038);

	compositor.finishCommands();
	await compositor.waitForDone();
});

test('Should get from video with no fps', async () => {
	const compositor = startLongRunningCompositor(
		getIdealMaximumFrameCacheSizeInBytes(),
		'info',
		false,
	);

	const data = await compositor.executeCommand('ExtractFrame', {
		src: exampleVideos.nofps,
		original_src: exampleVideos.nofps,
		time: 0.5,
		transparent: false,
	});

	expect(data.length).toBe(3044334);

	compositor.finishCommands();
	await compositor.waitForDone();
});

test('Should get from broken webcam video', async () => {
	const compositor = startLongRunningCompositor(
		getIdealMaximumFrameCacheSizeInBytes(),
		'info',
		false,
	);

	const data = await compositor.executeCommand('ExtractFrame', {
		src: exampleVideos.webcam,
		original_src: exampleVideos.webcam,
		time: 0,
		transparent: false,
	});

	expect(data.length).toBe(921654);

	compositor.finishCommands();
	await compositor.waitForDone();
});

test('Should get from iPhone video', async () => {
	const compositor = startLongRunningCompositor(
		getIdealMaximumFrameCacheSizeInBytes(),
		'info',
		false,
	);

	const data = await compositor.executeCommand('ExtractFrame', {
		src: exampleVideos.iphonevideo,
		original_src: exampleVideos.iphonevideo,
		time: 1,
		transparent: false,
	});

	expect(data.length).toBe(24883254);

	compositor.finishCommands();
	await compositor.waitForDone();
});

test('Should get from AV1 video', async () => {
	const compositor = startLongRunningCompositor(
		getIdealMaximumFrameCacheSizeInBytes(),
		'info',
		false,
	);

	const data = await compositor.executeCommand('ExtractFrame', {
		src: exampleVideos.av1,
		original_src: exampleVideos.av1,
		time: 0.5,
		transparent: false,
	});

	expect(data.length).toBe(6220854);

	compositor.finishCommands();
	await compositor.waitForDone();
});

test('Should handle getting a frame from a WebM when it is not transparent', async () => {
	const compositor = startLongRunningCompositor(
		getIdealMaximumFrameCacheSizeInBytes(),
		'info',
		false,
	);

	const data = await compositor.executeCommand('ExtractFrame', {
		src: exampleVideos.variablefps,
		original_src: exampleVideos.variablefps,
		time: 0,
		transparent: true,
	});

	// Should resort back to BMP because it is faster
	const header = data.slice(0, 8).toString('utf8');
	expect(header).toContain('BM60');

	expect(data.length).toBe(2764854);

	compositor.finishCommands();
	await compositor.waitForDone();
});

test('Should handle a video with no frames at the beginning', async () => {
	const compositor = startLongRunningCompositor(
		getIdealMaximumFrameCacheSizeInBytes(),
		'info',
		false,
	);

	const data = await compositor.executeCommand('ExtractFrame', {
		src: exampleVideos.zerotimestamp,
		original_src: exampleVideos.zerotimestamp,
		time: 1.5,
		transparent: false,
	});

	// Should resort back to BMP because it is faster
	const header = data.slice(0, 8).toString('utf8');
	expect(header).toContain('BM6');

	expect(data.length).toBe(6220854);

	compositor.finishCommands();
	await compositor.waitForDone();
});

test('Two different starting times should not result in big seeking', async () => {
	const compositor = startLongRunningCompositor(
		300 * 1024 * 1024,
		'info',
		false,
	);

	const expected = [];

	for (let i = 0; i < 10; i++) {
		const time = i + (i % 2 === 0 ? 60 : 0);
		const data = await compositor.executeCommand('ExtractFrame', {
			src: exampleVideos.bigBuckBunny,
			original_src: exampleVideos.bigBuckBunny,
			time,
			transparent: false,
		});

		const expectedLength = BMP_HEADER_SIZE + 1280 * 720 * 3;
		const centerLeftPixelR =
			data[Math.round(expectedLength - expectedLength / 2 - 1)];
		const centerLeftPixelG =
			data[Math.round(expectedLength - expectedLength / 2 - 2)];
		const centerLeftPixelB =
			data[Math.round(expectedLength - expectedLength / 2 - 3)];

		expected.push([centerLeftPixelR, centerLeftPixelG, centerLeftPixelB]);
	}

	expect(expected[0][0] / 100).toBeCloseTo(1.53, 1);
	expect(expected[0][1] / 100).toBeCloseTo(1.86, 1);
	expect(expected[0][2] / 100).toBeCloseTo(2.24, 1);

	expect(expected[1][0] / 100).toBeCloseTo(0.69, 1);
	expect(expected[1][1] / 100).toBeCloseTo(0.7, 1);
	expect(expected[1][2] / 100).toBeCloseTo(0.68, 1);

	expect(expected[2][0] / 100).toBeCloseTo(1.53, 1);
	expect(expected[2][1] / 100).toBeCloseTo(1.86, 1);
	expect(expected[2][2] / 100).toBeCloseTo(2.24, 1);

	expect(expected[3][0] / 100).toBeCloseTo(2.52, 1);
	expect(expected[3][1] / 100).toBeCloseTo(2.51, 1);
	expect(expected[3][2] / 100).toBeCloseTo(2.45, 1);

	expect(expected[4][0] / 100).toBeCloseTo(1.53, 1);
	expect(expected[4][1] / 100).toBeCloseTo(1.86, 1);
	expect(expected[4][2] / 100).toBeCloseTo(2.24, 1);

	expect(expected[5][0] / 100).toBeCloseTo(1.32, 1);
	expect(expected[5][1] / 100).toBeCloseTo(1.59, 1);
	expect(expected[5][2] / 100).toBeCloseTo(1.2, 1);

	expect(expected[6][0] / 100).toBeCloseTo(1.53, 1);
	expect(expected[6][1] / 100).toBeCloseTo(1.86, 1);
	expect(expected[6][2] / 100).toBeCloseTo(2.24, 1);

	expect(expected[7][0] / 100).toBeCloseTo(1.38, 1);
	expect(expected[7][1] / 100).toBeCloseTo(1.41, 1);
	expect(expected[7][2] / 100).toBeCloseTo(1.07, 1);

	expect(expected[8][0] / 100).toBeCloseTo(1.53, 1);
	expect(expected[8][1] / 100).toBeCloseTo(1.86, 1);
	expect(expected[8][2] / 100).toBeCloseTo(2.24, 1);

	expect(expected[9][0] / 100).toBeCloseTo(1.27, 1);
	expect(expected[9][1] / 100).toBeCloseTo(1.47, 1);
	expect(expected[9][2] / 100).toBeCloseTo(1.07, 1);

	const stats = await compositor.executeCommand('GetOpenVideoStats', {});
	const statsJson = JSON.parse(stats.toString('utf-8'));
	expect(statsJson.open_streams).toBe(2);
	expect(statsJson.open_videos).toBe(1);

	compositor.finishCommands();
	await compositor.waitForDone();
});

const getExpectedMediaFrameUncorrected = ({
	frame,
	playbackRate,
	startFrom,
}: {
	frame: number;
	playbackRate: number;
	startFrom: number;
}) => {
	return interpolate(
		frame,
		[-1, startFrom, startFrom + 1],
		[-1, startFrom, startFrom + playbackRate],
	);
};

test('Should not duplicate frames for iphoneVideo', async () => {
	const frame30 =
		getExpectedMediaFrameUncorrected({
			frame: 30,
			playbackRate: 1,
			startFrom: 0,
		}) / 30;
	const frame31 =
		getExpectedMediaFrameUncorrected({
			frame: 31,
			playbackRate: 1,
			startFrom: 0,
		}) / 30;

	const compositor = startLongRunningCompositor(500, 'info', false);

	const firstFrame = await compositor.executeCommand('ExtractFrame', {
		src: exampleVideos.iphonevideo,
		original_src: exampleVideos.iphonevideo,
		time: frame30,
		transparent: false,
	});

	const secondFrame = await compositor.executeCommand('ExtractFrame', {
		src: exampleVideos.iphonevideo,
		original_src: exampleVideos.iphonevideo,
		time: frame31,
		transparent: false,
	});

	const hundredRandomPixels = new Array(100).fill(true).map(() => {
		return Math.round(Math.random() * firstFrame.length);
	});

	let isSame = true;
	for (const pixel of hundredRandomPixels) {
		if (firstFrame[pixel] !== secondFrame[pixel]) {
			isSame = false;
			break;
		}
	}

	expect(isSame).toBe(false);
});
