'use strict';

const app = new(require('koa'))();
const router = new(require('koa-router'))();
const bodyparser = require('koa-bodyparser');
const model = require('./model');
const api = require('./api');

function startServer(port) {
    router.use('/api', api);
    app.use(bodyparser());
    app.use(router.routes());
    app.listen(1231);
    console.log('Tododo Server Started At http://localhost:' + port);
}

if (process.argv[2] === 'migrate') {
    model.dbContext.sync();
} else if (process.argv[2] === 'run') {
    startServer(1231);
}

module.exports = function() {
    model.dbContext.sync();
    startServer(1231);

}