import React, {PropTypes} from 'react';
import classnames from 'classnames';

export default function RadioButtonComponent({active, children, onSelect}) {
	return (
		<div className={classnames('radioButton', {active})} onClick={onSelect}>{children}</div>
	);
}

RadioButtonComponent.displayName = 'RadioButtonComponent';

RadioButtonComponent.propTypes = {
	active: PropTypes.bool.isRequired,
	children: PropTypes.node.isRequired,
	onSelect: PropTypes.func.isRequired
};