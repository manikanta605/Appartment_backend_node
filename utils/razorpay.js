const Razorpay = require('razorpay');
const crypto = require('crypto');

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret_key',
});

exports.createOrder = async (amount, currency = 'INR', receipt = 'receipt_order_74394') => {
  const options = {
    amount: amount * 100, // Amount in paisa
    currency: currency,
    receipt: receipt,
  };
  return await instance.orders.create(options);
};

exports.verifySignature = (order_id, payment_id, signature) => {
  const secret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret_key';
  const generated_signature = crypto
    .createHmac('sha256', secret)

    .update(order_id + '|' + payment_id)
    .digest('hex');
  return generated_signature === signature;


};
