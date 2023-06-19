const { MSICreator } = require("electron-wix-msi");
const path = require("node:path");

const msiCreator = new MSICreator({
    appDirectory: path.resolve(__dirname, "./Monitoria-win32-x64"),
    outputDirectory: path.resolve(__dirname, "./Monitoria-Installer"),
    description: "Monitoria Attendance System Desktop App",
    exe: "Monitoria",
    name: "Monitoria",
    manufacturer: "nthnn",
    version: "1.0.0",
    shortcutName: "Monitoria",
    icon: path.resolve(__dirname, "./assets/ic-monitoria.ico"),
    upgradeCode: "83bd9d3a-78db-4cb9-8948-75b3e6f5589d",

    ui: {
        chooseDirectory: true
    },
});

msiCreator.create().then(function(){
    msiCreator.compile();
});