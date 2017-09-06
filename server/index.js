'use strict';

const app = new(require('koa'))();
const router = new(require('koa-router'))();
const bodyparser = require('koa-bodyparser');
const Model = require('./model');
const api = require('./api');

/**
 * start a local tododo server
 * @param {number} port port number
 * @param {string} dbPath path of the sqlite3 database
 */
exports.startServer = function(port = 1231, dbPath = "tododo.db") {
    router.use('/api', api(dbPath));
    app.use(bodyparser());
    app.use(router.routes());
    app.listen(1231);
    console.log('Tododo Server Started At http://localhost:' + port);
};

/**
 * make a router of koa2 for tododo
 * @param {string} dbPath path of the sqlite3 database
 */
exports.getApiRouter = function(dbPath = "tododo.db") {
    return api(dbPath);
};

/**
 * init the database
 */
exports.migrate = function(dbPath = "tododo.db") {
    let model = new Model(dbPath);
    model.dbContext.sync();
    console.log('Migrated')
};

if (process.argv[2] == "start-server") {
    exports.startServer();
}

if (process.argv[2] == "migrate") {
    exports.migrate();
}