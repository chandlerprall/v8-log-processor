import Immutable from 'immutable';
import Intent from 'insula/src/Intent';
import parseCsv from 'csv-parse';
import {processLogLine} from 'LogLineProcessor';
import createTree from 'RBTree';

export const InitializeLogDetailsIntent = Intent('InitializeLogDetailsIntent', () => new Immutable.Map({
	isLoading: true,
	results: new Immutable.Map({
		totalTicks: 0,
		functionsByStartAddr: createTree(),
		callPathExecutions: {},
		callPathTraversals: {},
		functionsByFuncAddr: {}
	})
}));

export const FinishProcessingLogIntent = Intent('FinishProcessingLogIntent', logDetails => logDetails.set('isLoading', false));

export const ProcessLogLineIntent = Intent('ProcessLogLineIntent', (logDetails, columns) => {
	return logDetails.update(
		'results',
		results => processLogLine(results, columns)
	);
});

export const ProcessLogIntent = Intent('ProcessLogIntent', (logDetails, logContents, {dispatch}) => {
	dispatch('InitializeLogDetailsIntent');

	const parser = parseCsv({
		// quote: '""', // pretend nothing is quoted
		relax: true,
		relax_column_count: true // column count depends on what type of signal the line is
	});
	parser.on('data', lineDetails => dispatch('ProcessLogLineIntent', lineDetails));
	parser.on('finish', () => dispatch('FinishProcessingLogIntent'));

	window.logDetails = logDetails;

	setTimeout(() => parser.end(logContents));
});