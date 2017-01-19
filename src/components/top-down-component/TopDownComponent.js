import React, {PropTypes} from 'react';
import connect from 'react-insula/src/connect';
import Transformer from 'insula/src/Transformer';
import FunctionViewComponent, {VIEW_CALLS_DOWN} from 'FunctionViewComponent';

function TopDownComponent({entryPoints}) {
	return (
		<div>
			<div className="row">
				<div className="col-xs-8">code</div>
				<div className="col-xs-2">total calls</div>
				<div className="col-xs-2">self</div>
			</div>
			{entryPoints.map(entryPoint => (
				<FunctionViewComponent key={entryPoint.startAddr} stack={[entryPoint]} func={entryPoint} direction={VIEW_CALLS_DOWN}/>
			))}
		</div>
	);
}

TopDownComponent.displayName = 'TopDownComponent';

TopDownComponent.propTypes = {
	entryPoints: PropTypes.array.isRequired
};

function getEntryPoints(functionsByStartAddr) {
	let entryPoints = [];
	let allFunctions = functionsByStartAddr.values;
	for (let i = 0; i < allFunctions.length; i++) {
		if (allFunctions[i].parentPaths.length === 0 && allFunctions[i].childPaths.length > 0) {
			entryPoints.push(allFunctions[i]);
		}
	}
	return entryPoints;
}

export default connect(Transformer(
	['logDetails.results'],
	([results]) => {
		return {
			entryPoints: getEntryPoints(results.get('functionsByStartAddr'))
		};
	}
))(TopDownComponent);