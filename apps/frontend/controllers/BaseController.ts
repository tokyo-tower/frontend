import express = require('express');
import log4js = require('log4js');
import moment = require('moment');
import util = require('util');
import numeral = require('numeral');
import conf = require('config');

import MemberUser from '../models/User/MemberUser';
import StaffUser from '../models/User/StaffUser';
import SponsorUser from '../models/User/SponsorUser';
import WindowUser from '../models/User/WindowUser';
import TelStaffUser from '../models/User/TelStaffUser';
import Constants from '../../common/Util/Constants';

/**
 * ベースコントローラー
 * 
 * 基本的にコントローラークラスはルーティングクラスより呼ばれる
 * あらゆるルーティングで実行されるメソッドは、このクラスがベースとなるので、メソッド共通の処理はここで実装するとよい
 */
export default class BaseController {
    /** httpリクエストオブジェクト */
    public req: express.Request;
    /**httpレスポンスオブジェクト */
    public res: express.Response;
    /** 次に一致するルートメソッド */
    public next: express.NextFunction;

    /** ロガー */
    public logger: log4js.Logger;
    /** ルーティング */
    public router: Express.NamedRoutes;

    /** レイアウトファイル */
    public layout: string;

    constructor(req: express.Request, res: express.Response, next: express.NextFunction) {
        this.req = req;
        this.res = res;
        this.next = next;

        this.logger = log4js.getLogger('system');
        this.router = this.req.app.namedRoutes;


        this.res.locals.req = this.req;
        this.res.locals.moment = moment;
        this.res.locals.util = util;
        this.res.locals.numeral = numeral;
        this.res.locals.conf = conf;
        this.res.locals.Constants = Constants;


        // レイアウト指定があれば変更
        let _render = this.res.render;
        this.res.render = (view, options?, cb?) => {
            if (this.layout) {
                if (typeof options === 'undefined') {
                    options = {}
                } else if (typeof options === 'function') {
                    cb = options;
                    options = {}
                }

                if (!options.hasOwnProperty('layout')) {
                    options['layout'] = this.layout;
                }
            }

            _render(view, options, cb);
        };
    }
}
