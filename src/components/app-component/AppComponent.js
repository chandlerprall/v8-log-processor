import React from 'react';
import InsulaProvider from 'react-insula/src/Insula';
import store from 'AppStore';
import LogImportComponent from 'LogImportComponent';
import LogViewComponent from 'LogViewComponent';

export default function AppComponent() {
	return (
		<InsulaProvider store={store}>
			<div className="row">
				<div className="col-xs-12">
					<LogImportComponent/>
					<LogViewComponent/>
				</div>
			</div>
		</InsulaProvider>
	);
}

AppComponent.displayName = 'AppComponent';