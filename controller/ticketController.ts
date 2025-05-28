import { NextFunction, Request, Response } from 'express';
import Ticket, { ITicket } from '../models/ticketModel';
import User from '../models/userModel';
import CustomErrorHandler from '../services/customErrorHandler';
import AuthenticatedRequest from '../middleware/types/request';

export const TicketController = {
    async createTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        if(!req.user){
            return next(CustomErrorHandler.unAuthorized());
        }
        const userId= req.user._id;
        if(req.user.role !== "admin"){
            return next(CustomErrorHandler.unAuthorized());
        }
        try {
            const { subject, description, priority } = req.body;

            // Generate a unique ticketId (e.g., TKT-2024-0001)
            const ticketCount = await Ticket.countDocuments();
            const ticketId = `TKT-${new Date().getFullYear()}-${(ticketCount + 1).toString().padStart(4, '0')}`;

            const ticket = new Ticket({
                ticketId,
                userId,
                subject,
                description,
                priority,
                updates: [{
                    updatedBy: userId,
                    message: 'Ticket created',
                }]
            });

            await ticket.save();
            res.status(201).json({
                success: true,
                message: 'Ticket created successfully',
                ticket
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: 'Error creating ticket',
                error: error.message
            });
        }
    },

    async getTickets(req: Request, res: Response) {
        try {
            const tickets = await Ticket.find()
                .populate('userId', 'full_name email phone')
                .populate('assignedTo', 'full_name')
                .populate('updates.updatedBy', 'full_name')
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                count: tickets.length,
                tickets
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error fetching tickets',
                error: error.message
            });
        }
    },

    async getTicketById(req: Request, res: Response) {
        try {
            const ticket = await Ticket.findById(req.params.id)
                .populate('userId', 'full_name email phone')
                .populate('assignedTo', 'full_name')
                .populate('updates.updatedBy', 'full_name');

            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

            res.status(200).json({
                success: true,
                ticket
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error fetching ticket',
                error: error.message
            });
        }
    },

    async updateTicket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        if(!req.user){
            return next(CustomErrorHandler.unAuthorized());
        }
        const userId= req.user._id;
        if(req.user.role !== "admin"){
            return next(CustomErrorHandler.unAuthorized());
        }   
        try {
            const { status, priority, updatedBy, message } = req.body;

            const ticket = await Ticket.findById(req.params.id);
            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

            // Update ticket fields
            if (status) ticket.status = status;
            if (priority) ticket.priority = priority;
           

            // Add update to history
            if (message && updatedBy) {
                ticket.updates.push({
                    updatedBy,
                    message,
                    timestamp: new Date()
                });
            }

            await ticket.save();

            const updatedTicket = await Ticket.findById(req.params.id)
                .populate('userId', 'full_name email phone')
                .populate('assignedTo', 'full_name')
                .populate('updates.updatedBy', 'full_name');

            res.status(200).json({
                success: true,
                message: 'Ticket updated successfully',
                ticket: updatedTicket
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error updating ticket',
                error: error.message
            });
        }
    },

    async getUserTickets(req: AuthenticatedRequest, res: Response, next: NextFunction   ) {
        if(!req.user){
            return next(CustomErrorHandler.unAuthorized());
        }
        const userId= req.user._id;
        try {
            const tickets = await Ticket.find({ userId })
                .populate('assignedTo', 'full_name')
                .populate('updates.updatedBy', 'full_name')
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                count: tickets.length,
                tickets
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error fetching user tickets',
                error: error.message
            });
        }
    },

    async searchUserByPhone(req: Request, res: Response, next: NextFunction) {
        try {
            const { phone } = req.query;

            if (!phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number is required'
                });
            }

            const users = await User.find({ phone: { $regex: phone, $options: 'i' } })
                .select('full_name email phone');

            res.status(200).json({
                success: true,
                count: users.length,
                users
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error searching users',
                error: error.message
            });
        }
    }
};
