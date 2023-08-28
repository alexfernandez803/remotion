import type {WebpackOverrideFn} from '@remotion/bundler';
import {PureJSAPIs} from '@remotion/renderer/pure';
import {cloudrunDeleteFile, cloudrunLs} from '../functions/helpers/io';
import {bundleSite} from '../shared/bundle-site';
import {getSitesKey} from '../shared/constants';
import {getStorageDiffOperations} from '../shared/get-storage-operations';
import {makeStorageServeUrl} from '../shared/make-storage-url';
import {randomHash} from '../shared/random-hash';
import {validateBucketName} from '../shared/validate-bucketname';
import {validateSiteName} from '../shared/validate-site-name';
import {getCloudStorageClient} from './helpers/get-cloud-storage-client';
import type {UploadDirProgress} from './upload-dir';
import {uploadDir} from './upload-dir';

export type DeploySiteInput = {
	entryPoint: string;
	bucketName: string;
	siteName?: string;
	options?: {
		onBundleProgress?: (progress: number) => void;
		onUploadProgress?: (upload: UploadDirProgress) => void;
		webpackOverride?: WebpackOverrideFn;
		ignoreRegisterRootWarning?: boolean;
		enableCaching?: boolean;
		publicDir?: string | null;
		rootDir?: string;
		bypassBucketNameValidation?: boolean;
	};
};

export type DeploySiteOutput = Promise<{
	serveUrl: string;
	siteName: string;
	stats: {
		uploadedFiles: number;
		deletedFiles: number;
		untouchedFiles: number;
	};
}>;

const deploySiteRaw = async ({
	entryPoint,
	bucketName,
	siteName,
	options,
}: DeploySiteInput): DeploySiteOutput => {
	validateBucketName(bucketName, {mustStartWithRemotion: true});

	const siteId = siteName ?? randomHash();
	validateSiteName(siteId);

	const cloudStorageClient = getCloudStorageClient();

	// check if bucket exists
	await cloudStorageClient.bucket(bucketName).get();

	const subFolder = getSitesKey(siteId);

	// gcpLs is a function that lists all files in a bucket
	const [files, bundled] = await Promise.all([
		cloudrunLs({
			bucketName,
			prefix: subFolder,
		}),
		bundleSite({
			publicPath: `/${bucketName}/${subFolder}/`,
			webpackOverride: options?.webpackOverride ?? ((f) => f),
			enableCaching: options?.enableCaching ?? true,
			publicDir: options?.publicDir,
			rootDir: options?.rootDir,
			ignoreRegisterRootWarning: options?.ignoreRegisterRootWarning,
			onProgress: options?.onBundleProgress ?? (() => undefined),
			entryPoint,
		}),
	]);

	const {toDelete, toUpload, existingCount} = await getStorageDiffOperations({
		objects: files,
		bundle: bundled,
		prefix: subFolder,
	});

	await Promise.all([
		uploadDir({
			bucket: bucketName,
			localDir: bundled,
			onProgress: options?.onUploadProgress ?? (() => undefined),
			keyPrefix: subFolder,
			toUpload,
		}),
		Promise.all(
			toDelete.map((d) => {
				return cloudrunDeleteFile({
					bucketName,
					key: d.name as string,
				});
			}),
		),
	]);

	return {
		serveUrl: makeStorageServeUrl({bucketName, subFolder}),
		siteName: siteId,
		stats: {
			uploadedFiles: toUpload.length,
			deletedFiles: toDelete.length,
			untouchedFiles: existingCount,
		},
	};
};

/**
 * @description Deploys a Remotion project to a GCP storage bucket to prepare it for rendering on Cloud Run.
 * @link https://remotion.dev/docs/cloudrun/deploysite
 * @param {string} params.entryPoint An absolute path to the entry file of your Remotion project.
 * @param {string} params.bucketName The name of the bucket to deploy your project into.
 * @param {string} params.siteName The name of the folder in which the project gets deployed to.
 * @param {object} params.options Further options, see documentation page for this function.
 */
export const deploySite = PureJSAPIs.wrapWithErrorHandling(deploySiteRaw);
