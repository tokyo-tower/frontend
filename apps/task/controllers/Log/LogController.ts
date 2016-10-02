import BaseController from '../BaseController';
import conf = require('config');
import fs = require('fs-extra');
import azure = require('azure-storage');
import moment = require('moment');

let blobService  = azure.createBlobService(conf.get<string>('storage_account_name'), conf.get<string>('storage_account_key'));

export default class LogController extends BaseController {
    /**
     * ログファイルをブロブストレージへコピーする
     */
    public copy2storage(): void {
        // create a container
        let container = 'logs';
        this.logger.info('creating container...');
        blobService.createContainerIfNotExists(container, {
            publicAccessLevel: 'blob'
        }, (error, result, response) => {
            this.logger.info('container created.', error, result, response);
            if (error) return process.exit(0);

            let promises = [];

            // ログファイルを監視するディレクトリリスト
            let paths = [
                'frontend',
                'reservations/0',
                'reservations/1',
                'reservations/2',
                'reservations/3',
                'reservations/4',
                'reservations/5',
                'reservations/6',
                'reservations/7',
                'reservations/8',
                'reservations/9'
            ];

            let promisesReadDir = paths.map((path) => {
                return new Promise((resolve, reject) => {
                    // ディレクトリのファイルリストを取得
                    fs.readdir(`${__dirname}/../../../../logs/${process.env.NODE_ENV}/${path}`, (err, files) => {
                        if (err) return resolve(err);

                        files.forEach((file) => {
                            promises.push(this.createPromise(container, `${path}/${file}`, `${__dirname}/../../../../logs/${process.env.NODE_ENV}/${path}/${file}`));
                        });

                        resolve();
                    });
                });
            });

            Promise.all(promisesReadDir).then(() =>{
                this.logger.info('promisesReadDir promised.');
                Promise.all(promises).then(() =>{
                    this.logger.info('promised.');
                    process.exit(0);
                }).catch((err) => {
                    this.logger.error('promised.', err);
                    process.exit(0);
                });
            }).catch((err) => {
                this.logger.info('promisesReadDir promised.', err);
                process.exit(0);
            });
        });
    }

    private createPromise(container: string, blob: string, localFileName: string): Promise<Function> {
        return new Promise((resolve, reject) => {
            fs.stat(localFileName, (err, stats) => {
                if (err) return reject(err);

                // 更新日時が10分以上前であれば何もしない
                if (stats.mtime < moment().add(-10, 'minutes').toDate()) return resolve();

                // ブロブ上書き
                this.logger.info('createBlockBlobFromLocalFile processing...');
                blobService.createBlockBlobFromLocalFile(container, blob, localFileName, (error, result, response) => {
                    this.logger.info('createBlockBlobFromLocalFile processed.', error, result, response);
                    (error) ? reject(error) : resolve();
                });
            });
        })
    }
}
