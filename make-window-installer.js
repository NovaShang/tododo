var ei = require('electron-winstaller');



ei.createWindowsInstaller({
    appDirectory: './release/ToDoDo-win32-ia32',
    outputDirectory: './release',
    author: 'Nova',
    exe: 'ToDoDo.exe',
    name: "ToDoDo",
    description: "ToDoDo客户端",
    setupExe: 'Nova_ToDoDo_0.9.1_window_x86_Setup.exe',
    setupMsi: 'Nova_ToDoDo_0.9.1_window_x86_Setup.msi',
    setupIcon: './app/icon/icon.ico',


}).then(() => console.log("ok"), (e) => {
    console.log("错误")

    throw e;
});