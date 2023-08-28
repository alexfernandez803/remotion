import {expect, test} from 'vitest';
import {chunkKeyForIndex} from '../../defaults';
import {parseLambdaChunkKey} from '../../shared/parse-chunk-key';

test('Should be able to parse Lambda key', () => {
	expect(
<<<<<<< HEAD
		parseLambdaChunkKey(
			chunkKeyForIndex({
				index: 1111,
				renderId: 'abcdef',
				renderFolderExpires: null,
			})
		)
=======
		parseLambdaChunkKey(chunkKeyForIndex({index: 1111, renderId: 'abcdef'})),
>>>>>>> main
	).toEqual({
		chunk: 1111,
		renderId: 'abcdef',
	});
});
