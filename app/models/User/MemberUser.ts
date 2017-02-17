import BaseUser from './BaseUser';

/**
 * メルマガ会員ユーザークラス
 */
export default class MemberUser extends BaseUser {
    public static AUTH_SESSION_NAME = 'TTTSFrontendMemberAuth';

    // tslint:disable-next-line:function-name
    public static parse(session: Express.Session): MemberUser {
        const user = new MemberUser();

        // セッション値からオブジェクトにセット
        if (session.hasOwnProperty(MemberUser.AUTH_SESSION_NAME)) {
            Object.keys(session[MemberUser.AUTH_SESSION_NAME]).forEach((propertyName) => {
                (<any>user)[propertyName] = session[MemberUser.AUTH_SESSION_NAME][propertyName];
            });
        }

        return user;
    }
}
