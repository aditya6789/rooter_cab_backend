import express from 'express';
import EmergencyContactController from '../controller/emergencyContactController';

const emergencyContactRoute = express.Router();

// Emergency contact management routes
emergencyContactRoute.post('/', EmergencyContactController.addEmergencyContacts);
emergencyContactRoute.get('/:userId', EmergencyContactController.getEmergencyContacts);
emergencyContactRoute.put('/:userId', EmergencyContactController.updateEmergencyContacts);
emergencyContactRoute.delete('/:userId', EmergencyContactController.deleteEmergencyContacts);

// Emergency SMS route
emergencyContactRoute.post('/send-sms', EmergencyContactController.sendEmergencySMS);

export default emergencyContactRoute;
