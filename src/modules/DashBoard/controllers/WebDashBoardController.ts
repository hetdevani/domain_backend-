import { Request, Response } from 'express';
import { SuccessResponseHandler } from '../../common/response/successResponse';
import { ErrorResponseHandler } from '../../common/response/errorResponse';
import { messages } from '../message';
import { commonMessages } from '../../common/constants/message';
import { Types } from 'mongoose';
import DashBoardService from '../services/DashBoardService';
import CommonService from '../../common/services/CommonService';
import { database } from 'firebase-admin';

export class WebDashBoardController {
    constructor() { }

}
