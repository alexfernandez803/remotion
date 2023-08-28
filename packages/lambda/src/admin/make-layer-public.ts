import {
	AddLayerVersionPermissionCommand,
	PublishLayerVersionCommand,
} from '@aws-sdk/client-lambda';
import {lambda} from 'aws-policies';
import {VERSION} from 'remotion/version';
import {getRegions} from '../api/get-regions';
import {quit} from '../cli/helpers/quit';
import {getLambdaClient} from '../shared/aws-clients';
import type {HostedLayers} from '../shared/hosted-layers';

const runtimes: string[] = ['nodejs18.x'];

const layerInfo: HostedLayers = {
	'ap-northeast-1': [],
	'ap-south-1': [],
	'ap-southeast-1': [],
	'ap-southeast-2': [],
	'eu-central-1': [],
	'eu-west-1': [],
	'eu-west-2': [],
	'us-east-1': [],
	'us-east-2': [],
	'us-west-2': [],
	'af-south-1': [],
	'ap-east-1': [],
	'ap-northeast-2': [],
	'ap-northeast-3': [],
	'ca-central-1': [],
	'eu-north-1': [],
	'eu-south-1': [],
	'eu-west-3': [],
	'me-south-1': [],
	'sa-east-1': [],
	'us-west-1': [],
};

const makeLayerPublic = async () => {
	const layers = ['fonts', 'ffmpeg', 'chromium'] as const;
	for (const region of getRegions()) {
		for (const layer of layers) {
			const layerName = `remotion-binaries-${layer}-arm64`;
			const {Version, LayerArn} = await getLambdaClient(region).send(
				new PublishLayerVersionCommand({
					Content: {
						S3Bucket: 'remotionlambda-binaries-' + region,
						S3Key: `remotion-layer-${layer}-v10-arm64.zip`,
					},
					LayerName: layerName,
					LicenseInfo:
						layer === 'chromium'
							? 'Chromium 114, compiled from source. Read Chromium License: https://chromium.googlesource.com/chromium/src/+/refs/heads/main/LICENSE'
							: layer === 'ffmpeg'
							? 'FFmpeg 6.0, compiled from source. Read FFMPEG license: https://ffmpeg.org/legal.html'
							: 'Contains Noto Sans font. Read Noto Sans License: https://fonts.google.com/noto/specimen/Noto+Sans/about',
					CompatibleRuntimes: runtimes,
					Description: VERSION,
				}),
			);
			await getLambdaClient(region).send(
				new AddLayerVersionPermissionCommand({
					Action: lambda.GetLayerVersion,
					LayerName: layerName,
					Principal: '*',
					VersionNumber: Version,
					StatementId: 'public-layer',
				}),
			);
			if (!layerInfo[region]) {
				layerInfo[region] = [];
			}

			if (!LayerArn) {
				throw new Error('layerArn is null');
			}

			if (!Version) {
				throw new Error('Version is null');
			}

			layerInfo[region].push({
				layerArn: LayerArn,
				version: Version,
			});
			console.log({LayerArn, Version});
		}
	}
};

makeLayerPublic()
	.then(() => {
		console.log('\n\n\n\n\n');
		console.log(JSON.stringify(layerInfo, null, 2));
	})
	.catch((err) => {
		console.log(err);
		quit(1);
	});
