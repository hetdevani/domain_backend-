import axios from 'axios';
import logger from '../../common/services/WinstonLogger';

class ResellerClubService {
    private client: ReturnType<typeof axios.create>;

    constructor() {
        this.client = axios.create({
            baseURL: 'https://domaincheck.httpapi.com/api/'
        });
    }

    public async checkAvailability(domainInput: string, tlds: string[]): Promise<any> {
        const userId = process.env.RC_USER_ID;
        const apiKey = process.env.RC_API_KEY;
        const isTest = process.env.RC_IS_TEST === 'true';

        // Extract domain body and TLD if user provided full domain (e.g., axits.com -> axits)
        const parts = domainInput.split('.');
        const domainName = parts[0];
        
        // If user specified a TLD, move it to the front of the list to prioritize it
        if (parts.length > 1) {
            const userTld = parts.slice(1).join('.');
            if (!tlds.includes(userTld)) tlds.push(userTld);
        }

        const baseUrl = isTest 
            ? 'https://test.httpapi.com/api/domains/available.json' 
            : 'https://httpapi.com/api/domains/available.json';

        try {
            const response = await this.client.get('', {
                baseURL: baseUrl,
                params: {
                    'auth-userid': String(userId),
                    'api-key': String(apiKey),
                    'domain-name': domainName,
                    'tlds': tlds
                },
                paramsSerializer: function (params: any) {
                    const searchParams = new URLSearchParams();
                    for (const key in params) {
                        if (Object.prototype.hasOwnProperty.call(params, key)) {
                            const value = params[key];
                            if (Array.isArray(value)) {
                                value.forEach((v) => searchParams.append(key, v));
                            } else {
                                searchParams.append(key, value);
                            }
                        }
                    }
                    return searchParams.toString();
                } as any
            });

            return response.data;
        } catch (error) {
            logger.error('Error checking domain availability via ResellerClub', { error });
            throw { status: 500, message: 'External API Error fetching domain availability' };
        }
    }
}

export default new ResellerClubService();
