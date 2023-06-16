const { app, BrowserWindow, screen } = require('electron');

app.on('ready', ()=> {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    let mainWindow = new BrowserWindow({
        width: width,
        height: height,
        resizable: false,
        autoHideMenuBar: true,
        frame: true,
        title: "Monitoria",
        webPreferences: {
            nodeIntegration: true,
        },
    });

    mainWindow.loadFile('index.html');
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin')
        app.quit();
});