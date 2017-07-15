const electron = require('electron');
let mainWindow;
electron.app.on('ready', () => {
    mainWindow = new electron.BrowserWindow({
        resizable: false,
        movable: false,
        show: false,
        frame: false,
    });
    let menu = electron.Menu.buildFromTemplate([{
            label: '退出',
            type: 'normal',
            click: () => {
                electron.app.quit();
            }
        },
        {
            label: '登陆',
            type: 'normal'

        }
    ]);
    let icon = new electron.Tray("assets/tray.png");
    icon.setContextMenu(menu);
    icon.on('click', (modifiers, bounds) => {
        let display = electron.screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
        mainWindow.setBounds({ width: 400, height: 600, x: bounds.x - 200, y: bounds.y - 600 });
        mainWindow.show();

    });
});