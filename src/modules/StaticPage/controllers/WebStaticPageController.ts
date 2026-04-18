import { BaseController } from '../../common/controller/BaseController';
import { IStaticPage } from '../interfaces/IStaticPage';
import StaticPageService from '../services/StaticPageService';

export class WebStaticPageController extends BaseController<IStaticPage> {
    constructor() {
        super(StaticPageService, 'StaticPage');
    }
}
