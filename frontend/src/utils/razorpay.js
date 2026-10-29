/**
 * Razorpay Payment Helper Utility
 * Supports both Official Razorpay Checkout Modal and Local Sandbox Mock Simulator.
 */

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Open Razorpay Checkout or Sandbox Simulator
 * @param {Object} options
 * @param {Object} options.order - Order object from backend
 * @param {string} options.keyId - Razorpay Key ID
 * @param {boolean} options.isMock - Whether in mock sandbox mode
 * @param {string} options.name - App or Monument name
 * @param {string} options.description - Booking summary
 * @param {Object} options.prefill - { name, email, contact }
 * @param {Function} options.onSuccess - Callback with { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * @param {Function} options.onFailure - Callback with error message
 */
export const openRazorpayPayment = async ({
  order,
  keyId,
  isMock = false,
  name = 'Heritage Monument Booking',
  description = 'Monument Entry Pass Payment',
  prefill = {},
  onSuccess,
  onFailure,
}) => {
  // If running in local sandbox mock mode (placeholder keys)
  if (isMock || order?.id?.startsWith('order_mock_')) {
    // Show a user-friendly mock simulator prompt
    const confirmPayment = window.confirm(
      `[DEV SANDBOX TEST MODE]\n\n` +
      `Simulate payment of ₹${((order.amount || 0) / 100).toLocaleString()} for ${description}?\n\n` +
      `Click "OK" to simulate SUCCESSFUL payment.\n` +
      `Click "Cancel" to simulate CANCELLED/DECLINED payment.\n\n` +
      `(Note: Add your real 'rzp_test_...' keys to backend/.env to open the real Razorpay popup!)`
    );

    if (confirmPayment) {
      const mockPaymentId = `pay_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const mockSignature = `sig_mock_${Date.now()}`;
      onSuccess({
        razorpay_order_id: order.id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
      });
    } else {
      onFailure?.('Payment cancelled in Test Mode.');
    }
    return;
  }

  // Load official Razorpay Checkout SDK
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !window.Razorpay) {
    onFailure?.('Failed to load Razorpay payment gateway SDK. Please check your internet connection.');
    return;
  }

  const razorpayOptions = {
    key: keyId,
    amount: order.amount,
    currency: order.currency || 'INR',
    name: name,
    description: description,
    order_id: order.id,
    prefill: {
      name: prefill.name || '',
      email: prefill.email || '',
      contact: prefill.phone || '',
    },
    theme: {
      color: '#881337', // Heritage maroon
    },
    modal: {
      ondismiss: () => {
        onFailure?.('Payment cancelled by user.');
      },
    },
    handler: (response) => {
      onSuccess({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });
    },
  };

  try {
    const rzp = new window.Razorpay(razorpayOptions);
    rzp.on('payment.failed', (response) => {
      onFailure?.(response.error?.description || 'Payment failed.');
    });
    rzp.open();
  } catch (err) {
    console.error('Error opening Razorpay modal:', err);
    onFailure?.(err.message || 'Error opening payment gateway modal.');
  }
};
