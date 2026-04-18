import { ISetting } from '../interfaces/ISetting';
import { BaseDAO } from '../../common/dao/BaseDAO';
import { Setting } from '../models/Setting';

export class SettingDAO extends BaseDAO<ISetting> {
    constructor() {
        super(Setting);
    }
}

export default SettingDAO;
