import { IRole } from '../interfaces/IRole';
import { BaseDAO } from '../../common/dao/BaseDAO';
import { Role } from '../models/Role';

class RoleDAO extends BaseDAO<IRole> {
    constructor() {
        super(Role);
    }
}

export default RoleDAO;