const { app, BrowserWindow, screen } = require('electron');

app.on('ready', ()=> {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    let mainWindow = new BrowserWindow({
        width: width - 350,
        height: height - 100,
        autoHideMenuBar: true,
        frame: false,
        title: "Monitoria",
        titleBarStyle: "hidden",
        titleBarOverlay: {
            color: "#fff",
            symbolColor: "#1a1a1a",
            height: 35
        },
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
    });

    mainWindow.loadFile('index.html');
    mainWindow.on('closed', () => mainWindow = null);
});

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin')
        app.quit();
});