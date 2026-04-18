import { BaseController } from '../../common/controller/BaseController';
import { IAccountDeleteRequest } from '../interfaces/IAccountDeleteRequest';
import AccountDeleteRequestService from '../services/AccountDeleteRequestService';

export class WebAccountDeleteRequestController extends BaseController<IAccountDeleteRequest> {
    constructor() {
        super(AccountDeleteRequestService, 'AccountDeleteRequest');
    }
}
