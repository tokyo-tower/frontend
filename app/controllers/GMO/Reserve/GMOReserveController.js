"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chevre_domain_1 = require("@motionpicture/chevre-domain");
const gmo_service_1 = require("@motionpicture/gmo-service");
const moment = require("moment");
const querystring = require("querystring");
const _ = require("underscore");
const util = require("util");
const result_1 = require("../../../models/gmo/result");
const session_1 = require("../../../models/reserve/session");
const ReserveBaseController_1 = require("../../ReserveBaseController");
const GMOReserveCvsController_1 = require("./Cvs/GMOReserveCvsController");
/**
 * マルチバイト文字列対応String.substr
 *
 * @params {number} start
 * @params {number} length
 */
// tslint:disable-next-line:space-before-function-paren
String.prototype.mbSubstr = function (start, length) {
    // tslint:disable-next-line:no-invalid-this
    const letters = this.split('');
    const textLength = letters.length;
    let count = 0;
    let result = '';
    // todo 文字列のループはこの書き方は本来よろしくないので、暇があったら直す
    // tslint:disable-next-line:no-increment-decrement
    for (let i = 0; i < textLength; i++) {
        if (i + start > textLength - 1)
            break;
        // マルチバイト文字列かどうか
        const letter = letters[i + start];
        // tslint:disable-next-line:no-magic-numbers
        count += (querystring.escape(letter).length < 4) ? 1 : 2;
        if (count > length)
            break;
        result += letter;
    }
    return result;
};
/**
 * GMO関連予約コントローラー
 *
 * 座席予約フローのうちGMOと連携するアクションを実装しています。
 *
 * @export
 * @class GMOReserveController
 * @extends {ReserveBaseController}
 */
