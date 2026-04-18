import { IAuthSession } from '../interfaces/IAuthSession';
import { BaseDAO } from '../../common/dao/BaseDAO';
import { AuthSession } from '../models/AuthSession';

export class AuthSessionDAO extends BaseDAO<IAuthSession> {
    constructor() {
        super(AuthSession);
    }
}

export default new AuthSessionDAO();
