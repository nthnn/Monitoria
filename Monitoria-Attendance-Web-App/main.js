const { app, BrowserWindow, screen } = require('electron');
require('@electron/remote/main').initialize();

app.on('ready', ()=> {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    let mainWindow = new BrowserWindow({
        width: width - 350,
        height: height,
        autoHideMenuBar: true,
        frame: false,
        icon: "assets/ic-monitoria.ico",
        title: "Monitoria",
        titleBarStyle: "hidden",
        titleBarOverlay: {
            color: "#fff",
            symbolColor: "#1a1a1a",
            height: 35
        },
        webPreferences: {
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false
        },
    });

    mainWindow.loadFile('index.html');
    mainWindow.on('closed', () => mainWindow = null);
});

app.on('browser-window-created', (_, window) => {
    require("@electron/remote/main").enable(window.webContents);
});

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin')
        app.quit();
});