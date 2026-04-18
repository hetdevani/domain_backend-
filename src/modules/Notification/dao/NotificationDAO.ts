import { INotification } from '../interfaces/INotification';
import { BaseDAO } from '../../common/dao/BaseDAO';
import { Notification } from '../models/Notification';

export class NotificationDAO extends BaseDAO<INotification> {
    constructor() {
        super(Notification);
    }
}

export default NotificationDAO;
