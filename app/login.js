const Vue = require('./node_modules/vue/dist/vue.js');
const electron = require('electron');
require('vue-resource')(Vue);
const config = electron.remote.getGlobal('config');
const currentWindow = electron.remote.getCurrentWindow();
//const server = electron.remote.require('nova-tododo-server');
//electron.remote.getCurrentWindow().openDevTools();

const app = new Vue({
    el: "#app",
    data: {
        email: "",
        password: "",
        passwordRepeat: "",
        error: "",
        message: "",
        processing: false,
        method: 'login',
        dbPath: config.dbPath,
        autoLogin: false
    },
    created: async function () {
        if (config.autoLogin) {
            this.email = config.email;
            this.password = config.password;
            this.login();
        }
    },
    methods: {
        login: async function () {
            this.error = "";
            this.message = "";
            this.processing = true;
            config.host = config.remoteHost;
            try {
                let data = await this.$http.post(config.host + "/auth", {
                    email: this.email,
                    password: this.password
                });
                if(this.autoLogin){
                    config.email=this.email;
                    config.password=this.password;
                    config.autoLogin=true;
                }
                config.token = data.body.token;
                currentWindow.result = true;
                currentWindow.close();
            }
            catch (e) {
                this.processing = false;
                if (e.body.message) this.error = e.body.message;
                else this.error = e;
            }
        },
        register: async function () {
            this.error = "";
            this.message = "";
            if (this.password != this.passwordRepeat) {
                this.error = "两次输入密码不一致";
                return;
            }

            this.processing = true;
            config.host = config.remoteHost;
            try {
                let data = await this.$http.post(config.host + "/users", {
                    email: this.email,
                    password: this.password
                });
                this.message = "注册成功！";
                this.method = "login";
                this.processing = false;
            }
            catch (e) {
                this.processing = false;
                if (e.body.message) this.error = e.body.message;
                else this.error = e;
            }
        },
        browse: function () {

        },
        startLocal: async function () {
            this.processing = true;
            this.error = "";
            this.message = "";
            try {
                server.startServer(config.port, config.dbPath);
                config.host = `http://localhost:${config.port}/`
                let data = await this.$http.post(`http://localhost:${config.port}/auth`, {
                    email: "root",
                    password: "root"
                });
                config.token = data.body.token;
                currentWindow.result = true;
                currentWindow.close();
            }
            catch (e) {
                this.processing = false;
                if (e.body.message) this.error = e.body.message;
                else this.error = e;
            }


        },
        cancel: function () {
            currentWindow.result = false;
            currentWindow.close();
        }


    }

})