import type {Size} from '@remotion/player';
import React, {useCallback, useContext, useEffect, useMemo} from 'react';
import {useMobileLayout} from '../helpers/mobile-layout';
import {useBreakpoint} from '../helpers/use-breakpoint';
import {RULER_WIDTH} from '../state/editor-rulers';
import {SidebarContext} from '../state/sidebar';
import {CanvasOrLoading} from './CanvasOrLoading';
import {
	CurrentCompositionKeybindings,
	TitleUpdater,
} from './CurrentCompositionSideEffects';
import {useIsRulerVisible} from './EditorRuler/use-is-ruler-visible';
import {ExplorerPanel} from './ExplorerPanel';
import MobilePanel from './MobilePanel';
import {OptionsPanel} from './OptionsPanel';
import {PreviewToolbar} from './PreviewToolbar';
import {SplitterContainer} from './Splitter/SplitterContainer';
import {SplitterElement} from './Splitter/SplitterElement';
import {SplitterHandle} from './Splitter/SplitterHandle';

const container: React.CSSProperties = {
	height: '100%',
	width: '100%',
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
};

const row: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'row',
	flex: 1,
	minHeight: 0,
};

export const useResponsiveSidebarStatus = (): 'collapsed' | 'expanded' => {
	const {sidebarCollapsedStateLeft} = useContext(SidebarContext);
	const responsiveLeftStatus = useBreakpoint(1200) ? 'collapsed' : 'expanded';

	const actualStateLeft = useMemo((): 'expanded' | 'collapsed' => {
		if (sidebarCollapsedStateLeft === 'collapsed') {
			return 'collapsed';
		}

		if (sidebarCollapsedStateLeft === 'expanded') {
			return 'expanded';
		}

		return responsiveLeftStatus;
	}, [sidebarCollapsedStateLeft, responsiveLeftStatus]);

	return actualStateLeft;
};

export const TopPanel: React.FC<{
	readonly readOnlyStudio: boolean;
	readonly onMounted: () => void;
	readonly size: Size | null;
	readonly drawRef: React.RefObject<HTMLDivElement>;
	readonly bufferStateDelayInMilliseconds: number;
}> = ({
	readOnlyStudio,
	onMounted,
	size,
	drawRef,
	bufferStateDelayInMilliseconds,
}) => {
	const {setSidebarCollapsedState, sidebarCollapsedStateRight} =
		useContext(SidebarContext);
	const rulersAreVisible = useIsRulerVisible();

	const actualStateLeft = useResponsiveSidebarStatus();

	const actualStateRight = useMemo((): 'expanded' | 'collapsed' => {
		if (sidebarCollapsedStateRight === 'collapsed') {
			return 'collapsed';
		}

		return 'expanded';
	}, [sidebarCollapsedStateRight]);

	const hasSize = size !== null;

	useEffect(() => {
		onMounted();
	}, [hasSize, onMounted]);

	const canvasContainerStyle: React.CSSProperties = useMemo(
		() => ({
			flex: 1,
			display: 'flex',
			paddingTop: rulersAreVisible ? RULER_WIDTH : 0,
			paddingLeft: rulersAreVisible ? RULER_WIDTH : 0,
		}),
		[rulersAreVisible],
	);

	const sizeWithRulersApplied = useMemo(() => {
		if (!rulersAreVisible) {
			return size;
		}

		if (!size) {
			return null;
		}

		return {
			...size,
			width: size.width - RULER_WIDTH,
			height: size.height - RULER_WIDTH,
		};
	}, [rulersAreVisible, size]);

	const onCollapseLeft = useCallback(() => {
		setSidebarCollapsedState({left: 'collapsed', right: null});
	}, [setSidebarCollapsedState]);

	const onCollapseRight = useCallback(() => {
		setSidebarCollapsedState({left: null, right: 'collapsed'});
	}, [setSidebarCollapsedState]);

	const isMobileLayout = useMobileLayout();

	return (
		<div style={container}>
			<div style={row}>
				<SplitterContainer
					minFlex={0.15}
					maxFlex={0.4}
					defaultFlex={0.2}
					id="sidebar-to-preview"
					orientation="vertical"
				>
					{actualStateLeft === 'expanded' ? (
						isMobileLayout ? (
							<MobilePanel onClose={onCollapseLeft}>
								<ExplorerPanel readOnlyStudio={readOnlyStudio} />
							</MobilePanel>
						) : (
							<SplitterElement sticky={null} type="flexer">
								<ExplorerPanel readOnlyStudio={readOnlyStudio} />
							</SplitterElement>
						)
					) : null}
					{actualStateLeft === 'expanded' ? (
						<SplitterHandle
							allowToCollapse="left"
							onCollapse={onCollapseLeft}
						/>
					) : null}
					<SplitterElement sticky={null} type="anti-flexer">
						<SplitterContainer
							minFlex={0.5}
							maxFlex={0.8}
							defaultFlex={0.7}
							id="canvas-to-right-sidebar"
							orientation="vertical"
						>
							<SplitterElement sticky={null} type="flexer">
								<div ref={drawRef} style={canvasContainerStyle}>
									{sizeWithRulersApplied ? (
										<CanvasOrLoading size={sizeWithRulersApplied} />
									) : null}
								</div>
							</SplitterElement>
							{actualStateRight === 'expanded' ? (
								<SplitterHandle
									allowToCollapse="right"
									onCollapse={onCollapseRight}
								/>
							) : null}
							{actualStateRight === 'expanded' ? (
								isMobileLayout ? (
									<MobilePanel onClose={onCollapseRight}>
										<OptionsPanel readOnlyStudio={readOnlyStudio} />
									</MobilePanel>
								) : (
									<SplitterElement sticky={null} type="anti-flexer">
										<OptionsPanel readOnlyStudio={readOnlyStudio} />
									</SplitterElement>
								)
							) : null}
						</SplitterContainer>
					</SplitterElement>
				</SplitterContainer>
			</div>
			<PreviewToolbar
				bufferStateDelayInMilliseconds={bufferStateDelayInMilliseconds}
				readOnlyStudio={readOnlyStudio}
			/>
			<CurrentCompositionKeybindings readOnlyStudio={readOnlyStudio} />
			<TitleUpdater />
		</div>
	);
};
