import Intent from 'insula/src/Intent';

export const LogImportDragOverIntent = Intent('LogImportDragOverIntent', (logImport, e) => {
	e.preventDefault();
	return logImport.set('isDragging', true);
});

export const LogImportDragLeaveIntent = Intent('LogImportDragLeaveIntent', logImport => {
	return logImport.set('isDragging', false);
});

export const LogImportDropIntent = Intent('LogImportDropIntent', (logImport, event, {dispatch}) => {
	dispatch('LogImportDragLeaveIntent');

	const file = event.dataTransfer.files[0];
	const reader = new FileReader();
	reader.onload = (e) => {
		dispatch('ProcessLogIntent', e.target.result);
	};
	reader.readAsText(file);
});