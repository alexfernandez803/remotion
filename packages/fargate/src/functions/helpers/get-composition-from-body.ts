import {RenderInternals} from '@remotion/renderer';
import type {CloudRunPayloadType} from './payloads';

export const getCompositionFromBody = async (body: CloudRunPayloadType) => {
	const {metadata, propsSize} = await RenderInternals.internalSelectComposition(
		{
			serveUrl: body.serveUrl,
			browserExecutable: null,
			chromiumOptions: body.chromiumOptions ?? {},
			envVariables: body.envVariables ?? {},
			id: body.composition,
			indent: false,
			serializedInputPropsWithCustomSchema:
				body.serializedInputPropsWithCustomSchema,
			logLevel: body.logLevel,
			onBrowserLog: () => null,
			port: null,
			puppeteerInstance: undefined,
			server: undefined,
			timeoutInMilliseconds: body.delayRenderTimeoutInMilliseconds,
			offthreadVideoCacheSizeInBytes: body.offthreadVideoCacheSizeInBytes,
		},
	);

	if (propsSize > 10_000_000) {
		RenderInternals.Log.warn(
			`The props of your composition are large (${propsSize} bytes). This may cause slowdown.`,
		);
	}

	return metadata;
};
