import type {_Object} from '@aws-sdk/client-s3';
import {lambdaChunkInitializedPrefix} from '../../shared/constants';
import {parseLambdaInitializedKey} from '../../shared/parse-lambda-initialized-key';
import type {RenderExpiryDays} from './lifecycle';

export type LambdaInvokeStats = {
	lambdasInvoked: number;
};

export const getLambdasInvokedStats = ({
	contents,
	renderId,
	renderFolderExpires,
}: {
	contents: _Object[];
	renderId: string;
	renderFolderExpires?: RenderExpiryDays | null;
}): LambdaInvokeStats => {
	const lambdasInvoked = contents
		.filter((c) =>
			c.Key?.startsWith(
				lambdaChunkInitializedPrefix(renderId, renderFolderExpires)
			)
		)
		.filter((c) => parseLambdaInitializedKey(c.Key as string).attempt === 1);

	return {
		lambdasInvoked: lambdasInvoked.length,
	};
};
