const Vue = require('../node_modules/vue/dist/vue.js');
const electron = require('electron');
require('vue-resource')(Vue);
const config = electron.remote.getGlobal('config');

Vue.http.interceptors.push(function(request, next) {
    request.headers.set('Authorization', config.token);
    next(resp => resp);
});

const resTask = Vue.resource(config.server + '/tasks{/id}');
const app = new Vue({
    el: "#app",
    data: {
        test: "test",
        showAddExtra: false,
        newTask: {
            title: "",
            content: "",
            deadline: "",
            importance: 1
        },
        tasks: []

    },

    methods: {
        addTask: function() {
            resTask.save({}, this.newTask).then((data) => {
                this.refreshTasks();
            }, (data) => {

            });
        },
        refreshTasks: function() {
            resTask.query().then((data) => {
                this.tasks = data.body
            }, (data) => {

            });
        },
        refreshTask: function(task) {
            resTask.query({ id: task.id }).then();
        },
        commitTask: function(task) {
            resTask.update({ id: task.id }, task).then(

            );
        }



    }


});