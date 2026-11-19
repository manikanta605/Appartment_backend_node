const { Notification } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    let where = req.society_id ? { society_id: req.society_id } : {};
    if (req.user.role === 'member') {
      where = {
        ...where,
        [Op.or]: [
          { target_flat: req.user.flat_no },
          { target_flat: null }
        ]
      };
    }
    const notifications = await Notification.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 60
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications', error: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const where = { id };
    if (req.society_id) where.society_id = req.society_id;

    const notification = await Notification.findOne({ where });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    notification.is_read = true;
    await notification.save();

    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Error marking notification as read', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, message, target_flat } = req.body;
    const notification = await Notification.create({
      society_id: req.society_id,
      title,
      message,
      target_flat: target_flat || null
    });
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Error creating notification', error: err.message });
  }
};
