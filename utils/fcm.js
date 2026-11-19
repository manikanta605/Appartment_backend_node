const axios = require('axios');
const { User } = require('../models');

// If the user has a Firebase Admin SDK setup, they can use that.
// Here we provide a helper to send notifications via custom logic or hypothetical service.
exports.sendPushToUser = async (flatNo, title, body, type = 'chime') => {
  try {
    const user = await User.findOne({ where: { flat_no: flatNo } });
    if (!user || !user.fcm_token) {
      console.log(`No FCM token found for flat ${flatNo}`);
      return;
    }

    console.log(`Sending FCM to ${user.username} (Token: ${user.fcm_token.substring(0, 10)}...)`);
    
    // In a real production app, this is where we'd call:
    // admin.messaging().send({
    //   token: user.fcm_token,
    //   notification: { title, body },
    //   data: { type, sound: 'chime.mp3' },
    //   android: { notification: { sound: 'chime' } }, 
    //   apns: { payload: { aps: { sound: 'chime.wav' } } }
    // });

    // For now, we simulate the logic trace.
    return true;
  } catch (err) {
    console.error('Error in FCM logic:', err);
    return false;
  }
};
