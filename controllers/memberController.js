const { Member, User } = require('../models');

exports.getAllMembers = async (req, res) => {
  try {
    const where = req.society_id ? { society_id: req.society_id } : {};
    const members = await Member.findAll({ where, order: [['id', 'ASC']] });
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMemberById = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.society_id) where.society_id = req.society_id;
    const member = await Member.findOne({ where });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createMember = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      society_id: req.society_id
    };

    const member = await Member.create(payload);

    // Auto-create User account for the member if phone is provided
    if (member.phone) {
      const existingUser = await User.findOne({ where: { username: member.phone } });
      if (!existingUser) {
        await User.create({
          society_id: req.society_id,
          username: member.phone,
          password: member.flat_no.replace('-', '').toLowerCase() + '123',
          name: member.name,
          phone: member.phone,
          email: member.email,
          role: 'member',
          flat_no: member.flat_no
        });
      }
    }

    res.status(201).json(member);
  } catch (err) {
    res.status(400).json({ message: 'Error creating member', error: err.message });
  }
};

exports.updateMember = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.society_id) where.society_id = req.society_id;
    const member = await Member.findOne({ where });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    await member.update(req.body);
    res.json(member);
  } catch (err) {
    res.status(400).json({ message: 'Error updating member', error: err.message });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.society_id) where.society_id = req.society_id;
    const member = await Member.findOne({ where });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    await member.destroy();
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
