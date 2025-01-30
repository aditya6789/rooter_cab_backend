import express from 'express';
import { 
    createPlan, 
    getAllPlans, 
    updatePlan, 
    deletePlan,
    getPlansByVehicleType,
    subscribeToPlan,
    getActiveSubscriptions,
    getExpiredSubscriptions,
    getSubscriptionByUserId
} from '../controller/subscriptionController';

const subscriptionRoute = express.Router();

// Admin routes
subscriptionRoute.post('/plans', createPlan);
subscriptionRoute.get('/plans', getAllPlans);
subscriptionRoute.put('/plans/:id', updatePlan);
subscriptionRoute.delete('/plans/:id', deletePlan);

// Driver routes
subscriptionRoute.get('/plans/vehicle/:vehicleType', getPlansByVehicleType);
subscriptionRoute.post('/subscribe', subscribeToPlan);
subscriptionRoute.get('/active/:userId', getActiveSubscriptions);
subscriptionRoute.get('/expired/:userId', getExpiredSubscriptions);
subscriptionRoute.get('/:userId', getSubscriptionByUserId);

export default subscriptionRoute; 