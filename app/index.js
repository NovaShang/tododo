// 导入模块
const electron = require('electron');
const fs = require('fs');
const path = require('path');


// 读取配置文件
global.config = {
    "host": "http://tododo.novashang.com/api",
    "remoteHost": "http://tododo.novashang.com/api",
    "token": "",
    "pinned": false,
    "autoLogin": false,
    "email": "",
    "password": ""
};

let confDir = electron.app.getPath('userData');
let confPath = path.join(confDir, 'config.json');
if (!fs.existsSync(confDir)) {
    fs.mkdirSync(confDir);
}
if (!fs.existsSync(confPath)) {
    fs.writeFileSync(confPath, JSON.stringify(global.config));
}
Object.assign(global.config, JSON.parse(fs.readFileSync(confPath)));

// 窗口变量
let icon, mainWindow, loginWindow, loginMenuItem, logoutMenuItem;

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
        skipTaskbar: true,
    });
    // 加载主窗口
    mainWindow.loadURL('file://' + __dirname + '/main.html');
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
        height: 370,
        width: 400,
        frame: false
    });
    loginWindow.setMenuBarVisibility(false);
    loginWindow.loadURL('file://' + __dirname + '/login.html')
    loginWindow.show();
    loginWindow.result = false;
    loginWindow.once("close", () => {
        if (loginWindow.result == true) {
            afterLogin();
        } else {
            electron.app.quit();
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
        // 如果不是整数设置窗口边界时会报错
        x: bounds.x + Math.floor(bounds.width / 2) - 200,
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
        label: '登出',
        type: 'normal',
        click: () => {
            global.config.autoLogin = false;
            global.config.password = "";
            global.config.email = "";
            showLoginWindow();
            mainWindow.destroy();
            icon.destroy();
        }
    }, {
        label: '退出',
        type: 'normal',
        click: () => {
            electron.app.quit();
        }
    }]);
    return menu;
};

/**
 * 创建系统托盘图标
 */
function createTrayIcon() {
    // 创建系统托盘图标
    icon = new electron.Tray(__dirname + "/assets/tray.png");
    // 设置右键菜单
    icon.setContextMenu(createContextMenu());
    // 左键单击按钮时发生
    icon.on('click', (modifiers, bounds) => {
        // 获得窗口应该显示的区域
        let windowBounds = getMainWindowBounds(bounds);
        console.log(windowBounds);
        // 应用该区域
        mainWindow.setBounds(windowBounds);
        // 显示窗口
        mainWindow.show();
    });
};

// 登陆后
function afterLogin() {
    createMainWindow();
    createTrayIcon();
}

// 设置为单例模式
const shouldQuit = electron.app.makeSingleInstance((commandLine, workingDirectory) => {
    if (mainWindow) {
        mainWindow.show();
    }
});
if (shouldQuit) {
    electron.app.quit();
}



// 程序启动完成时
electron.app.on('ready', () => {
    if (require('electron-squirrel-startup')) {
        electron.app.exit();

    } else {
        showLoginWindow();
    }
});
// 程序退出时
electron.app.on('before-quit', () => {
    fs.writeFileSync(confPath, JSON.stringify(config));
})

