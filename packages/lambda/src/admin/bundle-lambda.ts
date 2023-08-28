import {BundlerInternals} from '@remotion/bundler';
import {binaryPath, ffmpegCwd} from '@remotion/compositor-linux-arm64-gnu';
import fs from 'node:fs';
import path from 'node:path';
import {quit} from '../cli/helpers/quit';
import {FUNCTION_ZIP_ARM64} from '../shared/function-zip-path';
import zl = require('zip-lib');

const bundleLambda = async () => {
	const outdir = path.join(__dirname, '..', `build-render`);
	fs.mkdirSync(outdir, {
		recursive: true,
	});
	const outfile = path.join(outdir, 'index.js');

	fs.rmSync(outdir, {recursive: true});
	fs.mkdirSync(outdir, {recursive: true});
	const template = require.resolve(
		path.join(__dirname, '..', 'functions', 'index'),
	);

	await BundlerInternals.esbuild.build({
		platform: 'node',
		target: 'node16',
		bundle: true,
		outfile,
		entryPoints: [template],
		treeShaking: true,
		external: [
			'./compositor',
			'./compositor.exe',
			'./ffmpeg/remotion/bin/ffprobe',
			'./ffmpeg/remotion/bin/ffprobe.exe',
			'./ffmpeg/remotion/bin/ffmpeg',
			'./ffmpeg/remotion/bin/ffmpeg.exe',
			'./mappings.wasm',
		],
	});

	const compositorFile = `${outdir}/compositor`;
	fs.copyFileSync(binaryPath, compositorFile);
	fs.cpSync(ffmpegCwd, `${outdir}/ffmpeg`, {recursive: true});
	fs.cpSync(
		path.join(
			__dirname,
			'..',
			'..',
			'..',
			'renderer',
			'node_modules',
			'source-map',
			'lib',
			'mappings.wasm',
		),
		`${outdir}/mappings.wasm`,
	);

	await zl.archiveFolder(outdir, FUNCTION_ZIP_ARM64);

	fs.rmSync(outdir, {recursive: true});
};

bundleLambda()
	.then(() => {
		console.log('Bundled Lambda');
	})
	.catch((err) => {
		console.log(err);
		quit(1);
	});
