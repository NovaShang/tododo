var ei = require('electron-winstaller');



ei.createWindowsInstaller({
    appDirectory: './release/ToDoDo-win32-ia32',
    outputDirectory: './release',
    author: 'Nova',
    exe: 'ToDoDo.exe',
    name: "ToDoDo",
    description: "ToDoDo客户端",
    setupExe: 'ToDoDo-0.9.1-win32-ia32-setup.exe',
    setupMsi: 'ToDoDo-0.9.1-win32-ia32-setup.msi',
    setupIcon: './app/icon/icon.ico',


}).then(() => console.log("ok"), (e) => {
    console.log("错误")

    throw e;
});