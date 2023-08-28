import React, {
	createRef,
	useCallback,
	useContext,
	useImperativeHandle,
	useMemo,
	useState,
} from 'react';
import type {AnyComposition} from 'remotion';
import {Internals} from 'remotion';
import {cmdOrCtrlCharacter} from '../../preview-server/error-overlay/remotion-overlay/ShortcutHint';
import {BACKGROUND, LIGHT_TEXT} from '../helpers/colors';
import {DataEditor} from './RenderModal/DataEditor';
import {deepEqual} from './RenderModal/SchemaEditor/deep-equal';
import {RenderQueue} from './RenderQueue';
import {RendersTab} from './RendersTab';
import {Tab, Tabs} from './Tabs';

const container: React.CSSProperties = {
	height: '100%',
	width: '100%',
	position: 'absolute',
	display: 'flex',
	flexDirection: 'column',
};

const circle: React.CSSProperties = {
	width: 8,
	height: 8,
	borderRadius: 4,
};

type OptionsSidebarPanel = 'input-props' | 'renders';

const localStorageKey = 'remotion.sidebarPanel';

const getSelectedPanel = (): OptionsSidebarPanel => {
	const panel = localStorage.getItem(localStorageKey);
	if (panel === 'renders') {
		return 'renders';
	}

	return 'input-props';
};

const tabsContainer: React.CSSProperties = {
	backgroundColor: BACKGROUND,
};

export const persistSelectedOptionsSidebarPanel = (
	panel: OptionsSidebarPanel,
) => {
	localStorage.setItem(localStorageKey, panel);
};

export const optionsSidebarTabs = createRef<{
	selectRendersPanel: () => void;
}>();

export const OptionsPanel: React.FC<{}> = () => {
	const {props, updateProps} = useContext(Internals.EditorPropsContext);
	const [saving, setSaving] = useState(false);
	const [panel, setPanel] = useState<OptionsSidebarPanel>(() =>
		getSelectedPanel(),
	);
	const onPropsSelected = useCallback(() => {
		setPanel('input-props');
		persistSelectedOptionsSidebarPanel('input-props');
	}, []);

	const onRendersSelected = useCallback(() => {
		setPanel('renders');
		persistSelectedOptionsSidebarPanel('renders');
	}, []);

	useImperativeHandle(
		optionsSidebarTabs,
		() => {
			return {
				selectRendersPanel: () => {
					setPanel('renders');
					persistSelectedOptionsSidebarPanel('renders');
				},
			};
		},
		[],
	);

	const {compositions, currentComposition} = useContext(
		Internals.CompositionManager,
	);
	const circleStyle = useMemo((): React.CSSProperties => {
		const onTabColor = saving ? LIGHT_TEXT : 'white';

		return {
			...circle,
			backgroundColor: panel === 'input-props' ? onTabColor : LIGHT_TEXT,
			cursor: 'help',
		};
	}, [panel, saving]);

	const composition = useMemo((): AnyComposition | null => {
		for (const comp of compositions) {
			if (comp.id === currentComposition) {
				return comp;
			}
		}

		return null;
	}, [compositions, currentComposition]);

	const saveToolTip = useMemo(() => {
		return process.env.KEYBOARD_SHORTCUTS_ENABLED
			? `Save using ${cmdOrCtrlCharacter}+S`
			: 'There are unsaved changes';
	}, []);

	const setInputProps = useCallback(
		(
			newProps:
				| Record<string, unknown>
				| ((oldProps: Record<string, unknown>) => Record<string, unknown>),
		) => {
			if (composition === null) {
				return;
			}

			updateProps({
				id: composition.id,
				defaultProps: composition.defaultProps as Record<string, unknown>,
				newProps,
			});
		},
		[composition, updateProps],
	);

	const actualProps = useMemo(() => {
		if (composition === null) {
			return {};
		}

		return props[composition.id] ?? composition.defaultProps ?? {};
	}, [composition, props]);

	const unsavedChangesExist = useMemo(() => {
		if (composition === null || composition.defaultProps === undefined) {
			return false;
		}

		return !deepEqual(composition.defaultProps, actualProps);
	}, [actualProps, composition]);

	if (composition === null) {
		return null;
	}

	return (
		<div style={container} className="css-reset">
			<div style={tabsContainer}>
				<Tabs>
					<Tab
						selected={panel === 'input-props'}
						onClick={onPropsSelected}
						style={{justifyContent: 'space-between'}}
					>
						Props
						{unsavedChangesExist ? (
							<div title={saveToolTip} style={circleStyle} />
						) : null}
					</Tab>
					<RendersTab
						onClick={onRendersSelected}
						selected={panel === 'renders'}
					/>
				</Tabs>
			</div>
			{panel === 'renders' ? (
				<RenderQueue />
			) : (
				<DataEditor
					key={composition.id}
					unresolvedComposition={composition}
					inputProps={actualProps}
					setInputProps={setInputProps}
					mayShowSaveButton
					propsEditType="default-props"
					saving={saving}
					setSaving={setSaving}
				/>
			)}
		</div>
	);
};
