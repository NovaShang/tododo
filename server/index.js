'use strict';

const app = new(require('koa'))();
const router = new(require('koa-router'))();
const bodyparser = require('koa-bodyparser');
const model = require('./model');
const api = require('./api');

if (process.argv[2] === 'migrate') {
    model.dbContext.sync();
} else {
    router.use('/api', api);
    app.use(bodyparser());
    app.use(router.routes());
    app.listen(1231);
}