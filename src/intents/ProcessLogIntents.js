import Immutable from 'immutable';
import Intent from 'insula/src/Intent';
import parseCsv from 'csv-parse';
import {processLogLine} from 'LogLineProcessor';

export const InitializeLogDetailsIntent = Intent('InitializeLogDetailsIntent', () => Immutable.fromJS({
	isLoading: true,
	processedLines: 0,
	results: {
		functionsByStartAddr: {},
		functionsByFuncAddr: {}
	}
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
		quote: '""', // pretend nothing is quoted
		relax_column_count: true // column count depends on what type of signal the line is
	});
	parser.on('data', lineDetails => dispatch('ProcessLogLineIntent', lineDetails));
	parser.on('finish', () => dispatch('FinishProcessingLogIntent'));

	setTimeout(() => parser.end(logContents));
});