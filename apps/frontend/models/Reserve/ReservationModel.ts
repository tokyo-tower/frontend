import PurchaseResultModel from './PurchaseResultModel';
import Util from '../../../common/Util/Util';

/**
 * 予約情報モデル
 * 
 * 予約プロセス中の情報を全て管理するためのモデルです
 * この情報をセッションで引き継くことで、予約プロセスを管理しています
 */
export default class ReservationModel {
    /**
     * 予約トークン
     */
    public token: string;

    /**
     * パフォーマンス
     */
    public performance: {
        _id: string,
        day: string,
        start_time: string,
        end_time: string,
        /**
         * 劇場
         */
        theater: {
            _id: string,
            name: string,
            name_en: string,
        },
        /**
         * スクリーン
         */
        screen: {
            _id: string,
            name: string,
            name_en: string,
        },
        /**
         * 作品
         */
        film: {
            _id: string,
            name: string,
            name_en: string,
        },
    };

    /**
     * 座席選択リスト
     */
    public seatChoices: Array<{
        code: string,
        ticket: {
            type: string,
            name: string,
            name_en: string,
            price: number
        }
    }>;

    /**
     * プロフィール
     */
    public profile: {
        last_name: string,
        first_name: string,
        email: string,
        tel: string,
    };

    /**
     * 決済方法
     */
    public paymentMethod: string;

    /**
     * プロセス中の購入情報をセッションに保存する
     * 
     * 有効期間: 3600秒
     */
    public save(cb: (err: Error) => any) {
        let client = Util.getRedisClient();
        let key = ReservationModel.getRedisKey(this.token);
        client.setex(key, 3600, JSON.stringify(this), (err, reply) => {
            client.quit();
            cb(err);
        });
    }

    /**
     * プロセス中の購入情報をセッションから削除する
     */
    public remove(cb: (err: Error) => any) {
        let client = Util.getRedisClient();
        let key = ReservationModel.getRedisKey(this.token);
        client.del(key, (err, reply) => {
            client.quit();
            cb(err);
        });
    }

    /**
     * プロセス中の購入情報をセッションから取得する
     */
    public static find(token: string, cb: (err: Error, reservationModel: ReservationModel) => any): void {
        let client = Util.getRedisClient();
        let key = ReservationModel.getRedisKey(token);
        client.get(key, (err, reply) => {
            client.quit();

            if (err) {
                cb(err, null);
            } else {
                if (reply === null) {
                    cb(err, null);

                } else {
                    let reservationModel = new ReservationModel();
                    let reservationModelInRedis = JSON.parse(reply);
                    for (let propertyName in reservationModelInRedis) {
                        reservationModel[propertyName] = reservationModelInRedis[propertyName];
                    }

                    cb(err, reservationModel);
                }
            }
        });
    }

    /**
     * 購入用ネームスペースを取得
     *
     * @param {string} token
     * @return {string}
     */
    private static getRedisKey(token): string {
        return `TIFFReservation_${token}`;
    }

    /**
     * 購入結果モデルへ変換
     */
    public toPurchaseResult(): PurchaseResultModel {
        let purchaseResult = new PurchaseResultModel();

        purchaseResult.token = this.token;

        return purchaseResult;
    }


    /**
     * 購入ログ用の形式にする
     */
    public toLog(): Object {
        let log = {
            token: this.token
        };

        return log;
    }
}
