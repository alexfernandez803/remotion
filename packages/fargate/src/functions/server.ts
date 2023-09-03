import type {IncomingMessage, ServerResponse} from 'http';
import {createServer} from 'http';
import {renderOnCloudRun} from '.';

const port = 5050;

const server = createServer(
	async (req: IncomingMessage, res: ServerResponse) => {
		if (req.method === 'POST') {
			await renderOnCloudRun(req, res);
		}
	},
);

server.listen(port);
