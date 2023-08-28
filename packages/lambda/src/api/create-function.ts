import {
	CreateLogGroupCommand,
	PutRetentionPolicyCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
	CreateFunctionCommand,
	GetFunctionCommand,
	PutFunctionEventInvokeConfigCommand,
	PutRuntimeManagementConfigCommand,
} from '@aws-sdk/client-lambda';
import {readFileSync} from 'node:fs';
import {LOG_GROUP_PREFIX} from '../defaults';
import type {AwsRegion} from '../pricing/aws-regions';
import {getCloudWatchLogsClient, getLambdaClient} from '../shared/aws-clients';
import {hostedLayers} from '../shared/hosted-layers';
import {ROLE_NAME} from './iam-validation/suggested-policy';

export const createFunction = async ({
	createCloudWatchLogGroup,
	region,
	zipFile,
	functionName,
	accountId,
	memorySizeInMb,
	timeoutInSeconds,
	alreadyCreated,
	retentionInDays,
	ephemerealStorageInMb,
	customRoleArn,
}: {
	createCloudWatchLogGroup: boolean;
	region: AwsRegion;
	zipFile: string;
	functionName: string;
	accountId: string;
	memorySizeInMb: number;
	timeoutInSeconds: number;
	alreadyCreated: boolean;
	retentionInDays: number;
	ephemerealStorageInMb: number;
	customRoleArn: string;
}): Promise<{FunctionName: string}> => {
	if (createCloudWatchLogGroup) {
		try {
			await getCloudWatchLogsClient(region).send(
				new CreateLogGroupCommand({
					logGroupName: `${LOG_GROUP_PREFIX}${functionName}`,
				}),
			);
		} catch (_err) {
			const err = _err as Error;
			if (!err.message.includes('log group already exists')) {
				throw err;
			}
		}

		await getCloudWatchLogsClient(region).send(
			new PutRetentionPolicyCommand({
				logGroupName: `${LOG_GROUP_PREFIX}${functionName}`,
				retentionInDays,
			}),
		);
	}

	if (alreadyCreated) {
		return {FunctionName: functionName};
	}

	const defaultRoleName = `arn:aws:iam::${accountId}:role/${ROLE_NAME}`;

	const {FunctionName} = await getLambdaClient(region).send(
		new CreateFunctionCommand({
			Code: {
				ZipFile: readFileSync(zipFile),
			},
			FunctionName: functionName,
			Handler: 'index.handler',
			Role: customRoleArn ?? defaultRoleName,
			Runtime: 'nodejs18.x',
			Description: 'Renders a Remotion video.',
			MemorySize: memorySizeInMb,
			Timeout: timeoutInSeconds,
			Layers: hostedLayers[region].map(
				({layerArn, version}) => `${layerArn}:${version}`,
			),
			Architectures: ['arm64'],
			EphemeralStorage: {
				Size: ephemerealStorageInMb,
			},
		}),
	);
	await getLambdaClient(region).send(
		new PutFunctionEventInvokeConfigCommand({
			MaximumRetryAttempts: 0,
			FunctionName,
		}),
	);

	let state = 'Pending';

	while (state === 'Pending') {
		const getFn = await getLambdaClient(region).send(
			new GetFunctionCommand({
				FunctionName,
			}),
		);
		await new Promise<void>((resolve) => {
			setTimeout(() => resolve(), 1000);
		});
		state = getFn.Configuration?.State as string;
	}

	try {
		await getLambdaClient(region).send(
			new PutRuntimeManagementConfigCommand({
				FunctionName,
				UpdateRuntimeOn: 'Manual',
				RuntimeVersionArn: `arn:aws:lambda:${region}::runtime:b97ad873eb5228db2e7d5727cd116734cc24c92ff1381739c4400c095404a2d3`,
			}),
		);
	} catch (err) {
		console.warn(
			'⚠️ Could not lock the runtime version. We recommend to update your policies to prevent your functions from breaking in the future in case the AWS runtime changes. See https://remotion.dev/docs/lambda/feb-2023-incident for an example on how to update your policy.',
		);
	}

	return {FunctionName: FunctionName as string};
};
