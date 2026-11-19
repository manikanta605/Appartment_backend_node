const { Payment, EventMember, Society, Member } = require('../models');
const { Op } = require('sequelize');
const { generateMonthlyDues } = require('../utils/duesEngine');
const rzp = require('../utils/razorpay');

// Get all payments (scoped to society & role)
exports.getAllPayments = async (req, res) => {
  try {
    let where = {};
    if (req.society_id) {
      where.society_id = req.society_id;
    }
    if (req.user.role === 'member') {
      where.flat_no = req.user.flat_no;
    }

    const payments = await Payment.findAll({
      where,
      order: [['id', 'DESC']]
    });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Admin manually triggers dues generation for their society
exports.triggerDues = async (req, res) => {
  try {
    const { targetMonth, targetYear, targetPeriod } = req.body;
    const societyId = req.society_id;

    if (!societyId) {
      return res.status(400).json({ message: 'Society ID missing from context' });
    }

    const summary = await generateMonthlyDues({
      societyId,
      targetMonth: targetMonth !== undefined ? parseInt(targetMonth) : null,
      targetYear: targetYear ? parseInt(targetYear) : null,
      targetPeriod
    });

    res.json({
      message: `Successfully generated ${summary.totalRecordsCreated} records for period ${summary.period}`,
      summary
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate monthly dues', error: err.message });
  }
};

// Record a Payment
exports.createPayment = async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      society_id: req.society_id
    };

    let payment;

    if (paymentData.status === 'Paid') {
      // Find any existing pending bill for this flat in this society
      const existingPending = await Payment.findOne({
        where: {
          society_id: req.society_id,
          flat_no: paymentData.flat_no,
          status: { [Op.in]: ['Pending', 'Overdue'] }
        },
        order: [['id', 'ASC']]
      });

      if (existingPending) {
        const paidAmt = Number(paymentData.amount);
        const dueAmt = Number(existingPending.total_due || existingPending.amount);

        if (paidAmt < dueAmt) {
          // Partial payment
          await existingPending.update({
            paid_amount: Number(existingPending.paid_amount || 0) + paidAmt,
            status: 'Partial',
            mode: paymentData.mode || 'UPI',
            date: paymentData.date || new Date(),
            transaction_id: paymentData.transaction_id || existingPending.transaction_id
          });
          payment = existingPending;
        } else {
          // Full payment
          payment = await existingPending.update({
            status: 'Paid',
            mode: paymentData.mode || 'UPI',
            paid_amount: paidAmt,
            date: paymentData.date || new Date(),
            transaction_id: paymentData.transaction_id || null,
            eventId: paymentData.eventId || existingPending.eventId
          });
        }
      } else {
        payment = await Payment.create({
          ...paymentData,
          paid_amount: Number(paymentData.amount),
          total_due: Number(paymentData.amount)
        });
      }
    } else {
      payment = await Payment.create({
        ...paymentData,
        total_due: Number(paymentData.amount) + Number(paymentData.previous_due || 0)
      });
    }

    // Sync with EventMember if eventId is linked
    if (payment.eventId && payment.status === 'Paid') {
      await EventMember.update(
        { status: 'Paid', paid_amount: payment.amount },
        { where: { eventId: payment.eventId, flat_no: payment.flat_no } }
      );
    }

    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ message: 'Error creating payment', error: err.message });
  }
};

// Update an existing payment
exports.updatePayment = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.society_id) where.society_id = req.society_id;

    const payment = await Payment.findOne({ where });
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    const updateData = { ...req.body };
    if (updateData.status === 'Paid' && !updateData.paid_amount) {
      updateData.paid_amount = payment.total_due || payment.amount;
      updateData.date = updateData.date || new Date();
    }

    await payment.update(updateData);
    res.json(payment);
  } catch (err) {
    res.status(400).json({ message: 'Error updating payment', error: err.message });
  }
};

// Delete payment
exports.deletePayment = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.society_id) where.society_id = req.society_id;

    const payment = await Payment.findOne({ where });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    await payment.destroy();
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Razorpay Order Creation
exports.createOrder = async (req, res) => {
  try {
    const { amount, receipt } = req.body;
    if (!amount) return res.status(400).json({ message: 'Amount is required' });

    const order = await rzp.createOrder(amount, 'INR', receipt || `rcpt_${Date.now()}`);
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error creating Razorpay order', error: err.message });
  }
};

// Razorpay Verification & Settlement
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_details } = req.body;

    const isValid = rzp.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) return res.status(400).json({ message: 'Invalid payment signature' });

    const flat_no = payment_details?.flat_no || req.user.flat_no;
    const paidAmt = Number(payment_details?.amount);

    let payment;
    const existingPending = await Payment.findOne({
      where: {
        society_id: req.society_id,
        flat_no: flat_no,
        status: { [Op.in]: ['Pending', 'Overdue'] }
      },
      order: [['id', 'ASC']]
    });

    if (existingPending) {
      payment = await existingPending.update({
        status: 'Paid',
        mode: 'Razorpay',
        date: new Date(),
        transaction_id: razorpay_payment_id,
        paid_amount: paidAmt
      });
    } else {
      payment = await Payment.create({
        society_id: req.society_id,
        flat_no: flat_no,
        resident_name: payment_details?.resident_name || req.user.username,
        period: payment_details?.period || 'Online Payment',
        amount: paidAmt,
        total_due: paidAmt,
        paid_amount: paidAmt,
        status: 'Paid',
        mode: 'Razorpay',
        date: new Date(),
        transaction_id: razorpay_payment_id
      });
    }

    res.json({ message: 'Payment verified and recorded successfully', payment });
  } catch (err) {
    res.status(500).json({ message: 'Payment verification failed', error: err.message });
  }
};
