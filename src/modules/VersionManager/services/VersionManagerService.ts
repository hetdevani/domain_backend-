import VersionManagerDAO from '../dao/VersionManagerDAO';
import { IVersionManager } from '../interfaces/IVersionManager';
import { VersionManager } from '../models/VersionManager';

export class VersionManagerService extends VersionManagerDAO {

    public async activeStatus(id: string) {

        const isVersionActiveOperatingSystem = await VersionManager.findById(id);

        if (isVersionActiveOperatingSystem) {

            // Set all other versions to inactive
            await VersionManager.updateMany({ operatingSystem: isVersionActiveOperatingSystem.operatingSystem }, { isActive: false });

            // Set the specified version to active            
            await VersionManager.findByIdAndUpdate({ _id: id, operatingSystem: isVersionActiveOperatingSystem.operatingSystem }, { isActive: true });

            const data = await VersionManager.find({ operatingSystem: isVersionActiveOperatingSystem.operatingSystem, isActive: true });

            return data
        }
        return
    }

    public async find() {
        return await VersionManager.find({ isActive: true });
    }

    public async findOne(operatingSystem: any): Promise<IVersionManager | null> {
        
        const result = await VersionManager.findOne({
            operatingSystem: parseInt(operatingSystem), 
            isActive: true
        });
    
        return result ? result.toObject() : null;
    }
    
    public async findByOperatingSysytem(operatingSystem:any){
                
        const result = await VersionManager.find({
            operatingSystem: parseInt(operatingSystem), 
            isActive: true
        });
    
        return result 
    }
      

}

export default new VersionManagerService();
