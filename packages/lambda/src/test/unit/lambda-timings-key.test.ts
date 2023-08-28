import {expect, test} from 'vitest';
import {lambdaChunkInitializedKey} from '../../shared/constants';
import {parseLambdaInitializedKey} from '../../shared/parse-lambda-initialized-key';

test('Lambda timinings key', () => {
	const key = lambdaChunkInitializedKey({
		attempt: 1,
		chunk: 1,
		renderId: 'abcdef',
		renderFolderExpires: null,
	});
	expect(parseLambdaInitializedKey(key)).toEqual({
		attempt: 1,
		chunk: 1,
		renderId: 'abcdef',
	});
});
