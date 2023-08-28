import type {AwsRegion} from '../client';
import type {LambdaRoutines} from './constants';
import {encodeAwsUrlParams} from './encode-aws-url-params';

export const getCloudwatchMethodUrl = ({
	region,
	functionName,
	renderId,
	rendererFunctionName,
	method,
}: {
	region: AwsRegion;
	functionName: string;
	method: LambdaRoutines;
	rendererFunctionName: string | null;
	renderId: string;
}) => {
	const functionNameToUse = rendererFunctionName ?? functionName;
	const query = `"method=${method},renderId=${renderId}"`;

	return cloudWatchUrlWithQuery({region, functionNameToUse, query});
};

export const getCloudwatchRendererUrl = ({
	region,
	functionName,
	renderId,
	rendererFunctionName,
	chunk,
}: {
	region: AwsRegion;
	functionName: string;
	rendererFunctionName: string | null;
	renderId: string;
	chunk: null | number;
}) => {
	const functionNameToUse = rendererFunctionName ?? functionName;
	const query = `"method=renderer,renderId=${renderId}${
		chunk === null ? '' : `,chunk=${chunk},`
	}"`;

	return cloudWatchUrlWithQuery({region, functionNameToUse, query});
};

const cloudWatchUrlWithQuery = ({
	region,
	functionNameToUse,
	query,
}: {
	region: AwsRegion;
	functionNameToUse: string;
	query: string;
}) => {
	return `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups/log-group/$252Faws$252Flambda$252F${functionNameToUse}/log-events$3FfilterPattern$3D${encodeAwsUrlParams(
		query,
	)}`;
};

export const getS3RenderUrl = ({
	renderId,
	region,
	bucketName,
}: {
	renderId: string;
	region: AwsRegion;
	bucketName: string;
}) => {
	return `https://s3.console.aws.amazon.com/s3/buckets/${bucketName}?region=${region}&prefix=renders/${renderId}/`;
};
