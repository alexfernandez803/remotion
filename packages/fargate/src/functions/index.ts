import {RenderInternals} from '@remotion/renderer';
import type {IncomingMessage, ServerResponse} from 'http';
import {parseRequestBody} from './helpers/parse-body';
import type {ErrorResponsePayload} from './helpers/payloads';
import {FargateRunPayload} from './helpers/payloads';
import {renderMediaSingleThread} from './render-media-single-thread';
import {renderStillSingleThread} from './render-still-single-thread';

const renderOnCloudRun = async (req: IncomingMessage, res: ServerResponse) => {
	try {
		const rawBody = await parseRequestBody(req);
		const body = FargateRunPayload.parse(rawBody);
		const renderType = body.type;
		RenderInternals.setLogLevel(body.logLevel);
		switch (renderType) {
			case 'media':
				await renderMediaSingleThread(body, res);
				break;
			case 'still':
				await renderStillSingleThread(body, res);
				break;
			default:
				res
					.writeHead(400)
					.end('Invalid render type, must be either "media" or "still"');
		}
	} catch (err) {
		const response: ErrorResponsePayload = {
			type: 'error',
			message: (err as Error).message,
			name: (err as Error).name,
			stack: (err as Error).stack as string,
		};
		res.write(JSON.stringify(response));
		res.end();
	}
};

export {renderOnCloudRun};
