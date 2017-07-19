//载入外部引用
const Vue = require('../node_modules/vue/dist/vue.js');
const electron = require('electron');
const _ = require('lodash');
require('date-utils');
require('vue-resource')(Vue);
// 从客户端获取配置信息
const config = electron.remote.getGlobal('config');
// 获取当前的窗口
const currentWindow = electron.remote.getCurrentWindow();
// 在ajax请求头部增加鉴权信息
Vue.http.interceptors.push(function(request, next) {
    request.headers.set('Authorization', config.token);
    next(resp => resp);
});
// 创建资源
const resTask = Vue.resource(config.server + '/tasks{/id}');

// 日期格式转换函数
const convertDate = function(datestr) {
    let date = new Date(datestr);
    if (!isNaN(date.getTime()) && datestr != null) {
        return date.toFormat('YYYY-MM-DD');
    } else return "";
}

const convertDatesInTask = function(task) {
    task.deadLine = convertDate(task.deadLine);
    task.createdAt = convertDate(task.createdAt);
    task.updatedAt = convertDate(task.updatedAt);
    task.doneDate = convertDate(task.doneDate);
    return task;
}


// 初始化Vue
const app = new Vue({
    el: "#app",
    data: {
        // 当前的功能模块，可能为 tasklist 、alltask 、setting
        currentModel: "tasklist",
        // 当前窗口是否被固定。
        // 默认情况下窗口不在任务栏显示，不能调整大小，不能关闭，失去焦点后隐藏。
        // pinned==true时窗口为正常窗口
        pinned: false,
        // 身份令牌
        token: "",
        // 创建任务相关的数据
        newTask: {
            // 显示完整的创建参数界面
            showExtra: false,
            title: "",
            content: "",
            deadLine: "",
            importance: 1
        },
        // 任务列表相关的数据
        taskList: {
            // 当前正在编辑的Task
            editingTask: null,
            // 显示的任务列表
            tasks: [],
        },
        // 所有任务相关的数据
        allTask: {
            // 当前正在显示详情的Task
            detailingTask: null,
            // 是否显示已完成的任务
            showDone: true,
            // 是否显示已取消的任务
            showCanceled: false,
            // 是否显示未完成任务
            showUndone: true,
            // 当前页码
            currentPage: 1,
            // 总页数
            totalPage: 1,
            // 显示的任务列表
            tasks: [],
        },
        // 所有设置相关的数据
        setting: {
            config: null,
            email: "",
            password: "",
            confirmPassword: "",
        }
    },
    created: function() {
        this.refreshTaskList();
    },
    filters: {
        // 将日期显示为 12-21 的格式
        shortDate: function(value) {
            let date = new Date(Date.parse(value));
            if (isNaN(date.getTime())) return "";
            return date.toFormat('MM-DD');
        }
    },
    methods: {
        /**
         * 添加新的任务
         */
        addTask: async function() {
            let data = await resTask.save({}, this.newTask);
            await this.refreshTaskList();
            this.newTask = {
                showExtra: false,
                title: "",
                content: "",
                deadLine: "",
                importance: 1
            }
        },
        /**
         * 切换任务状态
         */
        toggleTask: async function(task) {
            task.done = !task.done;
            if (task.done) {
                task.doneDate = new Date().toFormat("YYYY-MM-DD");
            }
            this.commitTask(task);
            this.refreshTaskListLazy();
        },
        /**
         * 更新某个任务
         */
        refreshTask: async function(task) {
            let data = await resTask.query({ id: task.id });
            convertDatesInTask(task);
            Object.assign(task, data.body);
        },
        /**
         * 刷新任务列表
         */
        refreshTaskList: async function() {
            let data = await resTask.query();
            this.taskList.tasks = data.body.map(convertDatesInTask);
        },
        /**
         * 惰性刷新任务列表
         */
        refreshTaskListLazy: _.debounce(() => {
            app.refreshTaskList()
        }, 5000),
        /**
         * 提交对某个任务的变更
         */
        commitTask: async function(task) {
            let data = await resTask.update({ id: task.id }, task);
            await this.refreshTask(task);
        },
        /**
         * 开始编辑某个任务
         */
        editTask: async function(task) {
            if (task == this.taskList.editingTask) {
                return;
            }
            if (this.taskList.editingTask != null || this.taskList.editingTask) {
                this.commitTask(this.taskList.editingTask);
            }
            this.taskList.editingTask = task;
        },
        /**
         * 取消某个任务
         */
        cancelTask: async function(task) {
            task.canceled = true;
            await this.commitTask(task);
            this.refreshTaskList();
        },
        /**
         * 刷新所有任务
         */
        refreshAllTasks: async function() {
            let data = await resTask.query({
                done: this.allTask.showDone,
                canceled: this.allTask.showCanceled,
                undone: this.allTask.showUndone,
                ordered: false,
                page: this.allTask.currentPage
            });
            this.allTask.tasks = data.body.map(convertDatesInTask);
            this.allTask.totalPage = Number.parseInt(data.headers.get('pages'));
        },
        /**
         * 所有任务上一页
         */
        allTaskPrePage: function() {
            if (this.allTask.currentPage > 1) this.allTask.currentPage--;
            this.refreshAllTasks();
        },
        /**
         * 所有任务下一页
         */
        allTaskNextPage: function() {
            if (this.allTask.currentPage < this.allTask.totalPage) this.allTask.currentPage++;
            this.refreshAllTasks();
        },
        /**
         * 固定窗口，将窗体调整为正常的窗口
         */
        pin: function() {
            config.pinned = true;
            this.pinned = true;
            currentWindow.setMovable(true);
            currentWindow.setResizable(true);
            currentWindow.setSkipTaskbar(false);
        },
        /**
         * 将窗口调整为默认行为并关闭窗口
         */
        close: function() {
            config.pinned = false;
            this.pinned = false;
            currentWindow.setMovable(false);
            currentWindow.setResizable(false);
            currentWindow.setSkipTaskbar(true);
            currentWindow.hide();
        },
    }
});