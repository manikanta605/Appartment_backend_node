const { Complaint } = require('../models');

exports.getAll = async (req, res) => {
  try {
    let where = req.society_id ? { society_id: req.society_id } : {};
    if (req.user.role === 'member') {
      where.flat_no = req.user.flat_no;
    }
    const complaints = await Complaint.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching complaints', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const complaint = await Complaint.create({
      society_id: req.society_id,
      title,
      description,
      category: category || 'General',
      flat_no: req.user.flat_no || 'Office',
      resident_name: req.user.name || req.user.username,
      status: 'Open'
    });
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Error creating complaint', error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const where = { id };
    if (req.society_id) where.society_id = req.society_id;

    const complaint = await Complaint.findOne({ where });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = status;
    await complaint.save();

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Error updating complaint', error: err.message });
  }
};
