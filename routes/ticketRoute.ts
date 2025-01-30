import express from 'express';
import { TicketController } from '../controller/ticketController';

const router = express.Router();

router.post('/', TicketController.createTicket);
router.get('/', TicketController.getTickets);
router.get('/user/:userId', TicketController.getUserTickets);
router.get('/ticket/:id', TicketController.getTicketById);
router.put('/:id', TicketController.updateTicket);
router.get('/search/user', TicketController.searchUserByPhone);

export default router;
