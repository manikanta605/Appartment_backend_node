const { Event, Payment, Expense, EventMember, Member } = require('../models');

exports.getAllEvents = async (req, res) => {
  try {
    const where = req.society_id ? { society_id: req.society_id } : {};
    const events = await Event.findAll({ where, order: [['date', 'DESC']] });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getEventStats = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.society_id) where.society_id = req.society_id;

    const event = await Event.findOne({ where });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const totalCollected = await Payment.sum('amount', {
      where: { eventId: event.id, status: 'Paid' }
    }) || 0;

    const totalExpenses = await Expense.sum('amount', {
      where: { eventId: event.id }
    }) || 0;

    res.json({
      event,
      totalCollected: Number(totalCollected),
      totalExpenses: Number(totalExpenses),
      balance: Number(totalCollected) - Number(totalExpenses)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      society_id: req.society_id
    });

    // Auto-populate active members of this society with 0 obligation
    const members = await Member.findAll({
      where: { society_id: req.society_id, status: 'Active' }
    });

    const registrations = members.map(m => ({
      society_id: req.society_id,
      eventId: event.id,
      flat_no: m.flat_no,
      required_amount: 0,
      paid_amount: 0,
      status: 'Unpaid'
    }));

    if (registrations.length > 0) {
      await EventMember.bulkCreate(registrations);
    }

    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: 'Error creating event', error: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.society_id) where.society_id = req.society_id;
    const event = await Event.findOne({ where });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    await event.update(req.body);
    res.json(event);
  } catch (err) {
    res.status(400).json({ message: 'Error updating event', error: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.society_id) where.society_id = req.society_id;
    const event = await Event.findOne({ where });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    await event.destroy();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getEventParticipants = async (req, res) => {
  try {
    const participants = await EventMember.findAll({
      where: {
        eventId: req.params.id,
        ...(req.society_id && { society_id: req.society_id })
      },
      order: [['flat_no', 'ASC']]
    });
    res.json(participants);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMyContribution = async (req, res) => {
  try {
    const registration = await EventMember.findOne({
      where: {
        eventId: req.params.id,
        flat_no: req.user.flat_no,
        ...(req.society_id && { society_id: req.society_id })
      }
    });
    res.json(registration || { required_amount: 0, paid_amount: 0, status: 'Unpaid' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateChandha = async (req, res) => {
  try {
    const { required_amount } = req.body;
    const registration = await EventMember.findOne({
      where: {
        eventId: req.params.id,
        flat_no: req.params.flat_no,
        ...(req.society_id && { society_id: req.society_id })
      }
    });

    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    await registration.update({ required_amount });
    res.json(registration);
  } catch (err) {
    res.status(400).json({ message: 'Error updating chandha', error: err.message });
  }
};

exports.bulkUpdateChandha = async (req, res) => {
  try {
    const { required_amount } = req.body;
    await EventMember.update(
      { required_amount },
      {
        where: {
          eventId: req.params.id,
          ...(req.society_id && { society_id: req.society_id })
        }
      }
    );
    res.json({ message: 'Chandha amounts updated for all participants' });
  } catch (err) {
    res.status(400).json({ message: 'Error bulk updating chandha', error: err.message });
  }
};
