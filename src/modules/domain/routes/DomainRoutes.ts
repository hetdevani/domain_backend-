import express from 'express';
import { DomainController } from '../controllers/DomainController';

const router = express.Router();
const domainController = new DomainController();

router.get('/check', domainController.checkAvailability.bind(domainController));

export default router;
