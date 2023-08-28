import path from 'node:path';
import {expect, test} from 'vitest';
import {guessExtensionForVideo} from '../guess-extension-for-media';

test('Guess extension for media - H264', async () => {
	const extension = await guessExtensionForVideo({
		src: path.join(
			__dirname,
			'..',
			'..',
			'..',
			'example',
			'public',
			'framermp4withoutfileextension',
		),
	});

	expect(extension).toBe('mp4');
});

test('Guess extension for media - WebM', async () => {
	const extension = await guessExtensionForVideo({
		src: path.join(
			__dirname,
			'..',
			'..',
			'..',
			'example',
			'public',
			'framer.webm',
		),
	});

	expect(extension).toBe('webm');
});

test('Guess extension for media - WAV', async () => {
	const extension = await guessExtensionForVideo({
		src: path.join(
			__dirname,
			'..',
			'..',
			'..',
			'example',
			'public',
			'22khz.wav',
		),
	});

	expect(extension).toBe('wav');
});

test('Guess extension for media - MP3', async () => {
	const extension = await guessExtensionForVideo({
		src: path.join(
			__dirname,
			'..',
			'..',
			'..',
			'example',
			'public',
			'music.mp3',
		),
	});

	expect(extension).toBe('mp3');
});
