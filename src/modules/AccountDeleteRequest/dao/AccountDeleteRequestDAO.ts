import { IAccountDeleteRequest } from '../interfaces/IAccountDeleteRequest';
import { BaseDAO } from '../../common/dao/BaseDAO';
import { AccountDeleteRequest } from '../models/AccountDeleteRequest';

export class AccountDeleteRequestDAO extends BaseDAO<IAccountDeleteRequest> {
    constructor() {
        super(AccountDeleteRequest);
    }
}

export default AccountDeleteRequestDAO;
