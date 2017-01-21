import React, {PropTypes} from 'react';
import connect from 'react-insula/src/connect';
import Transformer from 'insula/src/Transformer';
import TopdownFunctionComponent from 'TopdownFunctionComponent';

function TopDownComponent({entryPoints}) {
	return (
		<div>
			<div className="row">
				<div className="col-xs-8">function</div>
				<div className="col-xs-2">total</div>
				<div className="col-xs-2">self</div>
			</div>
			{entryPoints.map(entryPoint => (
				<TopdownFunctionComponent key={entryPoint.id} stack={[entryPoint]} func={entryPoint}/>
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
		if (allFunctions[i].parentPaths.length === 0 && (allFunctions[i].childPaths.length > 0 || allFunctions[i].executions > 0)) {
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