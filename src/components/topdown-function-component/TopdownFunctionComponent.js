import React, {PureComponent, PropTypes} from 'react';
import classnames from 'classnames';
import connect from 'react-insula/src/connect';
import Transformer from 'insula/src/Transformer';
import {getCallPathIdFromFunctionStack, CodeState, CodeStateLookupReverse} from 'LogLineProcessor';

function percOf(value, of) {
	return (value * 100 / of).toFixed(1);
}

class TopdownFunctionComponent extends PureComponent {
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

		const subPaths = func.childPaths
			// filter out any subPaths who don't have traversals on this stack
			.filter(subPath => {
				const pathId = getCallPathIdFromFunctionStack([...stack, subPath.child]);
				return callPathTraversals[pathId] > 0;
			})
			// sort subPaths so those with more traversals are at the top
			.sort((a, b) => {
				const aPathId = getCallPathIdFromFunctionStack([...stack, a.child]);
				const bPathId = getCallPathIdFromFunctionStack([...stack, b.child]);
				const aTraversals = callPathTraversals[aPathId];
				const bTraversals = callPathTraversals[bPathId];
				if (aTraversals < bTraversals) return 1;
				if (aTraversals > bTraversals) return -1;
				return 0;
			});

		const expandable = subPaths.length > 0;
		const callPathId = getCallPathIdFromFunctionStack(stack);
		const callPathExecutionCount = callPathExecutions[callPathId] || 0;
		const traversals = callPathTraversals[callPathId] || 0;

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
							const subFunc = path.child;
							return <ConnectedTopdownFunctionComponent key={subFunc.id}
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

TopdownFunctionComponent.displayName = 'TopdownFunctionComponent';

TopdownFunctionComponent.propTypes = {
	defaultOpen: PropTypes.bool.isRequired,
	func: PropTypes.shape({
		name: PropTypes.string.isRequired,
		executions: PropTypes.number.isRequired,
		childPaths: PropTypes.array.isRequired,
	}).isRequired,
	indent: PropTypes.number.isRequired,
	stack: PropTypes.array.isRequired,
	totalTicks: PropTypes.number.isRequired,
	callPathExecutions: PropTypes.object.isRequired,
	callPathTraversals: PropTypes.object.isRequired
};

TopdownFunctionComponent.defaultProps = {
	defaultOpen: false,
	indent: 0,
	stack: []
};

const ConnectedTopdownFunctionComponent = connect(Transformer(
	[
		'logDetails.results.totalTicks',
		'logDetails.results.callPathExecutions',
		'logDetails.results.callPathTraversals'
	],
	([totalTicks, callPathExecutions, callPathTraversals]) => {
		return {totalTicks, callPathExecutions, callPathTraversals};
	}
))(TopdownFunctionComponent);

export default ConnectedTopdownFunctionComponent;