const { Expense } = require('../models');

exports.getAllExpenses = async (req, res) => {
  try {
    const where = req.society_id ? { society_id: req.society_id } : {};
    const expenses = await Expense.findAll({ where, order: [['date', 'DESC'], ['id', 'DESC']] });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const payment_mode = req.body.payment_mode || req.body.mode || 'UPI';
    const paid_to = req.body.paid_to || req.body.vendor || req.body.recipient || 'Vendor';
    const expense = await Expense.create({
      ...req.body,
      payment_mode,
      paid_to,
      society_id: req.society_id
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ message: 'Error creating expense', error: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.society_id) where.society_id = req.society_id;
    const expense = await Expense.findOne({ where });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    await expense.update(req.body);
    res.json(expense);
  } catch (err) {
    res.status(400).json({ message: 'Error updating expense', error: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.society_id) where.society_id = req.society_id;
    const expense = await Expense.findOne({ where });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    await expense.destroy();
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
