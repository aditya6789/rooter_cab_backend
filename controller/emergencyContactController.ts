import { Request, Response } from 'express';
import EmergencyContact from '../models/emergencyContactsModel';
import { sendEmergencySMS } from '../services/smsService';

const EmergencyContactController = {
  // Add emergency contacts for a user
  async addEmergencyContacts(req: Request, res: Response): Promise<void> {
    console.log("addEmergencyContacts");
    try {
      const { userId, contacts } = req.body;
      console.log(userId, contacts);

      if (!userId || !contacts || !Array.isArray(contacts)) {
        res.status(400).json({ message: 'Invalid request data' });
        return;
      }

      // Check if user already has emergency contacts
      let emergencyContact = await EmergencyContact.findOne({ userId });

      if (emergencyContact) {
        // Update existing contacts
        emergencyContact.contacts = contacts;
        await emergencyContact.save();
      } else {
        // Create new emergency contacts entry
        emergencyContact = new EmergencyContact({
          userId,
          contacts
        });
        await emergencyContact.save();
      }

      res.status(200).json(emergencyContact);
    } catch (error) {
      res.status(500).json({ message: 'Error adding emergency contacts', error });
    }
  },

  // Get emergency contacts for a user
  async getEmergencyContacts(req: Request, res: Response): Promise<void> {
    console.log("getEmergencyContacts");
    try {
      const { userId } = req.params;
      console.log(userId);
      const emergencyContacts = await EmergencyContact.findOne({ userId });
      console.log(emergencyContacts);
      if (!emergencyContacts) {
        res.status(404).json({ message: 'No emergency contacts found for this user' });
        return;
      }

      res.status(200).json(emergencyContacts);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving emergency contacts', error });
    }
  },

  // Update emergency contacts for a user
  async updateEmergencyContacts(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { contacts } = req.body;

      if (!contacts || !Array.isArray(contacts)) {
        res.status(400).json({ message: 'Invalid contacts data' });
        return;
      }

      const updatedContacts = await EmergencyContact.findOneAndUpdate(
        { userId },
        { contacts },
        { new: true }
      );

      if (!updatedContacts) {
        res.status(404).json({ message: 'Emergency contacts not found' });
        return;
      }

      res.status(200).json(updatedContacts);
    } catch (error) {
      res.status(500).json({ message: 'Error updating emergency contacts', error });
    }
  },

  // Delete emergency contacts for a user
  async deleteEmergencyContacts(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const result = await EmergencyContact.findOneAndDelete({ userId });

      if (!result) {
        res.status(404).json({ message: 'Emergency contacts not found' });
        return;
      }

      res.status(200).json({ message: 'Emergency contacts deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting emergency contacts', error });
    }
  },
  async sendEmergencySMS(req: Request, res: Response): Promise<void> {
    try {
      const {  latitude, longitude , userId } = req.body;
      const emergencyContact = await EmergencyContact.findOne({ userId });
      if (!emergencyContact || !emergencyContact.contacts.length) {
        res.status(404).json({ message: 'No emergency contacts found for this user' });
        return;
      }

      const phones = emergencyContact.contacts.map(contact => contact.phone); // Get all contact phones

      // Create a geo URI that works on most mobile devices
      const mapsLink = `geo:${latitude},${longitude}?q=${latitude},${longitude}(Emergency Location)&mode=d`;
      
      // Alternative format that works well on both Android and iOS
      const alternateMapsLink = `https://maps.google.com/?q=latitude,longitude`;
      
      await sendEmergencySMS(phones, alternateMapsLink);
      res.status(200).json({ message: 'Emergency SMS sent successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error sending emergency SMS', error });
    }
  }
};

export default EmergencyContactController;
