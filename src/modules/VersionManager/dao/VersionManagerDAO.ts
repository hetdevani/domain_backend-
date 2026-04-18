import { IVersionManager } from '../interfaces/IVersionManager';
import { BaseDAO } from '../../common/dao/BaseDAO';
import { VersionManager } from '../models/VersionManager';

export class VersionManagerDAO extends BaseDAO<IVersionManager> {
    constructor() {
        super(VersionManager);
    }
}

export default VersionManagerDAO;
