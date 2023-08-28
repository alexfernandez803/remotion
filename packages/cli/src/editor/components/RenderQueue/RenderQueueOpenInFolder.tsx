import React, {useCallback, useMemo} from 'react';
import type {RenderJob} from '../../../preview-server/render-queue/job';
import {ExpandedFolderIconSolid} from '../../icons/folder';
import type {RenderInlineAction} from '../InlineAction';
import {InlineAction} from '../InlineAction';
import {sendErrorNotification} from '../Notifications/NotificationCenter';
import {openInFileExplorer} from './actions';

export const RenderQueueOpenInFinderItem: React.FC<{job: RenderJob}> = ({
	job,
}) => {
	const onClick = useCallback(() => {
		openInFileExplorer({directory: job.outName}).catch((err) => {
			sendErrorNotification(`Could not open file: ${err.message}`);
		});
	}, [job.outName]);

	const icon: React.CSSProperties = useMemo(() => {
		return {
			height: 12,
			color: 'currentColor',
		};
	}, []);

	const renderAction: RenderInlineAction = useCallback(
		(color) => {
			return <ExpandedFolderIconSolid style={icon} color={color} />;
		},
		[icon],
	);

	return <InlineAction renderAction={renderAction} onClick={onClick} />;
};
