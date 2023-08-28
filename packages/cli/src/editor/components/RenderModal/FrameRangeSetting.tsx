import React, {useCallback} from 'react';
import {label, optionRow, rightRow} from './layout';
import {MultiRangeSlider} from './MultiRangeSlider';

const numberWrapper: React.CSSProperties = {
	minWidth: '39px',
	display: 'flex',
	justifyContent: 'flex-end',
	alignItems: 'center',
	fontSize: '14px',
};

export const FrameRangeSetting: React.FC<{
	startFrame: number;
	endFrame: number;
	setEndFrame: React.Dispatch<React.SetStateAction<number | null>>;
	setStartFrame: React.Dispatch<React.SetStateAction<number | null>>;
	durationInFrames: number;
}> = ({startFrame, endFrame, setEndFrame, durationInFrames, setStartFrame}) => {
	const minStartFrame = 0;

	const maxEndFrame = durationInFrames - 1;

	const onStartFrameChangedDirectly = useCallback(
		(newStartFrame: number) => {
			setStartFrame(newStartFrame);
		},
		[setStartFrame],
	);

	const onEndFrameChangedDirectly = useCallback(
		(newEndFrame: number) => {
			setEndFrame(newEndFrame);
		},
		[setEndFrame],
	);

	return (
		<div style={optionRow}>
			<div style={label}>Frame range</div>
			<div style={rightRow}>
				<div style={numberWrapper}>{startFrame}</div>
				<MultiRangeSlider
					min={minStartFrame}
					max={maxEndFrame}
					start={startFrame}
					end={endFrame}
					step={1}
					onLeftThumbDrag={onStartFrameChangedDirectly}
					onRightThumbDrag={onEndFrameChangedDirectly}
				/>
				<div style={numberWrapper}>{endFrame}</div>
			</div>
		</div>
	);
};
