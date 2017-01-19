import React, {PropTypes} from 'react';
import connect from 'react-insula/src/connect';
import Transformer from 'insula/src/Transformer';
import FunctionViewComponent, {VIEW_CALLS_UP} from 'FunctionViewComponent';

function BottomUpComponent({entryPoints}) {
	return (
		<div>
			<div className="row">
				<div className="col-xs-8">function</div>
				<div className="col-xs-2">total</div>
				<div className="col-xs-2">self</div>
			</div>
			{entryPoints.map(entryPoint => (
				<FunctionViewComponent key={entryPoint.startAddr} stack={[entryPoint]} func={entryPoint} direction={VIEW_CALLS_UP}/>
			))}
		</div>
	);
}

BottomUpComponent.displayName = 'BottomUpComponent';

BottomUpComponent.propTypes = {
	entryPoints: PropTypes.array.isRequired
};

function getEntryPoints(functionsByStartAddr) {
	let entryPoints = [];
	let allFunctions = functionsByStartAddr.values;
	for (let i = 0; i < allFunctions.length; i++) {
		if (allFunctions[i].executions > 0 && allFunctions[i].parentPaths.length > 0) {
			entryPoints.push(allFunctions[i]);
		}
	}

	entryPoints.sort((a, b) => {
		if (a.executions < b.executions) return 1;
		if (a.executions > b.executions) return -1;
		return 0;
	});

	return entryPoints;
}

export default connect(Transformer(
	['logDetails.results'],
	([results]) => {
		return {
			entryPoints: getEntryPoints(results.get('functionsByStartAddr'))
		};
	}
))(BottomUpComponent);