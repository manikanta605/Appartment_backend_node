const { Society, User, Member, Payment, Expense, sequelize } = require('../models');
const { Op } = require('sequelize');

// List all societies with high-level statistics
exports.getAllSocieties = async (req, res) => {
  try {
    const societies = await Society.findAll({
      order: [['id', 'ASC']]
    });

    const results = [];
    for (const soc of societies) {
      const totalMembers = await Member.count({ where: { society_id: soc.id } });
      const totalCollected = await Payment.sum('paid_amount', {
        where: { society_id: soc.id, status: 'Paid' }
      }) || await Payment.sum('amount', {
        where: { society_id: soc.id, status: 'Paid' }
      }) || 0;

      const pendingAmount = await Payment.sum('total_due', {
        where: { society_id: soc.id, status: 'Pending' }
      }) || await Payment.sum('amount', {
        where: { society_id: soc.id, status: 'Pending' }
      }) || 0;

      results.push({
        ...soc.toJSON(),
        stats: {
          totalMembers,
          totalCollected: Number(totalCollected),
          pendingAmount: Number(pendingAmount)
        }
      });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch societies', error: err.message });
  }
};

// Create a new Society and its Society Admin account
exports.createSociety = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      name,
      code,
      address,
      city,
      state,
      pincode,
      maintenance_amount,
      due_day,
      late_fine,
      plan,
      adminUsername,
      adminPassword,
      adminEmail,
      adminPhone
    } = req.body;

    if (!name || !code) {
      await t.rollback();
      return res.status(400).json({ message: 'Society name and code are required' });
    }

    const cleanCode = code.toUpperCase().trim();
    const existingSoc = await Society.findOne({ where: { code: cleanCode }, transaction: t });
    if (existingSoc) {
      await t.rollback();
      return res.status(400).json({ message: `Society with code ${cleanCode} already exists` });
    }

    // 1. Create Society
    const society = await Society.create({
      name,
      code: cleanCode,
      address: address || '',
      city: city || 'Hyderabad',
      state: state || 'Telangana',
      pincode: pincode || '',
      maintenance_amount: maintenance_amount ? parseFloat(maintenance_amount) : 2500.00,
      due_day: due_day ? parseInt(due_day) : 10,
      late_fine: late_fine ? parseFloat(late_fine) : 100.00,
      plan: plan || 'Standard',
      status: 'Active'
    }, { transaction: t });

    // 2. Create Society Admin User
    const adminUser = adminUsername ? adminUsername.toLowerCase().trim() : `admin_${cleanCode.toLowerCase()}`;
    const password = adminPassword || `${cleanCode.toLowerCase()}123`;

    const user = await User.create({
      society_id: society.id,
      username: adminUser,
      password: password,
      name: `${name} Administrator`,
      email: adminEmail || `${adminUser}@society.local`,
      phone: adminPhone || '',
      role: 'admin',
      flat_no: null,
      status: 'Active'
    }, { transaction: t });

    await t.commit();

    res.status(201).json({
      message: 'Society and Administrator account created successfully',
      society,
      admin: {
        username: user.username,
        initialPassword: password,
        role: user.role
      }
    });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Error creating society', error: err.message });
  }
};

// Update Society settings (maintenance amount, code, plan, status)
exports.updateSociety = async (req, res) => {
  try {
    const { id } = req.params;
    const society = await Society.findByPk(id);
    if (!society) return res.status(404).json({ message: 'Society not found' });

    await society.update(req.body);
    res.json({ message: 'Society updated successfully', society });
  } catch (err) {
    res.status(400).json({ message: 'Error updating society', error: err.message });
  }
};

// Platform-wide Super Admin stats
exports.getPlatformStats = async (req, res) => {
  try {
    const totalSocieties = await Society.count();
    const activeSocieties = await Society.count({ where: { status: 'Active' } });
    const totalFlats = await Member.count();
    const totalUsers = await User.count();
    const totalCollected = await Payment.sum('amount', { where: { status: 'Paid' } }) || 0;
    const totalExpenses = await Expense.sum('amount') || 0;

    res.json({
      totalSocieties,
      activeSocieties,
      totalFlats,
      totalUsers,
      totalCollected: Number(totalCollected),
      totalExpenses: Number(totalExpenses),
      platformSurplus: Number(totalCollected) - Number(totalExpenses)
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch platform metrics', error: err.message });
  }
};

