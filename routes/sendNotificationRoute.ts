// import express from 'express';
// import { sendPushNotification } from '../services/firebase_service';  // Assuming firebase.ts is where your function is

// const router = express.Router();

// router.post('/send-notification', async (req, res) => {
//   const { fcmToken, title, body } = req.body;

//   try {
//     await sendPushNotification(fcmToken, title, body);
//     res.status(200).send({ message: 'Notification sent!' });
//   } catch (error) {
//     res.status(500).send({ error: 'Failed to send notification' });
//   }
// });

// export default router;
