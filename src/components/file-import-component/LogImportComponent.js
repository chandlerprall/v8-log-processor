import React from 'react';
import classnames from 'classnames';
import connect from 'react-insula/src/connect';
import Transformer from 'insula/src/Transformer';

function FileImportComponent({isVisible, isDragging, onDragOver, onDragLeave, onDrop, dispatch}) {
	return (
		<div display-if={isVisible} className="row">
			<div className={classnames('col-xs-12', 'dropzone', {isDragging})}
			     onDragOver={e => dispatch(onDragOver, e)}
			     onDragLeave={() => dispatch(onDragLeave)}
				 onDrop={e => {
				    dispatch(onDrop, e);
				    e.preventDefault();
				    return false;
				 }}>
				<p>Drag and drop a v8 log file here to start.</p>
			</div>
		</div>
	);
}

FileImportComponent.displayName = 'FileImportComponent';

export default connect(Transformer(
	['logImport', 'logDetails'],
	([logImport, logDetails]) => {
		return {
			isVisible: logDetails.isEmpty(),
			isDragging: logImport.get('isDragging'),
			onDragOver: 'LogImportDragOverIntent',
			onDragLeave: 'LogImportDragLeaveIntent',
			onDrop: 'LogImportDropIntent',
		};
	}
))(FileImportComponent);