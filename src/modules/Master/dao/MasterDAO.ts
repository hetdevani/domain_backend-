import { IMaster } from '../interfaces/IMaster';
import { BaseDAO } from '../../common/dao/BaseDAO';
import { Master } from '../models/Master';

export class MasterDAO extends BaseDAO<IMaster> {
    constructor() {
        super(Master);
    }
}

export default MasterDAO;
