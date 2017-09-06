'use strict';

const api = new (require('koa-router'))();
const Model = require('./model');
let model;
const uuid = require('uuid');
const cryptoPassword = x => require('crypto').createHmac('sha256', 'tododo').update(x).digest('hex');
const tokens = new Map();

api.post('/auth', async ctx => {
    let data = ctx.request.body;
    if (!(data.password && data.email)) {
        ctx.body = { result: 'failed', message: 'parameters incomplete' };
        ctx.status = 400;
        return;
    }
    let user = await model.User.find({ where: { email: data.email } });
    if (!user) {
        ctx.body = { result: 'failed', message: 'user doesn\'t exists' };
        ctx.status = 400;
        return;
    }
    if (user.password === cryptoPassword(data.password)) {
        let token = uuid.v1().replace(/-/g, '');
        tokens.set(token, { retire: Date.now() + 7 * 24 * 3600 * 1000, user: user });
        ctx.body = { result: 'success', token: token };
    } else {
        ctx.body = { result: 'failed', message: 'password incorrect' };
        ctx.status = 400;
    }

});

api.post('/users', async ctx => {
    let data = ctx.request.body;
    if (!(data.password && data.email)) {
        ctx.body = { result: 'failed', message: 'parameters incomplete' };
        ctx.status = 400;
        return;
    }
    if (await model.User.find({ where: { email: data.email } })) {
        ctx.body = { result: 'failed', message: 'email address exists' };
        ctx.status = 400;
        return;
    }
    let user = await model.User.create({ email: data.email, password: cryptoPassword(data.password) });
    ctx.body = { result: 'success', uid: user.id };
});



api.use(async (ctx, next) => {
    if (!ctx.request.header.authorization) {
        ctx.status = 401;
        return;
    }
    if (!tokens.has(ctx.request.header.authorization)) {
        ctx.status = 401;
        return;
    }
    let token = ctx.request.header.authorization;
    if (tokens.get(token).retire < Date.now) {
        tokens.delete(token);
        return;
    }
    ctx.isAuthed = true;
    ctx.user = tokens.get(token).user;
    await next();
});


api.get('/tasks', async ctx => {
    if (!ctx.isAuthed) {
        ctx.body = { result: 'failed', message: 'invalid token' };
        ctx.status = 401;
        return;
    }
    let condition = { $and: [{ userId: ctx.user.id }, { $or: [{ $and: [{ canceled: { $not: true } }] }] }] };
    if (!(ctx.query.done == "true")) {
        condition.$and[1].$or[0].$and.push({ done: { $not: true } });
    }
    if (!(ctx.query.undone != "false")) {
        condition.$and[1].$or[0].$and.push({ done: true });
    }
    if (ctx.query.canceled == "true") {
        condition.$and[1].$or.push({ canceled: true });
    }
    let result = await model.Task.findAll({
        where: condition,
        order: [
            ['createdAt', 'DESC']
        ]
    });
    if (ctx.query.order != false) {
        result.forEach((x) => {
            let days = 5 - (Date.parse(x.deadLine) - Date.now()) / 1000 / 3600 / 24;
            x.mark = x.importance * 3 + (days > 0 ? days : 0);
        });
        result = result.sort((x, y) => y.mark - x.mark);
    }
    ctx.set({ pages: Math.ceil((result.length - 1) / 50) });
    if (ctx.query.page > 0) {
        let page = ctx.query.page;
        result = result.slice(50 * (page - 1), 50)
    }
    ctx.body = result;
});

api.post('/tasks', async ctx => {
    if (!ctx.isAuthed) {
        ctx.body = { result: 'failed', message: 'invalid token' };
        ctx.status = 401;
        return;
    }
    var data = ctx.request.body;
    if (!(data && data.title)) {
        ctx.body = { result: 'failed', message: 'parameters incomplete' };
        ctx.status = 400;
        return;
    }
    let task = await model.Task.findOne({ where: { id: ctx.params.id, userId: ctx.user.id } });
    if (task) {
        ctx.body = { result: 'failed', message: 'task exists' };
        ctx.status = 400;
        return;
    }
    task = await model.Task.create(data);
    task.setUser(ctx.user);
    await task.save();
    ctx.body = { result: 'success', id: task.id };
});

api.put('/tasks/:id', async ctx => {
    if (!ctx.isAuthed) {
        ctx.body = { result: 'failed', message: 'invalid token' };
        ctx.status = 401;
        return;
    }
    let data = ctx.request.body;
    data.id = undefined;
    data.userId = ctx.user.id;
    if (!(data && data.title)) {
        ctx.body = { result: 'failed', message: 'parameters incomplete' };
        ctx.status = 400;
        return;
    }
    let task = await model.Task.findOne({ where: { id: ctx.params.id, userId: ctx.user.id } });
    if (!task) {
        ctx.body = { result: 'failed', message: 'task doesn\'t exists' };
        ctx.status = 400;
        return;
    }
    await task.update(data);
    ctx.body = { result: 'success' };
});

api.get('/tasks/:id', async ctx => {
    if (!ctx.isAuthed) {
        ctx.body = { result: 'failed', message: 'invalid token' };
        ctx.status = 401;
        return;
    }
    let task = await model.Task.findOne({ where: { id: ctx.params.id, userId: ctx.user.id } });
    if (!task) {
        ctx.body = { result: 'failed', message: 'task doesn\'t exists' };
        ctx.status = 400;
        return;
    }
    ctx.body = task;
});

module.exports = function (dbPath) {
    model = new Model("dbPath");
    return api.routes();
}