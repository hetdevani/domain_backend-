import { BaseDAO } from '../../common/dao/BaseDAO';
import { IDeleteSync } from '../interfaces/IDeleteSync';
import { DeleteSync } from '../models/DeleteSync';

export class DeleteSyncDAO extends BaseDAO<IDeleteSync> {
    constructor() {
        super(DeleteSync);
    }
}

export default DeleteSyncDAO;