const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

let messaging = null;
let isFirebaseInitialized = false;

// Attempt to initialize Firebase Admin SDK
try {
  const { initializeApp, cert, getApps } = require('firebase-admin/app');
  const { getMessaging } = require('firebase-admin/messaging');

  let serviceAccount = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      // If provided as a raw JSON string in environment variable (e.g. on Render)
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      const p = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (fs.existsSync(p)) {
        serviceAccount = require(p);
      }
    }
  }

  if (!serviceAccount) {
    const defaultPath = path.resolve(__dirname, '../config/serviceAccountKey.json');
    if (fs.existsSync(defaultPath)) {
      serviceAccount = require(defaultPath);
    }
  }

  if (serviceAccount) {
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
    messaging = getMessaging();
    isFirebaseInitialized = true;
    console.log('[FCM] Firebase Admin SDK successfully initialized with project:', serviceAccount.project_id);
  } else {
    console.log('[FCM] Service account key not found at config/serviceAccountKey.json. Running in fallback/simulation mode.');
  }
} catch (err) {
  console.warn('[FCM] Firebase Admin initialization skipped or unavailable:', err.message);
}

/**
 * Send push notification to a single FCM device token
 */
async function sendPushToToken(token, title, body, soundName = 'chime', customData = {}) {
  if (!token) return false;

  console.log(`[FCM Notification] Sending to Token (${token.substring(0, 15)}...): "${title}" - "${body}" [Sound: ${soundName}]`);

  if (!isFirebaseInitialized || !messaging) {
    // Graceful simulation mode when Firebase credentials are not yet supplied
    return { success: true, simulated: true, token, title, body };
  }

  try {
    if (token.startsWith('fcm_token_') || process.env.NODE_ENV === 'test') {
      return { success: true, simulated: true, token, title, body };
    }

    const message = {
      token,
      notification: {
        title,
        body
      },
      data: {
        ...customData,
        sound: soundName,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'residex_alerts',
          priority: 'max',
          defaultVibrateTimings: true,
          defaultSound: true
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await messaging.send(message);
    console.log('[FCM] Message sent successfully:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.warn('[FCM] Firebase messaging delivery notice:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send push notification to all resident users belonging to a specific flat
 */
async function sendPushToUser(flatNo, title, body, soundName = 'chime', customData = {}, societyId = null) {
  try {
    const { User } = require('../models');
    if (!flatNo) return;

    const where = { flat_no: flatNo };
    if (societyId) where.society_id = societyId;

    const users = await User.findAll({ where });
    if (!users || users.length === 0) {
      console.log(`[FCM] No user accounts found for Flat ${flatNo}`);
      return;
    }

    const tokens = users.map(u => u.fcm_token).filter(Boolean);
    if (tokens.length === 0) {
      console.log(`[FCM] Users found for Flat ${flatNo}, but no FCM device tokens registered yet.`);
      return;
    }

    for (const token of tokens) {
      await sendPushToToken(token, title, body, soundName, { ...customData, flat_no: flatNo });
    }
  } catch (err) {
    console.error(`[FCM] Error in sendPushToUser for flat ${flatNo}:`, err.message);
  }
}

/**
 * Send push notification to all watchmen/gatekeepers of a society
 */
async function sendPushToWatchmen(societyId, title, body, soundName = 'chime', customData = {}) {
  try {
    const { User } = require('../models');
    const where = { role: 'watchman' };
    if (societyId) where.society_id = societyId;

    const watchmen = await User.findAll({ where });
    const tokens = watchmen.map(w => w.fcm_token).filter(Boolean);

    console.log(`[FCM] Sending alert to ${tokens.length} gatekeeper(s) in society ${societyId}: "${title}"`);

    for (const token of tokens) {
      await sendPushToToken(token, title, body, soundName, { ...customData, role: 'watchman' });
    }
  } catch (err) {
    console.error(`[FCM] Error sending push to watchmen:`, err.message);
  }
}

/**
 * Broadcast notification to all members of a society (e.g. for Community posts)
 */
async function sendPushToSociety(societyId, title, body, soundName = 'notice', customData = {}, excludeUserId = null) {
  try {
    const { User } = require('../models');
    const where = { society_id: societyId };
    if (excludeUserId) {
      where.id = { [Op.ne]: excludeUserId };
    }

    const members = await User.findAll({ where });
    const tokens = members.map(m => m.fcm_token).filter(Boolean);

    console.log(`[FCM Broadcast] Broadcasting to ${tokens.length} members of society ${societyId}: "${title}"`);

    for (const token of tokens) {
      await sendPushToToken(token, title, body, soundName, customData);
    }
  } catch (err) {
    console.error(`[FCM Broadcast] Error broadcasting to society:`, err.message);
  }
}

module.exports = {
  sendPushToToken,
  sendPushToUser,
  sendPushToWatchmen,
  sendPushToSociety,
  isFirebaseInitialized: () => isFirebaseInitialized
};
