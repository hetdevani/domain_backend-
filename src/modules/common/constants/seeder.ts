import { SeederConfig } from "../../seeder/interfaces/ISeeder";

export const SEEDER_DATA_CONFIG: SeederConfig = {
    User: {
        uniqueField: ['email']
    },
    Master: {
        uniqueField: ['code']
    },
    SeriesGenerator: {
        uniqueField: ['name', 'type']
    },
    Role: {
        uniqueField: ['userType', 'isDefault']
    },
    Setting: {
        uniqueField: ['type']
    },
    StaticPage: {
        uniqueField: ['code']
    }
}