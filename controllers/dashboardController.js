const { Payment, Expense, Member, Society } = require('../models');
const { Op } = require('sequelize');

exports.getStats = async (req, res) => {
  try {
    const societyId = req.society_id;
    const socFilter = societyId ? { society_id: societyId } : {};

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Total collected
    const totalCollected = await Payment.sum('paid_amount', {
      where: {
        ...socFilter,
        status: 'Paid'
      }
    }) || await Payment.sum('amount', {
      where: {
        ...socFilter,
        status: 'Paid'
      }
    }) || 0;

    // Total expenses
    const totalExpenses = await Expense.sum('amount', {
      where: socFilter
    }) || 0;

    // Pending amount
    const pendingAmount = await Payment.sum('total_due', {
      where: {
        ...socFilter,
        status: { [Op.in]: ['Pending', 'Overdue', 'Partial'] }
      }
    }) || await Payment.sum('amount', {
      where: {
        ...socFilter,
        status: { [Op.in]: ['Pending', 'Overdue', 'Partial'] }
      }
    }) || 0;

    const expected = Number(totalCollected) + Number(pendingAmount);
    const netBalance = Number(totalCollected) - Number(totalExpenses);

    // Society details
    let society = null;
    if (societyId) {
      society = await Society.findByPk(societyId, {
        attributes: ['id', 'name', 'code', 'maintenance_amount', 'due_day', 'late_fine', 'logo_url']
      });
    }

    res.json({
      totalCollected: Number(totalCollected),
      totalExpenses: Number(totalExpenses),
      pendingAmount: Number(pendingAmount),
      netBalance,
      collectionRate: expected > 0 ? Math.round((Number(totalCollected) / expected) * 100) : 0,
      society: society ? society.toJSON() : null
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
