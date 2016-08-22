"use strict";
const BaseController_1 = require('./BaseController');
const Util_1 = require('../../common/Util/Util');
const Constants_1 = require('../../common/Util/Constants');
const GMOUtil_1 = require('../../common/Util/GMO/GMOUtil');
const ReservationUtil_1 = require('../../common/models/Reservation/ReservationUtil');
const ScreenUtil_1 = require('../../common/models/Screen/ScreenUtil');
const TicketTypeGroupUtil_1 = require('../../common/models/TicketTypeGroup/TicketTypeGroupUtil');
const Models_1 = require('../../common/models/Models');
const ReservationModel_1 = require('../models/Reserve/ReservationModel');
const moment = require('moment');
const fs = require('fs-extra');
const reserveTicketForm_1 = require('../forms/Reserve/reserveTicketForm');
const reserveProfileForm_1 = require('../forms/Reserve/reserveProfileForm');
/**
 * 予約フローベースコントローラー
 */
class ReserveBaseController extends BaseController_1.default {
    constructor(req, res, next) {
        super(req, res, next);
        this.res.locals.GMOUtil = GMOUtil_1.default;
        this.res.locals.ReservationUtil = ReservationUtil_1.default;
    }
    /**
     * 購入開始プロセス
     *
     * @param {string} purchaserGroup 購入者区分
     */
    processStart(cb) {
        // パフォーマンス未指定であればパフォーマンス選択へ
        // パフォーマンス指定であれば座席へ
        // 言語も指定
        if (this.req.query.locale) {
            this.req.session['locale'] = this.req.query.locale;
        }
        else {
            this.req.session['locale'] = 'ja';
        }
        let performanceId = this.req.query.performance;
        // 予約トークンを発行
        let token = Util_1.default.createToken();
        let reservationModel = new ReservationModel_1.default();
        reservationModel.token = token;
        reservationModel.purchaserGroup = this.purchaserGroup;
        reservationModel = this.initializePayment(reservationModel);
        // パフォーマンスFIX
        if (this.purchaserGroup === ReservationUtil_1.default.PURCHASER_GROUP_SPONSOR && this.req.sponsorUser.get('performance')) {
            // パフォーマンスFIX
            this.processFixPerformance(reservationModel, this.req.sponsorUser.get('performance'), (err, reservationModel) => {
                if (err) {
                    cb(err, reservationModel);
                }
                else {
                    cb(null, reservationModel);
                }
            });
        }
        else if (performanceId) {
            // パフォーマンスFIX
            this.processFixPerformance(reservationModel, performanceId, (err, reservationModel) => {
                if (err) {
                    cb(err, reservationModel);
                }
                else {
                    cb(null, reservationModel);
                }
            });
        }
        else {
            cb(null, reservationModel);
        }
    }
    /**
     * 購入情報を初期化する
     */
    initializePayment(reservationModel) {
        let purchaser;
        switch (this.purchaserGroup) {
            case ReservationUtil_1.default.PURCHASER_GROUP_CUSTOMER:
                purchaser = this.findPurchaser();
                if (purchaser) {
                    reservationModel.purchaserLastName = purchaser.lastName;
                    reservationModel.purchaserFirstName = purchaser.firstName;
                    reservationModel.purchaserTel = purchaser.tel;
                    reservationModel.purchaserEmail = purchaser.email;
                }
                else {
                    reservationModel.purchaserLastName = '';
                    reservationModel.purchaserFirstName = '';
                    reservationModel.purchaserTel = '';
                    reservationModel.purchaserEmail = '';
                }
                reservationModel.paymentMethodChoices = [GMOUtil_1.default.PAY_TYPE_CREDIT];
                // コンビニ決済は5日前まで
                if (moment() < moment(Constants_1.default.CVS_RESERVATION_END_DATETIME)) {
                    reservationModel.paymentMethodChoices.push(GMOUtil_1.default.PAY_TYPE_CVS);
                }
                break;
            case ReservationUtil_1.default.PURCHASER_GROUP_MEMBER:
                purchaser = this.findPurchaser();
                if (purchaser) {
                    reservationModel.purchaserLastName = purchaser.lastName;
                    reservationModel.purchaserFirstName = purchaser.firstName;
                    reservationModel.purchaserTel = purchaser.tel;
                    reservationModel.purchaserEmail = purchaser.email;
                }
                else {
                    reservationModel.purchaserLastName = '';
                    reservationModel.purchaserFirstName = '';
                    reservationModel.purchaserTel = '';
                    reservationModel.purchaserEmail = '';
                }
                reservationModel.paymentMethodChoices = [GMOUtil_1.default.PAY_TYPE_CREDIT];
                break;
            case ReservationUtil_1.default.PURCHASER_GROUP_STAFF:
                reservationModel.purchaserLastName = 'ナイブ';
                reservationModel.purchaserFirstName = 'カンケイシャ';
                reservationModel.purchaserTel = '0362263025';
                reservationModel.purchaserEmail = this.req.staffUser.get('email');
                reservationModel.paymentMethodChoices = [GMOUtil_1.default.PAY_TYPE_CREDIT];
                break;
            case ReservationUtil_1.default.PURCHASER_GROUP_TEL:
                reservationModel.purchaserLastName = '';
                reservationModel.purchaserFirstName = '';
                reservationModel.purchaserTel = '';
                reservationModel.purchaserEmail = 'tiff@localhost.net';
                reservationModel.paymentMethodChoices = [];
                // コンビニ決済は5日前まで
                if (moment() < moment(Constants_1.default.CVS_RESERVATION_END_DATETIME)) {
                    reservationModel.paymentMethodChoices.push(GMOUtil_1.default.PAY_TYPE_CVS);
                }
                break;
            case ReservationUtil_1.default.PURCHASER_GROUP_WINDOW:
                reservationModel.purchaserLastName = 'マドグチ';
                reservationModel.purchaserFirstName = 'タントウシャ';
                reservationModel.purchaserTel = '0362263025';
                reservationModel.purchaserEmail = 'tiff@localhost.net';
                reservationModel.paymentMethodChoices = [GMOUtil_1.default.PAY_TYPE_CREDIT, GMOUtil_1.default.PAY_TYPE_CASH];
                break;
            default:
                purchaser = this.findPurchaser();
                if (purchaser) {
                    reservationModel.purchaserLastName = purchaser.lastName;
                    reservationModel.purchaserFirstName = purchaser.firstName;
                    reservationModel.purchaserTel = purchaser.tel;
                    reservationModel.purchaserEmail = purchaser.email;
                }
                else {
                    reservationModel.purchaserLastName = '';
                    reservationModel.purchaserFirstName = '';
                    reservationModel.purchaserTel = '';
                    reservationModel.purchaserEmail = '';
                }
                reservationModel.paymentMethodChoices = [GMOUtil_1.default.PAY_TYPE_CREDIT];
                break;
        }
        return reservationModel;
    }
    /**
     * 予約フロー中の座席をキャンセルするプロセス
     *
     * @param {ReservationModel} reservationModel
     */
    processCancelSeats(reservationModel, cb) {
        let seatCodesInSession = (reservationModel.seatCodes) ? reservationModel.seatCodes : [];
        if (seatCodesInSession.length === 0) {
            return cb(null, reservationModel);
        }
        // セッション中の予約リストを初期化
        reservationModel.seatCodes = [];
        // 仮予約を空席ステータスに戻す
        this.logger.debug('removing reservations... seatCodes:', seatCodesInSession);
        Models_1.default.Reservation.remove({
            performance: reservationModel.performance._id,
            seat_code: { $in: seatCodesInSession },
            status: ReservationUtil_1.default.STATUS_TEMPORARY
        }, (err) => {
            // 失敗したとしても時間経過で消えるので放置
            if (err) {
                cb(err, reservationModel);
            }
            else {
                cb(null, reservationModel);
            }
        });
    }
    /**
     * パフォーマンスをFIXするプロセス
     * パフォーマンスIDから、パフォーマンスを検索し、その後プロセスに必要な情報をreservationModelに追加する
     */
    processFixPerformance(reservationModel, perfomanceId, cb) {
        // パフォーマンス取得
        this.logger.debug('searching performance... id:', perfomanceId);
        Models_1.default.Performance.findOne({
            _id: perfomanceId
        }, 'day start_time end_time is_mx4d film screen theater' // 必要な項目だけ指定すること
        )
            .populate('film', 'name ticket_type_group image') // 必要な項目だけ指定すること
            .populate('screen', 'name sections') // 必要な項目だけ指定すること
            .populate('theater', 'name') // 必要な項目だけ指定すること
            .exec((err, performance) => {
            if (err)
                return cb(err, reservationModel);
            if (!performance)
                return cb(new Error(this.req.__('Message.NotFound')), reservationModel);
            // 内部以外は、上映開始20分過ぎていたらはじく
            if (this.purchaserGroup !== ReservationUtil_1.default.PURCHASER_GROUP_STAFF) {
                let now = moment().add(-20, 'minutes');
                if (performance.get('day') === now.format('YYYYMMDD')) {
                    if (performance.get('start') < now.format('HHmm')) {
                        return cb(new Error('You cannot reserve this performance.'), reservationModel);
                    }
                }
                else if (performance.get('day') < now.format('YYYYMMDD')) {
                    return cb(new Error('You cannot reserve this performance.'), reservationModel);
                }
            }
            // 券種取得
            Models_1.default.TicketTypeGroup.findOne({
                _id: performance.get('film').get('ticket_type_group')
            }, (err, ticketTypeGroupDocument) => {
                reservationModel.seatCodes = [];
                // 券種リストは、予約する主体によって異なる
                // 内部関係者の場合
                switch (this.purchaserGroup) {
                    case ReservationUtil_1.default.PURCHASER_GROUP_STAFF:
                        reservationModel.ticketTypes = TicketTypeGroupUtil_1.default.getOne4staff();
                        break;
                    case ReservationUtil_1.default.PURCHASER_GROUP_SPONSOR:
                        reservationModel.ticketTypes = TicketTypeGroupUtil_1.default.getOne4sponsor();
                        break;
                    case ReservationUtil_1.default.PURCHASER_GROUP_MEMBER:
                        // メルマガ当選者の場合、一般だけ
                        reservationModel.ticketTypes = [];
                        for (let ticketType of ticketTypeGroupDocument.get('types')) {
                            if (ticketType.get('code') === TicketTypeGroupUtil_1.default.TICKET_TYPE_CODE_ADULTS) {
                                reservationModel.ticketTypes.push(ticketType);
                            }
                        }
                        break;
                    default:
                        // 一般、当日窓口、電話予約の場合
                        reservationModel.ticketTypes = [];
                        for (let ticketType of ticketTypeGroupDocument.get('types')) {
                            switch (ticketType.get('code')) {
                                // 学生当日は、当日だけ
                                case TicketTypeGroupUtil_1.default.TICKET_TYPE_CODE_STUDENTS_ON_THE_DAY:
                                    if (moment().format('YYYYMMDD') === performance.get('day')) {
                                        reservationModel.ticketTypes.push(ticketType);
                                    }
                                    break;
                                case TicketTypeGroupUtil_1.default.TICKET_TYPE_CODE_STUDENTS:
                                    if (moment().format('YYYYMMDD') !== performance.get('day')) {
                                        reservationModel.ticketTypes.push(ticketType);
                                    }
                                    break;
                                default:
                                    reservationModel.ticketTypes.push(ticketType);
                                    break;
                            }
                        }
                        break;
                }
                // パフォーマンス情報を保管
                reservationModel.performance = {
                    _id: performance.get('_id'),
                    day: performance.get('day'),
                    start_time: performance.get('start_time'),
                    end_time: performance.get('end_time'),
                    start_str: performance.get('start_str'),
                    theater: {
                        _id: performance.get('theater').get('_id'),
                        name: performance.get('theater').get('name')
                    },
                    screen: {
                        _id: performance.get('screen').get('_id'),
                        name: performance.get('screen').get('name'),
                        sections: performance.get('screen').get('sections'),
                    },
                    film: {
                        _id: performance.get('film').get('_id'),
                        name: performance.get('film').get('name'),
                        image: performance.get('film').get('image'),
                        is_mx4d: performance.get('film').get('is_mx4d'),
                    }
                };
                // 座席グレードリスト抽出
                reservationModel.seatGradeCodesInScreen = [];
                // for (performance.get('screen').get('sections')[0].seats) {
                // }
                // スクリーン座席表HTMLを保管(apiで取得)
                // TODO ひとまず固定だが、最終的にはパフォーマンスに応じて適切なスクリーンを入れる
                fs.readFile(`${__dirname}/../../common/views/screens/map.ejs`, 'utf8', (err, data) => {
                    if (err) {
                        cb(err, reservationModel);
                    }
                    else {
                        reservationModel.screenHtml = data;
                        cb(null, reservationModel);
                    }
                });
            });
        });
    }
    /**
     * 座席をFIXするプロセス
     * 新規仮予約 ここが今回の肝です！！！
     *
     * @param {ReservationModel} reservationModel
     * @param {Array<string>} seatCodes
     */
    processFixSeats(reservationModel, seatCodes, cb) {
        let promises = [];
        // セッション中の予約リストを初期化
        reservationModel.seatCodes = [];
        // 新たな座席指定と、既に仮予約済みの座席コードについて
        seatCodes.forEach((seatCode) => {
            promises.push(new Promise((resolve, reject) => {
                let seatInfo = reservationModel.performance.screen.sections[0].seats.find((seat) => {
                    return (seat.code === seatCode);
                });
                // 万が一、座席が存在しなかったら
                if (!seatInfo) {
                    return reject(new Error(this.req.__('Message.InvalidSeatCode')));
                }
                else {
                    let newReservation = {
                        performance: reservationModel.performance._id,
                        seat_code: seatCode,
                        status: ReservationUtil_1.default.STATUS_TEMPORARY,
                        staff: (this.purchaserGroup === ReservationUtil_1.default.PURCHASER_GROUP_STAFF) ? this.req.staffUser.get('_id') : undefined,
                        sponsor: (this.purchaserGroup === ReservationUtil_1.default.PURCHASER_GROUP_SPONSOR) ? this.req.sponsorUser.get('_id') : undefined,
                        member: (this.purchaserGroup === ReservationUtil_1.default.PURCHASER_GROUP_MEMBER) ? this.req.memberUser.get('_id') : undefined,
                    };
                    // 予約データを作成(同時作成しようとしたり、既に予約があったとしても、unique indexではじかれる)
                    this.logger.debug('creating reservation... seat_code:', seatCode);
                    Models_1.default.Reservation.create(newReservation, (err, reservationDocument) => {
                        this.logger.debug('reservation created.', err, reservationDocument);
                        if (err) {
                            reject(err);
                        }
                        else {
                            // ステータス更新に成功したらセッションに保管
                            reservationModel.seatCodes.push(seatCode);
                            reservationModel.setReservation(seatCode, {
                                _id: reservationDocument.get('_id'),
                                status: reservationDocument.get('status'),
                                seat_code: reservationDocument.get('seat_code'),
                                seat_grade_name_ja: seatInfo.grade.name.ja,
                                seat_grade_name_en: seatInfo.grade.name.en,
                                seat_grade_additional_charge: seatInfo.grade.additional_charge,
                            });
                            resolve();
                        }
                    });
                }
            }));
        });
        Promise.all(promises).then(() => {
            // 座席コードのソート(文字列順に)
            reservationModel.seatCodes.sort(ScreenUtil_1.default.sortBySeatCode);
            cb(null, reservationModel);
        }, (err) => {
            cb(err, reservationModel);
        });
    }
    /**
     * 券種FIXプロセス
     */
    processFixTickets(reservationModel, cb) {
        reserveTicketForm_1.default(this.req, this.res, (err) => {
            if (this.req.form.isValid) {
                // 座席選択情報を保存して座席選択へ
                let choices = JSON.parse(this.req.form['choices']);
                if (Array.isArray(choices)) {
                    choices.forEach((choice) => {
                        let ticketType = reservationModel.ticketTypes.find((ticketType) => {
                            return (ticketType.code === choice.ticket_type_code);
                        });
                        if (!ticketType) {
                            return cb(new Error(this.req.__('Message.UnexpectedError')), reservationModel);
                        }
                        let reservation = reservationModel.getReservation(choice.seat_code);
                        reservation.ticket_type_code = ticketType.code;
                        reservation.ticket_type_name_ja = ticketType.name.ja;
                        reservation.ticket_type_name_en = ticketType.name.en;
                        reservation.ticket_type_charge = ticketType.charge;
                        reservation.watcher_name = choice.watcher_name;
                        reservationModel.setReservation(reservation._id, reservation);
                    });
                    cb(null, reservationModel);
                }
                else {
                    cb(new Error(this.req.__('Message.UnexpectedError')), reservationModel);
                }
            }
            else {
                cb(new Error(this.req.__('Message.UnexpectedError')), reservationModel);
            }
        });
    }
    /**
     * 券種FIXプロセス
     */
    processFixProfile(reservationModel, cb) {
        let form = reserveProfileForm_1.default(this.req);
        form(this.req, this.res, (err) => {
            if (err)
                return cb(new Error(this.req.__('Message.UnexpectedError')), reservationModel);
            if (this.req.form.isValid) {
                // 購入者情報を保存して座席選択へ
                reservationModel.purchaserLastName = this.req.form['lastName'];
                reservationModel.purchaserFirstName = this.req.form['firstName'];
                reservationModel.purchaserEmail = this.req.form['email'];
                reservationModel.purchaserTel = this.req.form['tel'];
                reservationModel.paymentMethod = this.req.form['paymentMethod'];
                // 主体によっては、決済方法を強制的に固定で
                switch (this.purchaserGroup) {
                    case ReservationUtil_1.default.PURCHASER_GROUP_SPONSOR:
                    case ReservationUtil_1.default.PURCHASER_GROUP_STAFF:
                        reservationModel.paymentMethod = '';
                        break;
                    case ReservationUtil_1.default.PURCHASER_GROUP_TEL:
                        reservationModel.paymentMethod = GMOUtil_1.default.PAY_TYPE_CVS;
                        break;
                    case ReservationUtil_1.default.PURCHASER_GROUP_MEMBER:
                        reservationModel.paymentMethod = GMOUtil_1.default.PAY_TYPE_CREDIT;
                        break;
                    default:
                        break;
                }
                // セッションに購入者情報格納
                this.savePurchaser(this.req.form['lastName'], this.req.form['firstName'], this.req.form['tel'], this.req.form['email']);
                cb(null, reservationModel);
            }
            else {
                cb(new Error(this.req.__('Message.Invalid')), reservationModel);
            }
        });
    }
    /**
     * 予約情報を確定してDBに保存するプロセス
     */
    processConfirm(reservationModel, cb) {
        // 購入番号発行
        let next = (reservationModel) => {
            // 予約プロセス固有のログファイルをセット
            this.setProcessLogger(reservationModel.paymentNo, () => {
                this.logger.info('paymentNo published. paymentNo:', reservationModel.paymentNo);
                let commonUpdate = {};
                switch (this.purchaserGroup) {
                    case ReservationUtil_1.default.PURCHASER_GROUP_CUSTOMER:
                        break;
                    case ReservationUtil_1.default.PURCHASER_GROUP_MEMBER:
                        commonUpdate['member'] = this.req.memberUser.get('_id');
                        commonUpdate['member_user_id'] = this.req.memberUser.get('user_id');
                        break;
                    case ReservationUtil_1.default.PURCHASER_GROUP_SPONSOR:
                        commonUpdate['sponsor'] = this.req.sponsorUser.get('_id');
                        commonUpdate['sponsor_user_id'] = this.req.sponsorUser.get('user_id');
                        commonUpdate['sponsor_name'] = this.req.sponsorUser.get('name');
                        break;
                    case ReservationUtil_1.default.PURCHASER_GROUP_STAFF:
                        commonUpdate['staff'] = this.req.staffUser.get('_id');
                        commonUpdate['staff_user_id'] = this.req.staffUser.get('user_id');
                        commonUpdate['staff_name'] = this.req.staffUser.get('name');
                        commonUpdate['staff_email'] = this.req.staffUser.get('email');
                        commonUpdate['staff_tel'] = this.req.staffUser.get('tel');
                        commonUpdate['staff_signature'] = this.req.staffUser.get('signature');
                        break;
                    case ReservationUtil_1.default.PURCHASER_GROUP_TEL:
                        commonUpdate['status'] = ReservationUtil_1.default.STATUS_WAITING_SETTLEMENT_PAY_DESIGN;
                        commonUpdate['tel_staff'] = this.req.telStaffUser.get('_id');
                        commonUpdate['tel_staff_user_id'] = this.req.telStaffUser.get('user_id');
                        break;
                    case ReservationUtil_1.default.PURCHASER_GROUP_WINDOW:
                        commonUpdate['window'] = this.req.windowUser.get('_id');
                        commonUpdate['window_user_id'] = this.req.windowUser.get('user_id');
                        break;
                    default:
                        cb(new Error(this.req.__('Message.UnexpectedError')), reservationModel);
                        break;
                }
                // いったん全情報をDBに保存
                let promises = [];
                let reservationDocuments4update = reservationModel.toReservationDocuments();
                for (let reservationDocument4update of reservationDocuments4update) {
                    reservationDocument4update = Object.assign(reservationDocument4update, commonUpdate);
                    promises.push(new Promise((resolve, reject) => {
                        this.logger.info('updating reservation all infos..._id:', reservationDocument4update['_id']);
                        Models_1.default.Reservation.findOneAndUpdate({
                            _id: reservationDocument4update['_id']
                        }, reservationDocument4update, {
                            new: true
                        }, (err, reservation) => {
                            this.logger.info('reservation updated.', err, reservation);
                            if (err)
                                return reject(new Error(this.req.__('Message.UnexpectedError')));
                            if (!reservation)
                                return reject(new Error(this.req.__('Message.UnexpectedError')));
                            resolve();
                        });
                    }));
                }
                ;
                Promise.all(promises).then(() => {
                    cb(null, reservationModel);
                }, (err) => {
                    cb(err, reservationModel);
                });
            });
        };
        if (reservationModel.paymentNo) {
            next(reservationModel);
        }
        else {
            this.createPaymentNo((err, paymentNo) => {
                if (err) {
                    cb(new Error(this.req.__('Message.UnexpectedError')), reservationModel);
                }
                else {
                    reservationModel.paymentNo = paymentNo;
                    next(reservationModel);
                }
            });
        }
    }
    /**
     * 購入番号から全ての予約を完了にする
     *
     * @param {string} paymentNo 購入番号
     * @param {Object} update 追加更新パラメータ
     */
    processFixReservations(paymentNo, update, cb) {
        update['status'] = ReservationUtil_1.default.STATUS_RESERVED;
        update['purchased_at'] = Date.now();
        update['updated_user'] = 'ReserveBaseController';
        // 予約完了ステータスへ変更
        this.logger.info('updating reservations by paymentNo...', paymentNo, update);
        Models_1.default.Reservation.update({
            payment_no: paymentNo
        }, update, {
            multi: true
        }, (err, raw) => {
            this.logger.info('reservations updated.', err, raw);
            if (err) {
                cb(new Error('any reservations not updated.'));
            }
            else {
                // 完了メールキューがあれば何も更新しないし、なければ追加する
                this.logger.info('creating reservationEmailCue...');
                Models_1.default.ReservationEmailCue.create({
                    payment_no: paymentNo,
                    is_sent: false
                }, (err, cueDocument) => {
                    this.logger.info('reservationEmailCue created.', err, cueDocument);
                    if (err) {
                    }
                    cb(null);
                });
            }
        });
    }
    /**
     * 予約プロセス用のロガーを設定する
     * 1決済管理番号につき、1ログファイル
     *
     * @param {string} paymentNo 予約番号
     */
    setProcessLogger(paymentNo, cb) {
        Util_1.default.getReservationLogger(paymentNo, (err, logger) => {
            if (err) {
            }
            else {
                this.logger = logger;
            }
            cb();
        });
    }
    /**
     * 購入管理番号生成
     */
    createPaymentNo(cb) {
        Models_1.default.Sequence.findOneAndUpdate({
            target: 'payment_no'
        }, {
            $inc: {
                no: 1
            }
        }, {
            new: true
        }, (err, sequenceDocument) => {
            if (err) {
                cb(err, null);
            }
            else {
                let no = sequenceDocument.get('no');
                let paymentNo = `${no}${Util_1.default.getCheckDigit(no)}`;
                cb(err, paymentNo);
            }
        });
    }
    /**
     * 購入者情報をセッションに保管する
     */
    savePurchaser(lastName, firstName, tel, email) {
        this.req.session['purchaser'] = {
            lastName: lastName,
            firstName: firstName,
            tel: tel,
            email: email
        };
    }
    /**
     * 購入者情報をセッションから探す
     */
    findPurchaser() {
        return (this.req.session['purchaser']) ? this.req.session['purchaser'] : undefined;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReserveBaseController;