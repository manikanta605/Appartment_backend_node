const { Op } = require('sequelize');
const { Amenity, Booking, Member } = require('../models');

// --- AMENITIES ---

exports.getAllAmenities = async (req, res) => {
  try {
    const where = req.society_id ? { society_id: req.society_id } : {};
    const amenities = await Amenity.findAll({ where });
    res.json(amenities);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createAmenity = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    const amenity = await Amenity.create({
      ...req.body,
      society_id: req.society_id
    });
    res.status(201).json(amenity);
  } catch (err) {
    res.status(400).json({ message: 'Error creating amenity', error: err.message });
  }
};

exports.updateAmenity = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    const where = { id: req.params.id };
    if (req.society_id) where.society_id = req.society_id;

    const amenity = await Amenity.findOne({ where });
    if (!amenity) return res.status(404).json({ message: 'Amenity not found' });
    await amenity.update(req.body);
    res.json(amenity);
  } catch (err) {
    res.status(400).json({ message: 'Error updating amenity', error: err.message });
  }
};

exports.deleteAmenity = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    const where = { id: req.params.id };
    if (req.society_id) where.society_id = req.society_id;

    const amenity = await Amenity.findOne({ where });
    if (!amenity) return res.status(404).json({ message: 'Amenity not found' });
    await amenity.destroy();
    res.json({ message: 'Amenity deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// --- BOOKINGS ---

exports.getAllBookings = async (req, res) => {
  try {
    let where = req.society_id ? { society_id: req.society_id } : {};
    if (req.user.role === 'member') {
      where.flat_no = req.user.flat_no;
    }

    const bookings = await Booking.findAll({
      where,
      include: [
        { model: Amenity, attributes: ['name', 'fee'] }
      ],
      order: [['booking_date', 'DESC'], ['start_time', 'ASC']]
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const amenityId = req.body.amenityId || req.body.amenity_id;
    const { booking_date, start_time, end_time, slot } = req.body;
    const flat_no = req.user.role === 'member' ? req.user.flat_no : req.body.flat_no;

    const amenity = await Amenity.findByPk(amenityId);
    if (!amenity) return res.status(404).json({ message: 'Amenity not found' });

    const booking = await Booking.create({
      society_id: req.society_id,
      amenityId,
      flat_no,
      booking_date,
      start_time: start_time || null,
      end_time: end_time || null,
      slot: slot || null,
      fee: amenity.fee,
      status: 'Pending'
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ message: 'Error creating booking', error: err.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.society_id) where.society_id = req.society_id;

    const booking = await Booking.findOne({ where });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = req.body.status;
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: 'Error updating booking status', error: err.message });
  }
};
