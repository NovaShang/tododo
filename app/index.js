// 导入模块
const electron = require('electron');
const fs = require('fs');
const localServer = require('./server/index.js');
// 读取配置文件
global.config = JSON.parse(fs.readFileSync('./config.json').toString());
global.token = "";
// 窗口变量
let mainWindow, loginWindow, settingWindow, loginMenuItem, logoutMenuItem;


function login() {

}

function init() {
    if (config.localServer === true) {
        try {
            localServer(config.port);
        } catch (e) {
            electron.dialog.showErrorBox("本地服务启动失败", "本地服务启动失败，请检查端口号设置是否可用。")
        }
    }
}

/**
 * 创建主窗口
 */
function createMainWindow() {
    // 创建窗口
    mainWindow = new electron.BrowserWindow({
        resizable: false,
        movable: false,
        show: false,
        frame: false,
        skipTaskbar: true
    });
    // 加载主窗口
    mainWindow.loadURL('file://' + __dirname + '/windows/main.html');
    // 失去焦点时隐藏
    mainWindow.on('blur', () => {
        if (global.config.pinned != true) {
            mainWindow.hide();
        }
    });
};

/**
 * 显示登陆窗口
 */
function showLoginWindow() {
    loginWindow = new electron.BrowserWindow({
        resizable: false,
        maximizable: false,
        minimizable: false,
        show: false,
        height: 400,
        width: 500
    });
    loginWindow.setMenuBarVisibility(false);
    loginWindow.loadURL('file://' + __dirname + '/windows/login.html')
    loginWindow.show();
    loginWindow.result = false;
    loginWindow.once("close", () => {
        if (loginWindow.result == true) {
            mainWindow.reload();
        } else {

        }

    })
}

/**
 * 根据托盘图标的位置计算窗口的显示位置。
 * @param {electron.rectangle} bounds 托盘图标的bounds
 */
function getMainWindowBounds(bounds) {
    // 获取当前屏幕的可用区域
    let screenArea = electron.screen.getDisplayNearestPoint({
        x: bounds.x,
        y: bounds.y
    }).workArea;
    // 原始窗口位置：400x600,在图标的中间上方
    let windowBounds = {
        width: 400,
        height: 700,
        x: bounds.x + bounds.width / 2 - 200,
        y: bounds.y - 700
    };
    // 如果超出左侧区域调整窗口位置
    if (windowBounds.x < screenArea.x) {
        windowBounds.x = screenArea.x;
    }
    // 如果超出右侧位置调整窗口区域
    if (windowBounds.x + windowBounds.width > screenArea.x + screenArea.width) {
        windowBounds.x = screenArea.x + screenArea.width - 400;
    }
    // 如果图标位置在屏幕上侧则调整窗口位置
    if (bounds.y - screenArea.y < screenArea.y + screenArea.height - bounds.y) {
        windowBounds.y = bounds.y + bounds.height
    }
    return windowBounds;
}


/**
 * 创建上下文菜单
 */
function createContextMenu() {
    // 创建上下文菜单
    let menu = electron.Menu.buildFromTemplate([{
        label: '打开调试工具',
        type: 'normal',
        click: () => {
            mainWindow.openDevTools();
        }
    }, {
        label: '获取本项目源码',
        type: 'normal',
        click: () => {
            electron.shell.openExternal("http://github.com/NovaShang/tododo")
        }
    }, {
        type: 'separator'
    }, {
        label: '作者主页',
        type: 'normal',
        click: () => {
            electron.shell.openExternal("http://novashang.com")
        }
    }, {
        label: '项目主页',
        type: 'normal',
        click: () => {
            electron.shell.openExternal("http://tododo.novashang.com/")
        }
    }, {
        label: '使用帮助',
        type: 'normal',
        click: () => {
            electron.shell.openExternal("http://tododo.novashang.com/help")
        }
    }, {
        type: 'separator'
    }, {
        label: '退出',
        type: 'normal',
        click: () => {
            electron.app.quit();
        }
    }]);
    loginMenuItem = new electron.MenuItem({
        label: '登陆',
        type: 'normal',
        click: () => {
            loginWindow.show();
        }
    });
    logoutMenuItem = new electron.MenuItem({
        label: '登出',
        type: 'normal',
        click: () => {}
    });


    return menu;
};

/**
 * 创建系统托盘图标
 */
function createTrayIcon() {
    // 创建系统托盘图标
    let icon = new electron.Tray("./assets/tray.png");
    icon.setContextMenu(createContextMenu());
    // 左键单击按钮时发生
    icon.on('click', (modifiers, bounds) => {
        // 获得窗口应该显示的区域
        let windowBounds = getMainWindowBounds(bounds);
        // 应用该区域
        mainWindow.setBounds(windowBounds);
        // 显示窗口
        mainWindow.show();
    });
};

// 程序启动完成时
electron.app.on('ready', () => {
    createMainWindow();
    showLoginWindow();
    createTrayIcon();
});

// 程序退出时
electron.app.on('before-quit', () => {
    fs.writeFileSync('./config.json', JSON.stringify(config));
})