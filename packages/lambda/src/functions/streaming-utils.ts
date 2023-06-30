import type {
	InvokeWithResponseStreamCommandOutput,
	InvokeWithResponseStreamResponseEvent,
} from '@aws-sdk/client-lambda';

export const parseStream = async (
	res: InvokeWithResponseStreamCommandOutput,
	functionName: string,
	renderId: string,
	chunk: number
) => {
	const events =
		res.EventStream as AsyncIterable<InvokeWithResponseStreamResponseEvent>;

	let responsePayload: Uint8Array = new Uint8Array();

	for await (const event of events) {
		// pass the stream back to the caller

		// There are two types of events you can get on a stream.

		// `PayloadChunk`: These contain the actual raw bytes of the chunk
		// It has a single property: `Payload`
		if (event.PayloadChunk) {
			// Decode the raw bytes into a string a human can read
			/* 	const decoded = new TextDecoder('utf-8').decode(
				event.PayloadChunk.Payload
			);
 
 */
			const decoded = new TextDecoder('utf-8').decode(
				event.PayloadChunk.Payload
			);
			responsePayload = Buffer.concat([responsePayload, Buffer.from(decoded)]);

			console.log(
				`renderId = ${renderId}`,
				`chunk = ${chunk}`,
				'PayloadChunk',
				event.PayloadChunk,
				` `
			);
		}

		if (event.InvokeComplete) {
			console.log('InvokeComplete', event.InvokeComplete);
			console.log(
				'final ',
				`renderId = ${renderId}`,
				`chunk = ${chunk}`,
				'PayloadChunk',
				responsePayload
			);

			if (event.InvokeComplete.ErrorCode) {
				throw new Error(
					`Lambda function ${functionName} failed with error code ${event.InvokeComplete.ErrorCode}: ${event.InvokeComplete.ErrorDetails}}`
				);
			}
		}
	}
};
