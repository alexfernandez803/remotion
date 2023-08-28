import {
	chunkKeyForIndex,
	encodingProgressKey,
	lambdaChunkInitializedPrefix,
	lambdaTimingsPrefixForChunk,
} from '../../shared/constants';
import type {RenderExpiryDays} from './lifecycle';

export type CleanupJob = {
	name: string;
	type: 'exact' | 'prefix';
};

export const getFilesToDelete = ({
	chunkCount,
	renderId,
	renderFolderExpires,
}: {
	chunkCount: number;
	renderId: string;
	renderFolderExpires?: RenderExpiryDays | null;
}): CleanupJob[] => {
	const chunks = new Array(chunkCount).fill(true).map((_x, i) =>
		chunkKeyForIndex({
			index: i,
			renderId,
<<<<<<< HEAD
			renderFolderExpires,
		})
=======
		}),
>>>>>>> main
	);
	const lambdaTimings = new Array(chunkCount)
		.fill(true)
		.map((_x, i) =>
			lambdaTimingsPrefixForChunk(renderId, i, renderFolderExpires)
		);
	return [
		{
			name: lambdaChunkInitializedPrefix(renderId, renderFolderExpires),
			type: 'prefix' as const,
		},
		...chunks.map((i) => {
			return {
				name: i,
				type: 'exact' as const,
			};
		}),
		...lambdaTimings.map((i) => {
			return {
				name: i,
				type: 'prefix' as const,
			};
		}),
		{
			name: encodingProgressKey(renderId, renderFolderExpires),
			type: 'exact',
		},
	];
};
