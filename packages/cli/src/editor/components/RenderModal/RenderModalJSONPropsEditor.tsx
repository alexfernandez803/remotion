import React, {useCallback, useEffect, useMemo} from 'react';
import type {SerializedJSONWithCustomFields} from 'remotion';
import {Internals} from 'remotion';
import type {z} from 'zod';
import {Button} from '../../../preview-server/error-overlay/remotion-overlay/Button';
import {FAIL_COLOR} from '../../helpers/colors';
import {setUnsavedProps} from '../../helpers/document-title';
import {useKeybinding} from '../../helpers/use-keybinding';
import {Flex, Row, Spacing} from '../layout';
import {RemTextarea} from '../NewComposition/RemTextarea';
import {ValidationMessage} from '../NewComposition/ValidationMessage';
import type {State} from './DataEditor';
import {deepEqual} from './SchemaEditor/deep-equal';
import {ZodErrorMessages} from './SchemaEditor/ZodErrorMessages';

const style: React.CSSProperties = {
	fontFamily: 'monospace',
	flex: 1,
};

const scrollable: React.CSSProperties = {
	padding: '8px 12px',
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
};

const parseJSON = (str: string, schema: z.ZodTypeAny): State => {
	try {
		const value = Internals.deserializeJSONWithCustomFields(str);
		const zodValidation = schema.safeParse(value);
		return {str, value, validJSON: true, zodValidation};
	} catch (e) {
		return {str, validJSON: false, error: (e as Error).message};
	}
};

export type EditType = 'inputProps' | 'defaultProps';

export const RenderModalJSONPropsEditor: React.FC<{
	value: unknown;
	setValue: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
	onSave: () => void;
	showSaveButton: boolean;
	serializedJSON: SerializedJSONWithCustomFields | null;
	defaultProps: Record<string, unknown>;
	schema: z.ZodTypeAny;
}> = ({
	setValue,
	value,
	defaultProps,
	onSave,
	showSaveButton,
	serializedJSON,
	schema,
}) => {
	if (serializedJSON === null) {
		throw new Error('expecting serializedJSON to be defined');
	}

	const keybindings = useKeybinding();
	const [localValue, setLocalValue] = React.useState<State>(() => {
		return parseJSON(serializedJSON.serializedString, schema);
	});

	const onPretty = useCallback(() => {
		if (!localValue.validJSON) {
			return;
		}

		const parsed = JSON.parse(localValue.str);
		setLocalValue({...localValue, str: JSON.stringify(parsed, null, 2)});
	}, [localValue, setLocalValue]);

	const onChange: React.ChangeEventHandler<HTMLTextAreaElement> = useCallback(
		(e) => {
			const parsed = parseJSON(e.target.value, schema);

			if (parsed.validJSON) {
				const validationResult = schema.safeParse(parsed.value);
				setLocalValue({
					str: e.target.value,
					value: parsed.value,
					validJSON: parsed.validJSON,
					zodValidation: validationResult,
				});
				if (validationResult.success) {
					setValue(parsed.value);
				}
			} else {
				setLocalValue({
					str: e.target.value,
					validJSON: parsed.validJSON,
					error: parsed.error,
				});
			}
		},
		[schema, setValue],
	);

	const hasChanged = useMemo(() => {
		return !deepEqual(value, defaultProps);
	}, [defaultProps, value]);

	useEffect(() => {
		setUnsavedProps(hasChanged);
	}, [hasChanged]);

	const onQuickSave = useCallback(() => {
		if (hasChanged) {
			onSave();
		}
	}, [hasChanged, onSave]);

	// If schema is changed in code
	useEffect(() => {
		setLocalValue(parseJSON(localValue.str, schema));
	}, [localValue.str, schema]);

	useEffect(() => {
		const save = keybindings.registerKeybinding({
			event: 'keydown',
			key: 's',
			commandCtrlKey: true,
			callback: onQuickSave,
			preventDefault: true,
			triggerIfInputFieldFocused: true,
		});

		return () => {
			save.unregister();
		};
	}, [keybindings, onQuickSave, onSave]);

	const reset = useCallback(() => {
		setValue(defaultProps);
		setLocalValue(parseJSON(JSON.stringify(defaultProps, null, 2), schema));
	}, [defaultProps, schema, setValue]);

	const textAreaStyle: React.CSSProperties = useMemo(() => {
		const fail = !localValue.validJSON || !localValue.zodValidation.success;
		if (!fail) {
			return style;
		}

		return {
			...style,
			borderColor: FAIL_COLOR,
		};
	}, [localValue]);

	return (
		<div style={scrollable}>
			<RemTextarea
				onChange={onChange}
				value={localValue.str}
				status={localValue.validJSON ? 'ok' : 'error'}
				style={textAreaStyle}
			/>
			<Spacing y={1} />
			{localValue.validJSON === false ? (
				<ValidationMessage
					align="flex-start"
					message={localValue.error}
					type="error"
				/>
			) : localValue.zodValidation.success === false ? (
				<ZodErrorMessages
					zodValidationResult={localValue.zodValidation}
					viewTab="json"
				/>
			) : null}
			<Spacing y={1} />
			<Row>
				<Button
					disabled={!(hasChanged || !localValue.validJSON)}
					onClick={reset}
				>
					Reset
				</Button>
				<Flex />
				<Button disabled={!localValue.validJSON} onClick={onPretty}>
					Format
				</Button>
				<Spacing x={1} />
				{showSaveButton ? (
					<Button
						onClick={onSave}
						disabled={
							!(localValue.validJSON && localValue.zodValidation.success) ||
							!localValue.validJSON ||
							!hasChanged
						}
					>
						Save
					</Button>
				) : null}
			</Row>
		</div>
	);
};
