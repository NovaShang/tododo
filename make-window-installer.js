var ei = require('electron-winstaller');



ei.createWindowsInstaller({
    appDirectory: './release/ToDoDo-win32-ia32',
    outputDirectory: '/release',
    author: 'Nova',
    exe: 'ToDoDo-win32-ia32.exe',
    description: ""
}).then(() => console.log("ok"), (e) => { throw e });