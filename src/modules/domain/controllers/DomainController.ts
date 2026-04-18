import { Request, Response } from 'express';
import ResellerClubService from '../services/ResellerClubService';
import { SUPPORTED_TLDS } from '../../../common/constants/tlds';
import { messages } from '../../common/config/message';
import { SuccessResponseHandler } from '../../common/response/successResponse';
import { ErrorResponseHandler } from '../../common/response/errorResponse';
import logger from '../../common/services/WinstonLogger';

export class DomainController {
    public async checkAvailability(req: Request, res: Response): Promise<Response> {
        try {
            const { domainName, tlds } = req.query;
            if (!domainName) {
                throw { status: 400, message: 'Domain name is required' };
            }

            // Remove spaces, www., and strip any tld they might have mistakenly pasted
            let searchStr = (domainName as string).toLowerCase().trim().replace(/^www\./, '');
            searchStr = searchStr.split('.')[0]; 

            if (!searchStr || searchStr.length < 3) {
                 throw { status: 400, message: 'Please enter a valid domain name (min 3 characters)' };
            }

            const targetTlds = tlds ? (tlds as string).split(',') : SUPPORTED_TLDS;

            const rawData = await ResellerClubService.checkAvailability(searchStr, targetTlds);

            const available: any[] = [];
            const taken: string[] = [];

            // Mock static pricing engine for Phase 1. 
            // Phase 4 will migrate this to a database-driven Pricing Model.
            const tempPricingMap: Record<string, number> = {
                'com': 850,
                'in': 499,
                'net': 900,
                'org': 1050,
                'co': 2100,
                'co.in': 399,
                'online': 150,
                'store': 199,
                'default': 999
            };

            for (const key in rawData) {
                if (rawData.hasOwnProperty(key)) {
                    const result = rawData[key];
                    const extension = key.split('.').slice(1).join('.'); // extract 'com' from 'axits.com'

                    if (result.status && result.status.toLowerCase() === 'available') {
                        const price = tempPricingMap[extension] || tempPricingMap['default'];
                        available.push({
                            domain: key,
                            extension: extension,
                            status: 'available',
                            price: price
                        });
                    } else {
                        taken.push(key);
                    }
                }
            }

            // Sort available so .com and .in are usually first
            const popularTlds = ['com', 'in', 'net'];
            available.sort((a, b) => {
                const aIndex = popularTlds.indexOf(a.extension);
                const bIndex = popularTlds.indexOf(b.extension);
                if (aIndex === -1 && bIndex === -1) return 0;
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
            });

            return SuccessResponseHandler.sendSuccessResponse(res, { ...messages.OK, message: "Domain availability checked successfully" }, {
                searchedDomain: searchStr,
                available,
                taken
            });
        } catch (error: any) {
             return ErrorResponseHandler.sendErrorResponse(res, error);
        }
    }
}
