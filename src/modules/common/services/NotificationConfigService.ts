import { UserNotification } from "../../User/notification";

export class NotificationConfigureService {

    public notificationConfigure(): void {
        new UserNotification();
    }
}

export default new NotificationConfigureService();

