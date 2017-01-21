import React, {PureComponent, PropTypes} from 'react';
import classnames from 'classnames';
import connect from 'react-insula/src/connect';
import Transformer from 'insula/src/Transformer';
import {getCallPathIdFromFunctionStack, CodeState, CodeStateLookupReverse} from 'LogLineProcessor';

function percOf(value, of) {
	return (value * 100 / of).toFixed(1);
}

function getTraversals(func) {
	return func.parentPaths.reduce(
		(traversals, path) => traversals + path.traversals,
		0
	);
}

class BottomupFunctionComponent extends PureComponent {
	constructor(...args) {
		super(...args);

		this.state = {
			isOpen: this.props.defaultOpen
		};
	}

	toggleIsOpen() {
		this.setState({isOpen: !this.state.isOpen});
	}

	render() {
		const {isOpen} = this.state;
		const {totalTicks, callPathExecutions, callPathTraversals, func, stack, indent} = this.props;

		const subPaths = func.parentPaths
			// filter out any subPaths who don't have traversals on this stack
			.filter(subPath => {
				if (subPath.parent === func) return false;
				return getTraversals(subPath.parent) > 0;
			})
			// sort subPaths so those with more traversals are at the top
			.sort((a, b) => {
				const aTraversals = getTraversals(a.parent);
				const bTraversals = getTraversals(b.parent);
				if (aTraversals < bTraversals) return 1;
				if (aTraversals > bTraversals) return -1;
				return 0;
			});

		const expandable = subPaths.length > 0;
		const callPathExecutionCount = func.executions;
		const traversals = getTraversals(func);

		return (
			<div className="wrapper">
				<div className="funcDetails row">
					<div className={classnames('functionInfo', 'col-xs-8', `type-${func.type.toLowerCase()}`)}
						 style={{paddingLeft: `${(expandable ? indent : indent-1) * 20}px`}}
						 onDoubleClick={expandable ? () => this.toggleIsOpen() : null}>
							<span className="expandoWrapper">
								<span display-if={expandable} onClick={() => this.toggleIsOpen()}>
									{isOpen ? <span className="expando">&#8681;</span> : <span className="expando">&#8680;</span>}
								</span>
							</span>
						<span className={classnames('functionState', {optimizable: func.state === CodeState.OPTIMIZABLE, optimized: func.state === CodeState.OPTIMIZED})}>{CodeStateLookupReverse[func.state]}</span>
						<span className="functionName">{func.name}</span>
						<span className="functionType"> ({func.type})</span>
					</div>
					<div className="col-xs-2">{traversals} ({percOf(traversals, totalTicks)}%)</div>
					<div className="col-xs-2">{callPathExecutionCount} ({percOf(callPathExecutionCount, totalTicks)}%)</div>
				</div>
				<div className="row">
					<div display-if={isOpen} className="col-xs-12">
						{subPaths.map(path => {
							const subFunc = path.parent;
							return <ConnectedBottomupFunctionComponent key={subFunc.id}
												   func={subFunc}
												   stack={[...stack, subFunc]}
												   indent={indent + 1}/>
						})}
					</div>
				</div>
			</div>
		);
	}
}

BottomupFunctionComponent.displayName = 'BottomupFunctionComponent';

BottomupFunctionComponent.propTypes = {
	defaultOpen: PropTypes.bool.isRequired,
	func: PropTypes.shape({
		name: PropTypes.string.isRequired,
		executions: PropTypes.number.isRequired,
		parentPaths: PropTypes.array.isRequired
	}).isRequired,
	indent: PropTypes.number.isRequired,
	stack: PropTypes.array.isRequired,
	totalTicks: PropTypes.number.isRequired,
	callPathExecutions: PropTypes.object.isRequired,
	callPathTraversals: PropTypes.object.isRequired
};

BottomupFunctionComponent.defaultProps = {
	defaultOpen: false,
	indent: 0,
	stack: []
};

const ConnectedBottomupFunctionComponent = connect(Transformer(
	[
		'logDetails.results.totalTicks',
		'logDetails.results.callPathExecutions',
		'logDetails.results.callPathTraversals'
	],
	([totalTicks, callPathExecutions, callPathTraversals]) => {
		return {totalTicks, callPathExecutions, callPathTraversals};
	}
))(BottomupFunctionComponent);

export default ConnectedBottomupFunctionComponent;