const Vue = require('../node_modules/vue/dist/vue.js');
const electron = require('electron');
require('vue-resource')(Vue);
const config = electron.remote.getGlobal('config');

const app = new Vue({
    el: "#app",
    data: {
        showRegister: false,
        email: "",
        password: "",
        passwordRepeat: "",
        error: "test",
        processing: false

    },
    methods: {
        login: function() {
            this.processing = true;
            this.$http.post(config.server + "/auth", {
                email: this.email,
                password: this.password
            }).then((data) => {
                this.error = "登陆成功！";
                config.token = data.body.token;
                this.password = "";
                this.email = "";
                this.processing = false;
                electron.remote.getCurrentWindow().result = true;
                electron.remote.getCurrentWindow().close();
            }, (data) => {
                this.processing = false;
                this.error = data.body.message;
            });

        },
        register: function() {
            if (this.password != this.passwordRepeat) {
                this.error = "两次输入密码不一致";
                return;
            }
            this.processing = true;
            this.$http.post(config.server + "/users", {
                email: this.email,
                password: this.password
            }).then((data) => {
                this.error = "注册成功！";
                this.password = "";
                this.email = "";
                this.processing = false;

            }, (data) => {
                this.processing = false;
                this.error = data.body.message;
            });
        }


    }

})