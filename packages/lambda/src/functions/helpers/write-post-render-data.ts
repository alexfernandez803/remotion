import type {AwsRegion} from '../../pricing/aws-regions';
import type {PostRenderData} from '../../shared/constants';
import {postRenderDataKey} from '../../shared/constants';
import {lambdaWriteFile} from './io';
import type {RenderExpiryDays} from './lifecycle';

export const writePostRenderData = async ({
	bucketName,
	renderId,
	postRenderData,
	expectedBucketOwner,
	region,
	renderFolderExpires,
}: {
	bucketName: string;
	renderId: string;
	postRenderData: PostRenderData;
	expectedBucketOwner: string;
	region: AwsRegion;
	renderFolderExpires?: RenderExpiryDays | null;
}) => {
	await lambdaWriteFile({
		bucketName,
		key: postRenderDataKey(renderId, renderFolderExpires),
		privacy: 'private',
		body: JSON.stringify(postRenderData),
		expectedBucketOwner,
		region,
		downloadBehavior: null,
		customCredentials: null,
	});
};
