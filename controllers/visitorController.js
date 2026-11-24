const { Visitor, Notification, Member } = require('../models');

exports.createVisitor = async (req, res) => {
  const { name, phone, flat_no, photo, purpose, pre_approved } = req.body;
  try {
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    // Generate a 6-digit access pass code
    const passCode = Math.floor(100000 + Math.random() * 900000).toString();
    const initialStatus = pre_approved || req.user.role === 'member' ? 'Approved' : 'Pending';

    const visitor = await Visitor.create({
      society_id: req.society_id,
      name,
      phone,
      flat_no: flat_no || req.user.flat_no,
      photo,
      purpose: purpose || 'Guest',
      status: initialStatus,
      visit_time: timeStr,
      pass_code: passCode
    });

    // Notify resident if watchman entered it as pending
    if (initialStatus === 'Pending') {
      try {
        const { sendPushToUser } = require('../utils/fcm');
        await sendPushToUser(
          flat_no,
          'Visitor Alert · Doorbell Chime',
          `${name} is at the security gate for Flat ${flat_no}. Please confirm entry.`,
          'chime',
          { visitorId: String(visitor.id), flat_no, type: 'VisitorAlert' },
          req.society_id
        );
      } catch (e) {
        console.warn('FCM visitor push warning:', e.message);
      }

      await Notification.create({
        society_id: req.society_id,
        title: 'Visitor Entry Request',
        message: `${name} is at the gate for flat ${flat_no}. Please confirm entry.`,
        type: 'Visitor',
        related_id: visitor.id,
        target_flat: flat_no,
        image: photo,
        is_read: false
      });
    }

    res.status(201).json(visitor);
  } catch (err) {
    res.status(500).json({ message: 'Error logging visitor', error: err.message });
  }
};

exports.getVisitors = async (req, res) => {
  try {
    let where = req.society_id ? { society_id: req.society_id } : {};
    if (req.user.role === 'member') {
      where.flat_no = req.user.flat_no;
    }

    const visitors = await Visitor.findAll({
      where,
      order: [['id', 'DESC']],
      limit: 50
    });
    res.json(visitors);
  } catch (err) {
    res.status(500).json({ message: 'Error getting visitors', error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  let { status } = req.body;
  if (status === 'Checked In' || status === 'Allowed') status = 'Approved';
  if (status === 'Denied') status = 'Rejected';
  try {
    const where = { id };
    if (req.society_id) where.society_id = req.society_id;

    const visitor = await Visitor.findOne({ where });
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });

    visitor.status = status;
    await visitor.save();

    // Create a notification for the gate
    await Notification.create({
      society_id: req.society_id,
      title: 'Visitor Entry Response',
      message: `Entry for ${visitor.name} to Flat ${visitor.flat_no} has been ${status}.`,
      type: 'VisitorUpdate',
      related_id: visitor.id,
      target_flat: null,
      is_read: false
    });

    // Send push notification to gatekeepers and resident with sound
    try {
      const { sendPushToWatchmen, sendPushToUser } = require('../utils/fcm');
      await sendPushToWatchmen(
        req.society_id,
        `Gate Update: ${visitor.name}`,
        `Flat ${visitor.flat_no} marked entry for ${visitor.name} as ${status}.`,
        'chime',
        { visitorId: String(visitor.id), status, flat_no: visitor.flat_no }
      );
      await sendPushToUser(
        visitor.flat_no,
        `Visitor ${status}`,
        `${visitor.name} has been marked as ${status}.`,
        'chime',
        { visitorId: String(visitor.id), status },
        req.society_id
      );
    } catch (e) {
      console.warn('FCM status update warning:', e.message);
    }

    res.json(visitor);
  } catch (err) {
    res.status(500).json({ message: 'Error updating visitor status', error: err.message });
  }
};

// Guard verifies a visitor pass code
exports.verifyPass = async (req, res) => {
  const { pass_code } = req.body;
  try {
    const visitor = await Visitor.findOne({
      where: {
        society_id: req.society_id,
        pass_code: pass_code.trim()
      }
    });

    if (!visitor) {
      return res.status(404).json({ valid: false, message: 'Invalid or expired pass code' });
    }

    res.json({
      valid: true,
      visitor
    });
  } catch (err) {
    res.status(500).json({ message: 'Error verifying pass', error: err.message });
  }
};
