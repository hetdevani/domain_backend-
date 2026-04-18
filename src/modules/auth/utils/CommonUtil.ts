import RedisService from "../../common/services/RedisService";

export class CommonUtil {
    public async getUserSocket(userId: string) {
        return await RedisService.getData(`socket-${userId}`);
    }

    public async setUserSocket(userId: string, data: any) {
        return await RedisService.setData(`socket-${userId}`, data);
    }

    public async getUserInfo(userId: string) {
        return await RedisService.getData(`userInfo-${userId}`);
    }

    public async setUserInfo(userId: string, data: any) {
        return await RedisService.setData(`userInfo-${userId}`, data);
    }

    public async getVehicleUserId(vehicleId: string) {
        return await RedisService.getData(`vehicleUser${vehicleId}`);
    }

    public async setVehicleUserId(vehicleId: string, data: any) {
        return await RedisService.setData(`vehicleUser${vehicleId}`, data);
    }

    public async converIntoHours(time: string) {
        const timeParts = time.split(":");
        const timeInHour = parseInt(timeParts[0]) + (parseInt(timeParts[1]) / 60) + (parseInt(timeParts[2]) / 3600);
        return timeInHour;
    }

}

export default new CommonUtil();