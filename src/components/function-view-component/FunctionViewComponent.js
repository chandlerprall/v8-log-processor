import React, {PureComponent, PropTypes} from 'react';
import classnames from 'classnames';
import connect from 'react-insula/src/connect';
import Transformer from 'insula/src/Transformer';
import {getCallPathIdFromFunctionStack, CodeState, CodeStateLookupReverse} from 'LogLineProcessor';

export const VIEW_CALLS_DOWN = 'functionView/VIEW_CALLS_DOWN';
export const VIEW_CALLS_UP = 'functionView/VIEW_CALLS_UP';

function percOf(value, of) {
	return (value * 100 / of).toFixed(1);
}

class FunctionViewComponent extends PureComponent {
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
		const {totalTicks, callPathExecutions, callPathTraversals, func, stack, indent, direction} = this.props;

		const subFuncAccessor = direction === VIEW_CALLS_DOWN ? 'child' : 'parent';

		const subPaths = func[direction === VIEW_CALLS_DOWN ? 'childPaths' : 'parentPaths']
			// filter out any subPaths who don't have traversals on this stack
			.filter(subPath => {
				const pathId = getCallPathIdFromFunctionStack([...stack, subPath[subFuncAccessor]]);
				return callPathTraversals[pathId] > 0;
			})
			// sort subPaths so those with more traversals are at the top
			.sort((a, b) => {
				const aPathId = getCallPathIdFromFunctionStack([...stack, a[subFuncAccessor]]);
				const bPathId = getCallPathIdFromFunctionStack([...stack, b[subFuncAccessor]]);
				const aTraversals = callPathTraversals[aPathId];
				const bTraversals = callPathTraversals[bPathId];
				if (aTraversals < bTraversals) return 1;
				if (aTraversals > bTraversals) return -1;
				return 0;
			});

		const expandable = subPaths.length > 0;
		const callPathId = getCallPathIdFromFunctionStack(stack);
		const callPathExecutionCount = callPathExecutions[callPathId] || 0;
		// const callPathExecutionCount = func.executions;
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
							const subFunc = path[subFuncAccessor];
							return <ConnectedFunctionViewComponent key={subFunc.id}
												   func={subFunc}
												   stack={[...stack, subFunc]}
												   direction={direction} indent={indent + 1}/>
						})}
					</div>
				</div>
			</div>
		);
	}
}

FunctionViewComponent.displayName = 'FunctionViewComponent';

FunctionViewComponent.propTypes = {
	defaultOpen: PropTypes.bool.isRequired,
	func: PropTypes.shape({
		name: PropTypes.string.isRequired,
		executions: PropTypes.number.isRequired,
		childPaths: PropTypes.array.isRequired,
		parentPaths: PropTypes.array.isRequired
	}).isRequired,
	direction: PropTypes.oneOf([VIEW_CALLS_DOWN, VIEW_CALLS_UP]).isRequired,
	indent: PropTypes.number.isRequired,
	stack: PropTypes.array.isRequired,
	totalTicks: PropTypes.number.isRequired,
	callPathExecutions: PropTypes.object.isRequired,
	callPathTraversals: PropTypes.object.isRequired
};

FunctionViewComponent.defaultProps = {
	defaultOpen: false,
	indent: 0,
	stack: []
};

const ConnectedFunctionViewComponent = connect(Transformer(
	[
		'logDetails.results.totalTicks',
		'logDetails.results.callPathExecutions',
		'logDetails.results.callPathTraversals'
	],
	([totalTicks, callPathExecutions, callPathTraversals]) => {
		return {totalTicks, callPathExecutions, callPathTraversals};
	}
))(FunctionViewComponent);

export default ConnectedFunctionViewComponent;