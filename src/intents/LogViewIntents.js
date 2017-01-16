import Intent from 'insula/src/Intent';

export const SelectLogViewIntent = Intent('SelectLogViewIntent', (logView, selectedView) => logView.set('selectedView', selectedView));