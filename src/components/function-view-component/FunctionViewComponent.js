import React, {PureComponent, PropTypes} from 'react';

export const VIEW_CALLS_DOWN = 'functionView/VIEW_CALLS_DOWN';
export const VIEW_CALLS_UP = 'functionView/VIEW_CALLS_UP';

export default class FunctionViewComponent extends PureComponent {
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
		const {func, indent, direction} = this.props;

		const subFuncAccessor = direction === VIEW_CALLS_DOWN ? 'child' : 'parent';

		const subPaths = func[direction === VIEW_CALLS_DOWN ? 'childPaths' : 'parentPaths']
			// sort subPaths so those with more traversals are at the top
			.sort((a, b) => {
				if (a.traversals < b.traversals) return 1;
				if (a.traversals > b.traversals) return -1;

				const aSubfuncExecutions = a[subFuncAccessor].executions;
				const bSubfuncExecutions = b[subFuncAccessor].executions;
				if (aSubfuncExecutions < bSubfuncExecutions) return 1;
				if (aSubfuncExecutions > bSubfuncExecutions) return -1;

				return 0;
			});
		const traversals = subPaths.reduce(
			(traversals, path) => traversals + path.traversals,
			0
		);

		const expandable = subPaths.length > 1 || (subPaths.length === 1 && subPaths[0][subFuncAccessor] !== func);

		return (
			<div className="wrapper">
				<div className="funcDetails row">
					<div className="functionName col-xs-10" style={{paddingLeft: `${indent * 20}px`}} onDoubleClick={expandable ? () => this.toggleIsOpen() : null}>
							<span className="expandoWrapper">
								<span display-if={expandable} onClick={() => this.toggleIsOpen()}>
									{isOpen ? <span className="expando">&#8681;</span> : <span className="expando">&#8680;</span>}
								</span>
							</span>
						{func.name}
					</div>
					<div className="col-xs-1">{traversals}</div>
					<div className="col-xs-1">{func.executions}</div>
				</div>
				<div className="row">
					<div display-if={isOpen} className="col-xs-12">
						{subPaths.map(path => {
							const subFunc = path[subFuncAccessor];
							return <FunctionViewComponent key={subFunc.startAddr}
												   expandable={subFunc !== func}
												   func={subFunc}
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
	indent: PropTypes.number.isRequired
};

FunctionViewComponent.defaultProps = {
	defaultOpen: false,
	indent: 0
};