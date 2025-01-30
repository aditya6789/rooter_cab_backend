import * as admin from 'firebase-admin';
import * as serviceAccount from '../utils/firebase_service_account.json'; // Import the service account JSON file
import driverTokenModel from '../models/notificationToken';

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount), // Type assertion to admin.ServiceAccount
  databaseURL: 'https://rootercabdriver-default-rtdb.asia-southeast1.firebasedatabase.app/', // Your Firebase project URL
});

// Function to send a push notification
export const sendPushNotification = async (fcmToken: string, title: string, body: string) => {
  const message = {
    notification: {
      title,
      body,
    },
    token: fcmToken, // Token from Flutter app
  };

  try {
    await admin.messaging().send(message);
    console.log('Push notification sent successfully');
  } catch (error:any) {

    console.error('Error sending notification:', error);
       // Handle invalid token error
       if (error.code === 'messaging/registration-token-not-registered') {
        // Here you can remove the token from your database if necessary
        await driverTokenModel.deleteOne({ token: fcmToken });
        console.log(`Removed invalid token: ${fcmToken}`);
      }
    throw new Error('Failed to send notification');
  }
};
