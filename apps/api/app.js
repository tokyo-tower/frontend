"use strict";
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
// import multer = require('multer');
const logger_1 = require('./middlewares/logger');
const benchmarks_1 = require('./middlewares/benchmarks');
const router_1 = require('./routes/router');
const conf = require('config');
const mongoose = require('mongoose');
const i18n = require('i18n');
const passport = require('passport');
const passportHttpBearer = require('passport-http-bearer');
let BearerStrategy = passportHttpBearer.Strategy;
const Models_1 = require('../common/models/Models');
passport.use(new BearerStrategy((token, cb) => {
    Models_1.default.Authentication.findOne({
        token: token
    }, (err, authentication) => {
        if (err)
            return cb(err);
        if (!authentication)
            return cb(null, false);
        cb(null, authentication);
    });
}));
let app = express();
if (process.env.NODE_ENV === 'dev') {
    app.use(logger_1.default); // ロガー
}
app.use(benchmarks_1.default); // ベンチマーク的な
// view engine setup
app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// for parsing multipart/form-data
// let storage = multer.memoryStorage()
// app.use(multer({ storage: storage }).any());
app.use(cookieParser());
// i18n を利用する設定
i18n.configure({
    locales: ['en', 'ja'],
    defaultLocale: 'en',
    directory: __dirname + '/../../locales',
    objectNotation: true
});
// i18n の設定を有効化
app.use(i18n.init);
// ルーティング
router_1.default(app);
let MONGOLAB_URI = conf.get('mongolab_uri');
mongoose.connect(MONGOLAB_URI, {});
module.exports = app;
