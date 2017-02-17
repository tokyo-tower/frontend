/**
 * デフォルトルーター
 *
 * @function router
 * @ignore
 */
import { NextFunction, Request, Response } from 'express';
import AdmissionController from '../controllers/Admission/AdmissionController';
import CustomerReserveController from '../controllers/Customer/Reserve/CustomerReserveController';
import ErrorController from '../controllers/Error/ErrorController';
import GMOController from '../controllers/GMO/GMOController';
import GMOReserveController from '../controllers/GMO/Reserve/GMOReserveController';
import LanguageController from '../controllers/Language/LanguageController';
import OtherController from '../controllers/Other/OtherController';
import ReserveController from '../controllers/Reserve/ReserveController';

/**
 * URLルーティング
 *
 * app.get(パス, ルーティング名称, メソッド);
 * といった形でルーティングを登録する
 * ルーティング名称は、ejs側やコントローラーでURLを生成する際に用いたりするので、意識的にページ一意な値を定めること
 *
 * リクエスト毎に、req,res,nextでコントローラーインスタンスを生成して、URLに応じたメソッドを実行する、という考え方
 */
export default (app: any) => {
    // tslint:disable-next-line:variable-name
    const base = (_req: Request, _res: Response, next: NextFunction) => {
        next();
    };

    // 言語
    app.get('/language/update/:locale', 'language.update', base, (req: Request, res: Response, next: NextFunction) => { (new LanguageController(req, res, next)).update(); });

    app.get('/reserve/:token/getSeatProperties', 'reserve.getSeatProperties', base, (req: Request, res: Response, next: NextFunction) => { (new ReserveController(req, res, next)).getSeatProperties(); });
    app.get('/reserve/:reservationId/qrcode', 'reserve.qrcode', base, (req: Request, res: Response, next: NextFunction) => { (new ReserveController(req, res, next)).qrcode(); });
    app.get('/reserve/:performanceId/unavailableSeatCodes', 'reserve.getUnavailableSeatCodes', base, (req: Request, res: Response, next: NextFunction) => { (new ReserveController(req, res, next)).getUnavailableSeatCodes(); });
    app.get('/reserve/print', 'reserve.print', base, (req: Request, res: Response, next: NextFunction) => { (new ReserveController(req, res, next)).print(); });

    // GMOプロセス
    app.post('/GMO/reserve/:token/start', 'gmo.reserve.start', base, (req: Request, res: Response, next: NextFunction) => { (new GMOReserveController(req, res, next)).start(); });
    app.post('/GMO/reserve/result', 'gmo.reserve.result', base, (req: Request, res: Response, next: NextFunction) => { (new GMOReserveController(req, res, next)).result(); });
    app.get('/GMO/reserve/:paymentNo/cancel', 'gmo.reserve.cancel', base, (req: Request, res: Response, next: NextFunction) => { (new GMOReserveController(req, res, next)).cancel(); });
    app.all('/GMO/notify', 'gmo.notify', base, (req: Request, res: Response, next: NextFunction) => { (new GMOController(req, res, next)).notify(); });

    // admission
    app.all('/admission/performances', 'admission.performances', base, (req: Request, res: Response, next: NextFunction) => { (new AdmissionController(req, res, next)).performances(); });
    app.get('/admission/performance/:id/confirm', 'admission.confirm', base, (req: Request, res: Response, next: NextFunction) => { (new AdmissionController(req, res, next)).confirm(); });

    app.get('/policy', 'policy', base, (req: Request, res: Response, next: NextFunction) => { (new OtherController(req, res, next)).policy(); });
    app.get('/privacy', 'privacy', base, (req: Request, res: Response, next: NextFunction) => { (new OtherController(req, res, next)).privacy(); });
    app.get('/commercialTransactions', 'commercialTransactions', base, (req: Request, res: Response, next: NextFunction) => { (new OtherController(req, res, next)).commercialTransactions(); });

    // 一般
    // 本番環境ではhomeは存在しない
    if (process.env.NODE_ENV !== 'prod') {
        app.all('/customer/reserve/performances', 'customer.reserve.performances', base, (req: Request, res: Response, next: NextFunction) => { (new CustomerReserveController(req, res, next)).performances(); });
    }
    app.get('/customer/reserve/start', 'customer.reserve.start', base, (req: Request, res: Response, next: NextFunction) => { (new CustomerReserveController(req, res, next)).start(); });
    app.all('/customer/reserve/:token/terms', 'customer.reserve.terms', base, (req: Request, res: Response, next: NextFunction) => { (new CustomerReserveController(req, res, next)).terms(); });
    app.all('/customer/reserve/:token/seats', 'customer.reserve.seats', base, (req: Request, res: Response, next: NextFunction) => { (new CustomerReserveController(req, res, next)).seats(); });
    app.all('/customer/reserve/:token/tickets', 'customer.reserve.tickets', base, (req: Request, res: Response, next: NextFunction) => { (new CustomerReserveController(req, res, next)).tickets(); });
    app.all('/customer/reserve/:token/profile', 'customer.reserve.profile', base, (req: Request, res: Response, next: NextFunction) => { (new CustomerReserveController(req, res, next)).profile(); });
    app.all('/customer/reserve/:token/confirm', 'customer.reserve.confirm', base, (req: Request, res: Response, next: NextFunction) => { (new CustomerReserveController(req, res, next)).confirm(); });
    app.get('/customer/reserve/:paymentNo/waitingSettlement', 'customer.reserve.waitingSettlement', base, (req: Request, res: Response, next: NextFunction) => { (new CustomerReserveController(req, res, next)).waitingSettlement(); });
    app.get('/customer/reserve/:paymentNo/complete', 'customer.reserve.complete', base, (req: Request, res: Response, next: NextFunction) => { (new CustomerReserveController(req, res, next)).complete(); });

    app.get('/error/notFound', 'error.notFound', base, (req: Request, res: Response, next: NextFunction) => { (new ErrorController(req, res, next)).notFound(); });

    // 404
    // tslint:disable-next-line:variable-name
    app.use((_req: Request, res: Response) => {
        return res.redirect('/error/notFound');
    });

    // error handlers
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        req.route.name = 'error.error';
        (new ErrorController(req, res, next)).index(err);
    });
};
