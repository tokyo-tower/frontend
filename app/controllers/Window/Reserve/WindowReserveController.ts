import { Models } from '@motionpicture/ttts-domain';
import { ScreenUtil } from '@motionpicture/ttts-domain';
import { FilmUtil } from '@motionpicture/ttts-domain';
import { ReservationUtil } from '@motionpicture/ttts-domain';
import * as moment from 'moment';
import GMOUtil from '../../../../common/Util/GMO/GMOUtil';
import reservePerformanceForm from '../../../forms/reserve/reservePerformanceForm';
import reserveSeatForm from '../../../forms/reserve/reserveSeatForm';
import ReservationModel from '../../../models/Reserve/ReservationModel';
import ReserveBaseController from '../../ReserveBaseController';
import ReserveControllerInterface from '../../ReserveControllerInterface';

export default class WindowReserveController extends ReserveBaseController implements ReserveControllerInterface {
    public purchaserGroup = ReservationUtil.PURCHASER_GROUP_WINDOW;
    public layout = 'layouts/window/layout';

    public start(): void {
        this.processStart((err, reservationModel) => {
            if (err) this.next(new Error(this.req.__('Message.UnexpectedError')));

            if (reservationModel.performance) {
                reservationModel.save(() => {
                    const cb = this.router.build('window.reserve.seats', { token: reservationModel.token });
                    this.res.redirect(`${this.router.build('window.reserve.terms', { token: reservationModel.token })}?cb=${encodeURIComponent(cb)}`);
                });
            } else {
                reservationModel.save(() => {
                    const cb = this.router.build('window.reserve.performances', { token: reservationModel.token });
                    this.res.redirect(`${this.router.build('window.reserve.terms', { token: reservationModel.token })}?cb=${encodeURIComponent(cb)}`);
                });
            }
        });
    }

    /**
     * 規約(スキップ)
     */
    public terms(): void {
        const cb = (this.req.query.cb) ? this.req.query.cb : '/';
        this.res.redirect(cb);
    }

    /**
     * スケジュール選択
     */
    public performances(): void {
        const token = this.req.params.token;
        ReservationModel.find(token, (err, reservationModel) => {
            if (err) return this.next(new Error(this.req.__('Message.Expired')));

            if (this.req.method === 'POST') {
                reservePerformanceForm(this.req, this.res, () => {
                    if (this.req.form.isValid) {
                        // パフォーマンスFIX
                        const performanceId = (<any>this.req.form).performanceId;
                        // tslint:disable-next-line:no-shadowed-variable
                        this.processFixPerformance(reservationModel, performanceId, (fixPerformanceErr, reservationModel) => {
                            if (fixPerformanceErr) {
                                this.next(fixPerformanceErr);
                            } else {
                                reservationModel.save(() => {
                                    this.res.redirect(this.router.build('window.reserve.seats', { token: token }));
                                });
                            }
                        });
                    } else {
                        this.next(new Error(this.req.__('Message.UnexpectedError')));
                    }
                });
            } else {
                // 仮予約あればキャンセルする
                // tslint:disable-next-line:no-shadowed-variable
                this.processCancelSeats(reservationModel, (cancelSeatsErr, reservationModel) => {
                    if (cancelSeatsErr) return this.next(cancelSeatsErr);

                    reservationModel.save(() => {
                        this.res.render('window/reserve/performances', {
                            FilmUtil: FilmUtil
                        });
                    });
                });
            }
        });
    }

    /**
     * 座席選択
     */
    public seats(): void {
        const token = this.req.params.token;
        ReservationModel.find(token, (err, reservationModel) => {
            if (err) return this.next(new Error(this.req.__('Message.Expired')));

            const limit = reservationModel.getSeatsLimit();

            if (this.req.method === 'POST') {
                reserveSeatForm(this.req, this.res, () => {
                    if (this.req.form.isValid) {

                        const seatCodes: string[] = JSON.parse((<any>this.req.form).seatCodes);

                        // 追加指定席を合わせて制限枚数を超過した場合
                        if (seatCodes.length > limit) {
                            const message = this.req.__('Message.seatsLimit{{limit}}', { limit: limit.toString() });
                            this.res.redirect(`${this.router.build('window.reserve.seats', { token: token })}?message=${encodeURIComponent(message)}`);

                        } else {
                            // 仮予約あればキャンセルする
                            // tslint:disable-next-line:no-shadowed-variable
                            this.processCancelSeats(reservationModel, (cancelSeatsErr, reservationModel) => {
                                if (cancelSeatsErr) return this.next(cancelSeatsErr);

                                // 座席FIX
                                // tslint:disable-next-line:no-shadowed-variable
                                this.processFixSeats(reservationModel, seatCodes, (fixSeatsErr, reservationModel) => {
                                    if (fixSeatsErr) {
                                        reservationModel.save(() => {
                                            const message = this.req.__('Message.SelectedSeatsUnavailable');
                                            this.res.redirect(`${this.router.build('window.reserve.seats', { token: token })}?message=${encodeURIComponent(message)}`);
                                        });
                                    } else {
                                        reservationModel.save(() => {
                                            // 券種選択へ
                                            this.res.redirect(this.router.build('window.reserve.tickets', { token: token }));
                                        });
                                    }
                                });
                            });
                        }
                    } else {
                        this.res.redirect(this.router.build('window.reserve.seats', { token: token }));
                    }
                });
            } else {
                this.res.render('window/reserve/seats', {
                    reservationModel: reservationModel,
                    limit: limit
                });
            }
        });
    }

