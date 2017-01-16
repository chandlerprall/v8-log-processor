import React, {PropTypes} from 'react';
import connect from 'react-insula/src/connect';
import Transformer from 'insula/src/Transformer';
import RadioButtonComponent from 'RadioButtonComponent';
import TopDownComponent from 'TopDownComponent';

const VIEW_TOP_DOWN = 'logView/VIEW_TOP_DOWN';
const VIEW_BOTTOM_UP = 'logView/VIEW_BOTTOM_UP';

function LogViewComponent({hasLogFile, details, selectedView, dispatch}) {
	const {
		isLoading = false,
	} = details || {};

	return (
		<div display-if={hasLogFile}>
			<div display-if={isLoading}>Loading log file...</div>
			<div display-if={!isLoading}>
				<div className="viewTypeSelector">
					<RadioButtonComponent active={selectedView === VIEW_TOP_DOWN} onSelect={() => dispatch('SelectLogViewIntent', VIEW_TOP_DOWN)}>Top Down</RadioButtonComponent>
					<RadioButtonComponent active={selectedView === VIEW_BOTTOM_UP} onSelect={() => dispatch('SelectLogViewIntent', VIEW_BOTTOM_UP)}>Bottom Up</RadioButtonComponent>
				</div>

				<TopDownComponent display-if={selectedView === VIEW_TOP_DOWN}/>
			</div>
		</div>
	)
}

LogViewComponent.displayName = 'LogViewComponent';

LogViewComponent.propTypes = {
	hasLogFile: PropTypes.bool.isRequired,
	details: PropTypes.shape({
		isLoading: PropTypes.bool
	}),
	selectedView: PropTypes.oneOf([VIEW_TOP_DOWN, VIEW_BOTTOM_UP]).isRequired,
	dispatch: PropTypes.func.isRequired
};

export default connect(Transformer(
	['logDetails', 'logView'],
	([logDetails, logView]) => {
		return {
			hasLogFile: !logDetails.isEmpty(),
			details: logDetails ? logDetails.toJS() : {},
			selectedView: logView.get('selectedView', VIEW_TOP_DOWN)
		}
	}
))(LogViewComponent);