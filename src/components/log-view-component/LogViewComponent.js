import React from 'react';
import connect from 'react-insula/src/connect';
import Transformer from 'insula/src/Transformer';

function LogViewComponent({hasLogFile, details}) {
	const {
		isLoading = false,
	} = details || {};

	return (
		<div display-if={hasLogFile}>
			<div display-if={isLoading}>Loading log file...</div>
		</div>
	)
}

LogViewComponent.displayName = 'LogViewComponent';

export default connect(Transformer(
	['logDetails'],
	([logDetails]) => {
		return {
			hasLogFile: !logDetails.isEmpty(),
			details: logDetails ? logDetails.toJS() : {},
		}
	}
))(LogViewComponent);