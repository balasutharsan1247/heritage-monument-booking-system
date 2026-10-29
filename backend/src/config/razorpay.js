const Razorpay = require('razorpay');

const keyId = process.env.RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

const isPlaceholderKey = !keyId || keyId.includes('placeholder') || !keySecret || keySecret.includes('placeholder');

let razorpayInstance = null;

if (!isPlaceholderKey) {
  try {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  } catch (err) {
    console.warn('Failed to initialize Razorpay SDK client:', err.message);
  }
}

module.exports = {
  razorpay: razorpayInstance,
  keyId,
  keySecret,
  isPlaceholderKey,
};
