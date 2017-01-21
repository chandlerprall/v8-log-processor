const {app, BrowserWindow} = require('electron');

let gui;

function createWindow () {
	gui = new BrowserWindow({width: 800, height: 600});
	gui.loadURL(`file://${__dirname}/../index.html`);
	gui.webContents.openDevTools();

	gui.on('closed', () => {
		gui = null;
	})
}

app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open.
	if (gui === null) {
		createWindow();
	}
});