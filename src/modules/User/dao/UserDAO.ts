import { IUser } from '../interfaces/IUser';
import { BaseDAO } from '../../common/dao/BaseDAO';
import { User } from '../models/User';

export class UserDAO extends BaseDAO<IUser> {
    constructor() {
        super(User);
    }
}

export default UserDAO;