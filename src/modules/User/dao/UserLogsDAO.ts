import { IUserLogs } from '../interfaces/IUserLogs';
import { BaseDAO } from '../../common/dao/BaseDAO';
import { UserLogs } from '../models/UserLogs';

export class UserLogsDAO extends BaseDAO<IUserLogs> {
    constructor() {
        super(UserLogs);
    }
}

export default UserLogsDAO;
