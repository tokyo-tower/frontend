import { Models } from '@motionpicture/ttts-domain';
import { ReservationUtil } from '@motionpicture/ttts-domain';
import * as log4js from 'log4js';
import sponsorCancelForm from '../../../forms/sponsor/sponsorCancelForm';
import BaseController from '../../BaseController';

/**
 * 外部関係者座席予約キャンセルコントローラー
 *
 * @export
 * @class SponsorCancelController
 * @extends {BaseController}
 */
export default class SponsorCancelController extends BaseController {
    public layout = 'layouts/sponsor/layout';

    /**
     * チケットキャンセル
     */
    public index(): void {
        if (this.req.sponsorUser && this.req.sponsorUser.isAuthenticated()) {
            // ログイン時そのまま
        } else {
            // this.req.setLocale('ja');
        }

        if (this.req.method === 'POST') {
            const form = sponsorCancelForm(this.req);
            form(this.req, this.res, () => {
                if (this.req.form && this.req.form.isValid) {
                    // 予約を取得
                    Models.Reservation.find(
                        {
                            payment_no: (<any>this.req.form).paymentNo,
                            purchaser_tel: { $regex: `${(<any>this.req.form).last4DigitsOfTel}$` },
                            purchaser_group: ReservationUtil.PURCHASER_GROUP_SPONSOR,
                            status: ReservationUtil.STATUS_RESERVED
                        },
                        (findReservationErr, reservations) => {
                            if (findReservationErr) {
                                this.res.json({
                                    success: false,
                                    message: this.req.__('Message.UnexpectedError')
                                });
                            } else {
                                if (reservations.length === 0) {
                                    this.res.json({
                                        success: false,
                                        message: this.req.__('Message.invalidPaymentNoOrLast4DigitsOfTel')
                                    });
                                } else {
                                    const results = reservations.map((reservation) => {
                                        return {
                                            _id: reservation.get('_id'),
                                            seat_code: reservation.get('seat_code'),
                                            payment_no: reservation.get('payment_no'),
                                            film_name_ja: reservation.get('film_name_ja'),
                                            film_name_en: reservation.get('film_name_en'),
                                            performance_start_str_ja: reservation.get('performance_start_str_ja'),
                                            performance_start_str_en: reservation.get('performance_start_str_en'),
                                            location_str_ja: reservation.get('location_str_ja'),
                                            location_str_en: reservation.get('location_str_en')
                                        };
                                    });

                                    this.res.json({
                                        success: true,
                                        message: null,
                                        reservations: results
                                    });
                                }
                            }
                        }
                    );
                } else {
                    this.res.json({
                        success: false,
                        message: this.req.__('Message.invalidPaymentNoOrLast4DigitsOfTel')
                    });
                }
            });
        } else {
            this.res.locals.paymentNo = '';
            this.res.locals.last4DigitsOfTel = '';

            this.res.render('sponsor/cancel');
        }
    }

    /**
     * 購入番号からキャンセルする
     */
    public executeByPaymentNo(): void {
        if (!this.req.sponsorUser) return this.next(new Error(this.req.__('Message.UnexpectedError')));
        const sponsorUser = this.req.sponsorUser;

        this.logger = log4js.getLogger('cancel');

        // 予約IDリストをjson形式で受け取る
        const reservationIds = JSON.parse(this.req.body.reservationIds);
        if (Array.isArray(reservationIds)) {
            const promises = reservationIds.map((id) => {
                return new Promise((resolve, reject) => {
                    this.logger.info('updating to STATUS_KEPT_BY_TTTS by sponsor... sponsor:', sponsorUser.get('user_id'), 'id:', id);
                    Models.Reservation.findOneAndUpdate(
                        {
                            _id: id,
                            payment_no: this.req.body.paymentNo,
                            purchaser_tel: { $regex: `${this.req.body.last4DigitsOfTel}$` },
                            purchaser_group: ReservationUtil.PURCHASER_GROUP_SPONSOR,
                            status: ReservationUtil.STATUS_RESERVED
                        },
                        { status: ReservationUtil.STATUS_KEPT_BY_TTTS },
                        { new: true },
                        (err, reservation) => {
                            this.logger.info('updated to STATUS_KEPT_BY_TTTS.', err, reservation, 'sponsor:', sponsorUser.get('user_id'), 'id:', id);
                            (err) ? reject(err) : resolve();
                        }
                    );
                });
            });

            Promise.all(promises).then(
                () => {
                    this.res.json({
                        success: true,
                        message: null
                    });
                },
                (err) => {
                    this.res.json({
                        success: false,
                        message: err.message
                    });
                }
            );
        } else {
            this.res.json({
                success: false,
                message: this.req.__('Message.UnexpectedError')
            });
        }
    }

    public execute(): void {
        if (!this.req.sponsorUser) return this.next(new Error(this.req.__('Message.UnexpectedError')));
        const sponsorUser = this.req.sponsorUser;

        this.logger = log4js.getLogger('cancel');

        // 予約IDリストをjson形式で受け取る
        const reservationIds = JSON.parse(this.req.body.reservationIds);
        if (Array.isArray(reservationIds)) {
            const promises = reservationIds.map((id) => {
                return new Promise((resolve, reject) => {
                    this.logger.info('updating to STATUS_KEPT_BY_TTTS by sponsor... sponsor:', sponsorUser.get('user_id'), 'id:', id);
                    Models.Reservation.findOneAndUpdate(
                        { _id: id },
                        { status: ReservationUtil.STATUS_KEPT_BY_TTTS },
                        { new: true },
                        (err, reservation) => {
                            this.logger.info('updated to STATUS_KEPT_BY_TTTS.', err, reservation, 'sponsor:', sponsorUser.get('user_id'), 'id:', id);
                            (err) ? reject(err) : resolve();
                        }
                    );
                });
            });

            Promise.all(promises).then(
                () => {
                    this.res.json({
                        success: true,
                        message: null
                    });
                },
                (err) => {
                    this.res.json({
                        success: false,
                        message: err.message
                    });
                }
            );
        } else {
            this.res.json({
                success: false,
                message: this.req.__('Message.UnexpectedError')
            });
        }
    }
}