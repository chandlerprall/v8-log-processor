import Immutable from 'immutable';
import Store from 'insula/src/Store';
import Section from 'insula/src/Section';
import {LogImportDragOverIntent, LogImportDragLeaveIntent, LogImportDropIntent} from 'LogImportIntents';
import {ProcessLogIntent, InitializeLogDetailsIntent, ProcessLogLineIntent, FinishProcessingLogIntent} from 'ProcessLogIntents';

class ImmutableStore extends Store {
	constructor(...args) {
		super(...args);
	}

	mapSelectorToSectionName(sectionSelector) {
		return sectionSelector.split('.')[0];
	}

	getValuesForSelectors(sectionSelectors) {
		return sectionSelectors.map(sectionSelector => {
			const valueSelectors = sectionSelector.split('.');
			const [sectionName, ...selectors] = valueSelectors;
			const section = this.sections[sectionName];

			if (section == null) return null;

			const sectionValue = section.value;
			if (selectors.length === 0) {
				return sectionValue;
			} else {
				return sectionValue.getIn(selectors);
			}
		});
	}

	isTransformerOutputDifferent(a, b) {
		if (a.equals && b.equals) {
			return !a.equals(b);
		} else {
			return a !== b;
		}
	}

	isTransformerInputDifferent(a, b) {
		for (let i = 0; i < a.length; i++) {
			if (a[i].equals && b[i].equals) {
				if (!a[i].equals(b[i])) return true;
			} else {
				if (a[i] !== b[i]) return true;
			}
		}
		return false;
	}
}

export default new ImmutableStore({
	sections: {
		logImport: Section(Immutable.fromJS({isDragging: false}), LogImportDragOverIntent, LogImportDragLeaveIntent, LogImportDropIntent),
		logDetails: Section(Immutable.fromJS({}), ProcessLogIntent, InitializeLogDetailsIntent, ProcessLogLineIntent, FinishProcessingLogIntent)
	}
});