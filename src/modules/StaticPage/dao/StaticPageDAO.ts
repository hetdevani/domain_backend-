import { IStaticPage } from '../interfaces/IStaticPage';
import { BaseDAO } from '../../common/dao/BaseDAO';
import { StaticPage } from '../models/StaticPage';

export class StaticPageDAO extends BaseDAO<IStaticPage> {
    constructor() {
        super(StaticPage);
    }
}

export default StaticPageDAO;
