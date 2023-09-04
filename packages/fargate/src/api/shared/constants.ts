import type {StillImageFormat, ToOptions} from '@remotion/renderer';
import type {BrowserSafeApis} from '@remotion/renderer/client';
import type {AwsRegion} from '../../pricing/aws-regions';
import type {
	CustomCredentials,
	CustomCredentialsWithoutSensitiveData,
} from './aws-clients';

export const MIN_MEMORY = 512;
export const MAX_MEMORY = 10240;
export const DEFAULT_MEMORY_SIZE = 2048;

export const DEFAULT_TIMEOUT = 120;
export const MIN_TIMEOUT = 15;
export const MAX_TIMEOUT = 900;

export const MINIMUM_FRAMES_PER_LAMBDA = 4;
export const DEFAULT_FRAMES_PER_LAMBDA = 20;

export const BINARY_NAME = 'remotion lambda';
export const COMMAND_NOT_FOUND = 'Command not found';
export const DEFAULT_REGION: AwsRegion = 'us-east-1';
export const DEFAULT_MAX_RETRIES = 1;

export const MAX_FUNCTIONS_PER_RENDER = 200;

export const DEFAULT_EPHEMERAL_STORAGE_IN_MB = 2048;
export const MIN_EPHEMERAL_STORAGE_IN_MB = 512;
export const MAX_EPHEMERAL_STORAGE_IN_MB = 10240;

export const DEFAULT_OUTPUT_PRIVACY: Privacy = 'public';

export const DEFAULT_CLOUDWATCH_RETENTION_PERIOD = 14;

export const ENCODING_PROGRESS_STEP_SIZE = 100;

export const REMOTION_BUCKET_PREFIX = 'remotionlambda-';
export const RENDER_FN_PREFIX = 'remotion-render-';
export const LOG_GROUP_PREFIX = '/aws/lambda/';
export const rendersPrefix = (renderId: string) => `renders/${renderId}`;
export const encodingProgressKey = (renderId: string) =>
	`${rendersPrefix(renderId)}/encoding-progress.json`;
export const renderMetadataKey = (renderId: string) =>
	`${rendersPrefix(renderId)}/pre-render-metadata.json`;
export const initalizedMetadataKey = (renderId: string) =>
	`${rendersPrefix(renderId)}/initialized.txt`;
export const lambdaChunkInitializedPrefix = (renderId: string) =>
	`${rendersPrefix(renderId)}/lambda-initialized`;
export const lambdaChunkInitializedKey = ({
	renderId,
	chunk,
	attempt,
}: {
	attempt: number;
	renderId: string;
	chunk: number;
}) =>
	`${lambdaChunkInitializedPrefix(
		renderId,
	)}-chunk:${chunk}-attempt:${attempt}.txt`;
export const lambdaTimingsPrefix = (renderId: string) =>
	`${rendersPrefix(renderId)}/lambda-timings/chunk:`;

export const lambdaTimingsPrefixForChunk = (renderId: string, chunk: number) =>
	lambdaTimingsPrefix(renderId) + String(chunk).padStart(8, '0');

export const lambdaLogsPrefix = (
	renderId: string,
	chunk: number,
	startFrame: number,
	endFrame: number,
) =>
	`${rendersPrefix(renderId)}/logs/chunk:${String(chunk).padStart(
		8,
		'0',
	)}:frames:${startFrame}-${endFrame}.json`;

export const lambdaTimingsKey = ({
	renderId,
	chunk,
	start,
	rendered,
}: {
	renderId: string;
	chunk: number;
	start: number;
	rendered: number;
}) =>
	`${lambdaTimingsPrefixForChunk(
		renderId,
		chunk,
	)}-start:${start}-rendered:${rendered}.txt`;
export const chunkKey = (renderId: string) =>
	`${rendersPrefix(renderId)}/chunks/chunk`;
export const chunkKeyForIndex = ({
	renderId,
	index,
}: {
	renderId: string;
	index: number;
}) => `${chunkKey(renderId)}:${String(index).padStart(8, '0')}`;

export const getErrorKeyPrefix = (renderId: string) =>
	`${rendersPrefix(renderId)}/errors/`;

export const getErrorFileName = ({
	renderId,
	chunk,
	attempt,
}: {
	renderId: string;
	chunk: number | null;
	attempt: number;
}) => getErrorKeyPrefix(renderId) + ':chunk-' + chunk + ':attempt-' + attempt;

export type OutNameInput =
	| string
	| {
			bucketName: string;
			key: string;
			s3OutputProvider?: CustomCredentials;
	  };

export type OutNameInputWithoutCredentials =
	| string
	| {
			bucketName: string;
			key: string;
			s3OutputProvider?: CustomCredentialsWithoutSensitiveData;
	  };

export type OutNameOutput = {
	renderBucketName: string;
	key: string;
	customCredentials: CustomCredentials | null;
};

export const getSitesKey = (siteId: string) => `sites/${siteId}`;
export const outName = (renderId: string, extension: string) =>
	`${rendersPrefix(renderId)}/out.${extension}`;
export const outStillName = (renderId: string, imageFormat: StillImageFormat) =>
	`${rendersPrefix(renderId)}/out.${imageFormat}`;
export const customOutName = (
	renderId: string,
	bucketName: string,
	name: OutNameInput,
): OutNameOutput => {
	if (typeof name === 'string') {
		return {
			renderBucketName: bucketName,
			key: `${rendersPrefix(renderId)}/${name}`,
			customCredentials: null,
		};
	}

	return {
		key: name.key,
		renderBucketName: name.bucketName,
		customCredentials: name.s3OutputProvider ?? null,
	};
};

export const postRenderDataKey = (renderId: string) => {
	return `${rendersPrefix(renderId)}/post-render-metadata.json`;
};

export const defaultPropsKey = (hash: string) => {
	return `default-props/${hash}.json`;
};

export const inputPropsKey = (hash: string) => {
	return `input-props/${hash}.json`;
};

export const resolvedPropsKey = (hash: string) => {
	return `resolved-props/${hash}.json`;
};

export const RENDERER_PATH_TOKEN = 'remotion-bucket';
export const CONCAT_FOLDER_TOKEN = 'remotion-concat';
export const REMOTION_CONCATED_TOKEN = 'remotion-concated-token';
export const REMOTION_FILELIST_TOKEN = 'remotion-filelist';

export enum LambdaRoutines {
	info = 'info',
	start = 'start',
	launch = 'launch',
	status = 'status',
	renderer = 'renderer',
	still = 'still',
	compositions = 'compositions',
}

type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

export type WebhookOption = Prettify<
	| null
	| ({
			url: string;
			secret: string | null;
	  } & Partial<
			ToOptions<[typeof BrowserSafeApis.options.webhookCustomDataOption]>
	  >)
>;

export type SerializedInputProps =
	| {
			type: 'bucket-url';
			hash: string;
	  }
	| {
			type: 'payload';
			payload: string;
	  };

export type Privacy = 'public' | 'private' | 'no-acl';

export const LAMBDA_CONCURRENCY_LIMIT_QUOTA = 'L-B99A9384';
export const LAMBDA_BURST_LIMIT_QUOTA = 'L-548AE339';