    /**
     * 券種選択
     */
    public tickets(): void {
        const token = this.req.params.token;
        ReservationModel.find(token, (err, reservationModel) => {
            if (err) return this.next(new Error(this.req.__('Message.Expired')));

            reservationModel.paymentMethod = null;

            if (this.req.method === 'POST') {
                // tslint:disable-next-line:no-shadowed-variable
                this.processFixTickets(reservationModel, (fixTicketsErr, reservationModel) => {
                    if (fixTicketsErr) {
                        this.res.redirect(this.router.build('window.reserve.tickets', { token: token }));
                    } else {
                        reservationModel.save(() => {
                            this.res.redirect(this.router.build('window.reserve.profile', { token: token }));
                        });
                    }
                });
            } else {
                this.res.render('window/reserve/tickets', {
                    reservationModel: reservationModel
                });
            }
        });
    }

    /**
     * 購入者情報
     */
    public profile(): void {
        const token = this.req.params.token;
        ReservationModel.find(token, (err, reservationModel) => {
            if (err) return this.next(new Error(this.req.__('Message.Expired')));

            if (this.req.method === 'POST') {
                // tslint:disable-next-line:no-shadowed-variable
                this.processFixProfile(reservationModel, (fixProfileErr, reservationModel) => {
                    if (fixProfileErr) {
                        this.res.render('window/reserve/profile', {
                            reservationModel: reservationModel
                        });
                    } else {
                        reservationModel.save(() => {
                            this.res.redirect(this.router.build('window.reserve.confirm', { token: token }));
                        });
                    }
                });
            } else {
                // セッションに情報があれば、フォーム初期値設定
                const email = reservationModel.purchaserEmail;
                this.res.locals.lastName = reservationModel.purchaserLastName;
                this.res.locals.firstName = reservationModel.purchaserFirstName;
                this.res.locals.tel = reservationModel.purchaserTel;
                this.res.locals.age = reservationModel.purchaserAge;
                this.res.locals.address = reservationModel.purchaserAddress;
                this.res.locals.gender = reservationModel.purchaserGender;
                this.res.locals.email = (email) ? email : '';
                this.res.locals.emailConfirm = (email) ? email.substr(0, email.indexOf('@')) : '';
                this.res.locals.emailConfirmDomain = (email) ? email.substr(email.indexOf('@') + 1) : '';
                this.res.locals.paymentMethod = (reservationModel.paymentMethod) ? reservationModel.paymentMethod : GMOUtil.PAY_TYPE_CREDIT;

                this.res.render('window/reserve/profile', {
                    reservationModel: reservationModel
                });
            }
        });
    }

    /**
     * 予約内容確認
     */
    public confirm(): void {
        const token = this.req.params.token;
        ReservationModel.find(token, (err, reservationModel) => {
            if (err) return this.next(new Error(this.req.__('Message.Expired')));

            if (this.req.method === 'POST') {
                // tslint:disable-next-line:no-shadowed-variable
                this.processConfirm(reservationModel, (processConfirmErr, reservationModel) => {
                    if (processConfirmErr) {
                        reservationModel.remove(() => {
                            this.next(processConfirmErr);
                        });
                    } else {
                        // 予約確定
                        this.processFixReservations(reservationModel.paymentNo, {}, (fixReservationErr) => {
                            if (fixReservationErr) {
                                const message = fixReservationErr.message;
                                this.res.redirect(`${this.router.build('window.reserve.confirm', { token: token })}?message=${encodeURIComponent(message)}`);
                            } else {
                                reservationModel.remove(() => {
                                    this.logger.info('redirecting to complete...');
                                    this.res.redirect(this.router.build('window.reserve.complete', { paymentNo: reservationModel.paymentNo }));
                                });
                            }
                        });
                    }
                });
            } else {
                this.res.render('window/reserve/confirm', {
                    reservationModel: reservationModel
                });
            }
        });
    }

    /**
     * 予約完了
     */
    public complete(): void {
        const paymentNo = this.req.params.paymentNo;
        Models.Reservation.find(
            {
                payment_no: paymentNo,
                status: ReservationUtil.STATUS_RESERVED,
                window: this.req.windowUser.get('_id'),
                purchased_at: { // 購入確定から30分有効
                    // tslint:disable-next-line:no-magic-numbers
                    $gt: moment().add(-30, 'minutes').toISOString()
                }
            },
            (err, reservations) => {
                if (err) return this.next(new Error(this.req.__('Message.UnexpectedError')));
                if (reservations.length === 0) return this.next(new Error(this.req.__('Message.NotFound')));

                reservations.sort((a, b) => {
                    return ScreenUtil.sortBySeatCode(a.get('seat_code'), b.get('seat_code'));
                });

                this.res.render('window/reserve/complete', {
                    reservationDocuments: reservations
                });
            }
        );
    }
}