class GMOReserveController extends ReserveBaseController_1.default {
    /**
     * GMO決済を開始する
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = this.req.params.token;
                const reservationModel = yield session_1.default.find(token);
                if (reservationModel === null) {
                    this.next(new Error(this.req.__('Message.Expired')));
                    return;
                }
                // 予約情報セッション削除
                yield reservationModel.remove();
                // GMOへ遷移画面
                // 作品名から、特定文字以外を取り除く
                const filmNameFullWidth = chevre_domain_1.CommonUtil.toFullWidth(reservationModel.performance.film.name.ja);
                const filmNameFullWidthLength = filmNameFullWidth.length;
                let registerDisp1 = '';
                // todo 文字列のループはこの書き方は本来よろしくないので、暇があったら直す
                // tslint:disable-next-line:no-increment-decrement
                for (let i = 0; i < filmNameFullWidthLength; i++) {
                    const letter = filmNameFullWidth[i];
                    if (/[Ａ-Ｚａ-ｚ０-９]/.test(letter) ||
                        /[\u3040-\u309F]/.test(letter) ||
                        /[\u30A0-\u30FF]/.test(letter) ||
                        /[一-龠]/.test(letter) // 漢字
                    ) {
                        registerDisp1 += letter;
                    }
                }
                // tslint:disable-next-line:no-magic-numbers
                this.res.locals.registerDisp1 = registerDisp1.mbSubstr(0, 32);
                this.res.locals.registerDisp2 = chevre_domain_1.CommonUtil.toFullWidth(util.format('%s／%s／%s', reservationModel.performance.day.substr(0, 4), // tslint:disable-line:no-magic-numbers
                reservationModel.performance.day.substr(4, 2), // tslint:disable-line:no-magic-numbers
                reservationModel.performance.day.substr(6) // tslint:disable-line:no-magic-numbers
                ));
                this.res.locals.registerDisp3 = chevre_domain_1.CommonUtil.toFullWidth(reservationModel.performance.theater.name.ja);
                this.res.locals.registerDisp4 = chevre_domain_1.CommonUtil.toFullWidth(util.format('開場%s:%s　開演%s:%s', reservationModel.performance.open_time.substr(0, 2), // tslint:disable-line:no-magic-numbers
                reservationModel.performance.open_time.substr(2), // tslint:disable-line:no-magic-numbers
                reservationModel.performance.start_time.substr(0, 2), // tslint:disable-line:no-magic-numbers
                reservationModel.performance.start_time.substr(2) // tslint:disable-line:no-magic-numbers
                ));
                this.res.locals.shopId = process.env.GMO_SHOP_ID;
                this.res.locals.orderID = reservationModel.paymentNo; // 27桁まで(購入番号を使用)
                this.res.locals.amount = reservationModel.getTotalCharge().toString();
                this.res.locals.dateTime = moment(reservationModel.purchasedAt).format('YYYYMMDDHHmmss');
                this.res.locals.useCredit = (reservationModel.paymentMethod === gmo_service_1.Util.PAY_TYPE_CREDIT) ? '1' : '0';
                this.res.locals.useCvs = (reservationModel.paymentMethod === gmo_service_1.Util.PAY_TYPE_CVS) ? '1' : '0';
                this.res.locals.shopPassString = gmo_service_1.Util.createShopPassString({
                    shopId: process.env.GMO_SHOP_ID,
                    shopPass: process.env.GMO_SHOP_PASS,
                    orderId: this.res.locals.orderID,
                    amount: reservationModel.getTotalCharge(),
                    dateTime: this.res.locals.dateTime
                });
                this.res.locals.retURL = util.format('%s%s?locale=%s', process.env.FRONTEND_GMO_RESULT_ENDPOINT, '/GMO/reserve/result', this.req.getLocale());
                // 決済キャンセル時に遷移する加盟店URL
                this.res.locals.cancelURL = util.format('%s%s?locale=%s', process.env.FRONTEND_GMO_RESULT_ENDPOINT, `/GMO/reserve/${reservationModel.paymentNo}/cancel`, this.req.getLocale());
                console.log('redirecting to GMO payment...');
                // GMOへの送信データをログに残すために、一度htmlを取得してからrender
                this.res.render('gmo/reserve/start', undefined, (renderErr, html) => {
                    if (renderErr instanceof Error) {
                        this.next(renderErr);
                        return;
                    }
                    console.log('rendering gmo/reserve/start...html:', html);
                    this.res.render('gmo/reserve/start');
                });
            }
            catch (error) {
                this.next(new Error(this.req.__('Message.UnexpectedError')));
            }
        });
    }
    /**
     * GMOからの結果受信
     * GMOで何かしらエラーが発生して「決済をやめる」ボタンから遷移してくることもある
     */
    result() {
        return __awaiter(this, void 0, void 0, function* () {
            const gmoResultModel = result_1.default.parse(this.req.body);
            const paymentNo = gmoResultModel.OrderID;
            console.log('gmoResultModel is', gmoResultModel);
            // エラー結果の場合
            if (!_.isEmpty(gmoResultModel.ErrCode)) {
                // 空席に戻す
                try {
                    console.log('finding reservations...payment_no:', paymentNo);
                    const reservations = yield chevre_domain_1.Models.Reservation.find({
                        payment_no: paymentNo
                    }, 'purchased_at').exec();
                    console.log('reservations found.', reservations.length);
                    if (reservations.length === 0) {
                        this.next(new Error(this.req.__('Message.NotFound')));
                        return;
                    }
                    // 特に何もしない
                    this.res.render('gmo/reserve/cancel');
                }
                catch (error) {
                    this.next(new Error(this.req.__('Message.UnexpectedError')));
                }
            }
            else {
                // 決済方法によって振り分け
                switch (gmoResultModel.PayType) {
                    case gmo_service_1.Util.PAY_TYPE_CVS:
                        console.log('starting GMOReserveCsvController.result...');
                        const cvsController = new GMOReserveCvsController_1.default(this.req, this.res, this.next);
                        yield cvsController.result(gmoResultModel);
                        break;
                    default:
                        this.next(new Error(this.req.__('Message.UnexpectedError')));
                        break;
                }
            }
        });
    }
    /**
     * 決済キャンセル時に遷移
     */
    cancel() {
        return __awaiter(this, void 0, void 0, function* () {
            const paymentNo = this.req.params.paymentNo;
            if (!chevre_domain_1.ReservationUtil.isValidPaymentNo(paymentNo)) {
                this.next(new Error(this.req.__('Message.Invalid')));
                return;
            }
            console.log('start process GMOReserveController.cancel.');
            console.log('finding reservations...');
            try {
                const reservations = yield chevre_domain_1.Models.Reservation.find({
                    payment_no: paymentNo,
                    status: chevre_domain_1.ReservationUtil.STATUS_WAITING_SETTLEMENT // GMO決済離脱組の処理なので、必ず決済中ステータスになっている
                }, 'purchaser_group').exec();
                console.log('reservations found.', reservations);
                if (reservations.length === 0) {
                    this.next(new Error(this.req.__('Message.NotFound')));
                    return;
                }
                // 特に何もしない
                this.res.render('gmo/reserve/cancel');
            }
            catch (error) {
                this.next(new Error(this.req.__('Message.UnexpectedError')));
            }
        });
    }
}
exports.default = GMOReserveController;
