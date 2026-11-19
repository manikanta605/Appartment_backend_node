const { Society } = require('../models');

// Public listing of active societies (for login dropdown or society code lookup)
exports.getPublicSocieties = async (req, res) => {
  try {
    const societies = await Society.findAll({
      where: { status: 'Active' },
      attributes: ['id', 'name', 'code', 'city', 'state', 'maintenance_amount', 'logo_url'],
      order: [['name', 'ASC']]
    });
    res.json(societies);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching societies', error: err.message });
  }
};

// Current logged in user's society details
exports.getCurrentSociety = async (req, res) => {
  try {
    if (!req.society_id) {
      return res.status(404).json({ message: 'No society associated with user' });
    }
    const society = await Society.findByPk(req.society_id);
    if (!society) {
      return res.status(404).json({ message: 'Society not found' });
    }
    res.json(society);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching current society', error: err.message });
  }
};

// Society Admin updates their own society settings (dynamic maintenance amount, due day, etc.)
exports.updateSocietySettings = async (req, res) => {
  try {
    if (!req.society_id) {
      return res.status(400).json({ message: 'Society ID missing from context' });
    }
    const society = await Society.findByPk(req.society_id);
    if (!society) {
      return res.status(404).json({ message: 'Society not found' });
    }

    const {
      name,
      maintenance_amount,
      due_day,
      late_fine,
      upi_id,
      contact_email,
      contact_phone,
      address,
      pincode
    } = req.body;

    await society.update({
      ...(name && { name }),
      ...(maintenance_amount !== undefined && { maintenance_amount: parseFloat(maintenance_amount) }),
      ...(due_day !== undefined && { due_day: parseInt(due_day) }),
      ...(late_fine !== undefined && { late_fine: parseFloat(late_fine) }),
      ...(upi_id !== undefined && { upi_id }),
      ...(contact_email !== undefined && { contact_email }),
      ...(contact_phone !== undefined && { contact_phone }),
      ...(address !== undefined && { address }),
      ...(pincode !== undefined && { pincode }),
    });

    res.json({
      message: 'Society settings updated successfully',
      society
    });
  } catch (err) {
    res.status(400).json({ message: 'Error updating society settings', error: err.message });
  }
};

