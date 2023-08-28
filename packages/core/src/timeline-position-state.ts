import type {MutableRefObject} from 'react';
import {createContext, useContext, useMemo} from 'react';
import {useVideo} from './use-video.js';

export type PlayableMediaTag = {
	play: () => void;
	id: string;
};

export type TimelineContextValue = {
	frame: Record<string, number>;
	playing: boolean;
	rootId: string;
	playbackRate: number;
	imperativePlaying: MutableRefObject<boolean>;
	setPlaybackRate: (u: React.SetStateAction<number>) => void;
	audioAndVideoTags: MutableRefObject<PlayableMediaTag[]>;
};

export type SetTimelineContextValue = {
	setFrame: (u: React.SetStateAction<Record<string, number>>) => void;
	setPlaying: (u: React.SetStateAction<boolean>) => void;
};

export const TimelineContext = createContext<TimelineContextValue>({
	frame: {},
	playing: false,
	playbackRate: 1,
	rootId: '',
	imperativePlaying: {
		current: false,
	},
	setPlaybackRate: () => {
		throw new Error('default');
	},
	audioAndVideoTags: {current: []},
});

export const SetTimelineContext = createContext<SetTimelineContextValue>({
	setFrame: () => {
		throw new Error('default');
	},
	setPlaying: () => {
		throw new Error('default');
	},
});

const makeKey = (composition: string) => {
	return `remotion.time.${composition}`;
};

export const persistCurrentFrame = (frame: number, composition: string) => {
	localStorage.setItem(makeKey(composition), String(frame));
};

export const getFrameForComposition = (composition: string) => {
	const frame = localStorage.getItem(makeKey(composition));
	return frame
		? Number(frame)
		: (typeof window === 'undefined' ? 0 : window.remotion_initialFrame ?? 0) ??
				0;
};

export const useTimelinePosition = (): number => {
	const videoConfig = useVideo();
	const state = useContext(TimelineContext);

	if (!videoConfig) {
		return typeof window === 'undefined'
			? 0
			: window.remotion_initialFrame ?? 0;
	}

	const unclamped =
		state.frame[videoConfig.id] ??
		(typeof window !== 'undefined' && window.remotion_isPlayer
			? 0
			: getFrameForComposition(videoConfig.id));

	return Math.min(videoConfig.durationInFrames - 1, unclamped);
};

export const useTimelineSetFrame = (): ((
	u: React.SetStateAction<Record<string, number>>,
) => void) => {
	const {setFrame} = useContext(SetTimelineContext);
	return setFrame;
};

type PlayingReturnType = readonly [
	boolean,
	(u: React.SetStateAction<boolean>) => void,
	MutableRefObject<boolean>,
];

export const usePlayingState = (): PlayingReturnType => {
	const {playing, imperativePlaying} = useContext(TimelineContext);
	const {setPlaying} = useContext(SetTimelineContext);

	return useMemo(
		() => [playing, setPlaying, imperativePlaying],
		[imperativePlaying, playing, setPlaying],
	);
};
