export const NotificationConfig: {
    [modelName: string]: {
        [action: string]: {
            message: string,
            title: string,
            template: string,
            templateId: string | null,
            type: {
                sms: boolean,
                pushNotification: boolean,
                email: boolean,
                createDb: boolean,
                socket: boolean,
            },
            userTypes?: number[]
        }
    }
} = {};