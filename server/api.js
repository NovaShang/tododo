'use strict';

const api = new(require('koa-router'))();
const model = require('./model');
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



api.use(async(ctx, next) => {
    if (!ctx.request.header.authorization) {
        ctx.status = 502;
        return;
    }
    if (!tokens.has(ctx.request.header.authorization)) {
        ctx.status = 502;
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
    let condition = { userId: ctx.user.id };
    if (!ctx.params.canceled) {
        condition.canceled = { $not: true };
    }
    if (!ctx.params.done) {
        condition.done = { $not: true };
    }
    ctx.body = await model.Task.findAll({ where: condition });
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

module.exports = api.routes();