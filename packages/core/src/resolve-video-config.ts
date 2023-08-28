import type {AnyZodObject} from 'zod';
import type {CalcMetadataReturnType} from './Composition.js';
import type {TCompMetadataWithCalcFunction} from './CompositionManager.js';
import {validateDimension} from './validation/validate-dimensions.js';
import {validateDurationInFrames} from './validation/validate-duration-in-frames.js';
import {validateFps} from './validation/validate-fps.js';
import type {VideoConfig} from './video-config.js';

export const resolveVideoConfig = ({
	composition,
	editorProps: editorPropsOrUndefined,
	signal,
	inputProps,
}: {
	composition: TCompMetadataWithCalcFunction<
		AnyZodObject,
		Record<string, unknown>
	>;
	editorProps: object;
	signal: AbortSignal;
	inputProps: Record<string, unknown>;
}): VideoConfig | Promise<VideoConfig> => {
	const calculatedProm = composition.calculateMetadata
		? composition.calculateMetadata({
				defaultProps: composition.defaultProps ?? {},
				props: {
					...(composition.defaultProps ?? {}),
					...(editorPropsOrUndefined ?? {}),
					...inputProps,
				},
				abortSignal: signal,
		  })
		: null;

	const fallbackProps = {
		...(composition.defaultProps ?? {}),
		...(inputProps ?? {}),
	};

	if (
		calculatedProm !== null &&
		typeof calculatedProm === 'object' &&
		'then' in calculatedProm
	) {
		return calculatedProm.then((c) => {
			const {height, width, durationInFrames, fps} = validateCalculated({
				calculated: c,
				composition,
			});
			return {
				width,
				height,
				fps,
				durationInFrames,
				id: composition.id,
				defaultProps: composition.defaultProps ?? {},
				props: c.props ?? fallbackProps,
			};
		});
	}

	const data = validateCalculated({
		calculated: calculatedProm,
		composition,
	});

	if (calculatedProm === null) {
		return {
			...data,
			id: composition.id,
			defaultProps: composition.defaultProps ?? {},
			props: fallbackProps,
		};
	}

	return {
		...data,
		id: composition.id,
		defaultProps: composition.defaultProps ?? {},
		props: calculatedProm.props ?? composition.defaultProps ?? {},
	};
};

const validateCalculated = ({
	composition,
	calculated,
}: {
	composition: TCompMetadataWithCalcFunction<
		AnyZodObject,
		Record<string, unknown>
	>;
	calculated: CalcMetadataReturnType<Record<string, unknown>> | null;
}) => {
	const calculateMetadataErrorLocation = `calculated by calculateMetadata() for the composition "${composition.id}"`;
	const defaultErrorLocation = `of the "<Composition />" component with the id "${composition.id}"`;

	const width = calculated?.width ?? composition.width ?? undefined;

	validateDimension(
		width,
		'width',
		calculated?.width ? calculateMetadataErrorLocation : defaultErrorLocation,
	);

	const height = calculated?.height ?? composition.height ?? undefined;

	validateDimension(
		height,
		'height',
		calculated?.height ? calculateMetadataErrorLocation : defaultErrorLocation,
	);

	const fps = calculated?.fps ?? composition.fps ?? null;

	validateFps(
		fps,
		calculated?.fps ? calculateMetadataErrorLocation : defaultErrorLocation,
		false,
	);

	const durationInFrames =
		calculated?.durationInFrames ?? composition.durationInFrames ?? null;

	validateDurationInFrames(durationInFrames, {
		allowFloats: false,
		component: `of the "<Composition />" component with the id "${composition.id}"`,
	});

	return {width, height, fps, durationInFrames};
};
