// The Grass Parable - Payment Handler
class PaymentHandler {
  constructor() {
    this.stripe = window.Stripe ? window.Stripe('pk_test_your_stripe_key_here') : null; // Replace with your publishable key
    this.isTestMode = true; // Set to false in production
  }

  /**
   * Initialize the payment handler with the actual publishable key
   * @param {string} publishableKey - Stripe publishable key
   */
  init(publishableKey) {
    if (publishableKey && window.Stripe) {
      this.stripe = window.Stripe(publishableKey);
    }
  }

  /**
   * Handle payment for a specific tier
   * @param {number} tier - Payment tier (2, 5, 10, 1000)
   * @param {string} userName - User name for $1000 tier
   * @returns {Promise<Object>} - Payment result
   */
  async handlePayment(tier, userName = '') {
    // In test mode, just simulate a successful payment
    if (this.isTestMode) {
      return this.simulatePayment(tier, userName);
    }

    try {
      if (!this.stripe) {
        throw new Error('Stripe not initialized');
      }

      // Create payment intent on the server
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: tier,
          userName: userName
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Show the payment form
      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.createCardElement(),
          billing_details: {
            name: userName || 'Anonymous Grass Toucher',
          },
        },
        receipt_email: '', // Optional: could add email collection
      });

      if (result.error) {
        // Payment failed
        return {
          success: false,
          message: result.error.message,
          cancelled: result.error.type === 'card_error'
        };
      } else if (result.paymentIntent.status === 'succeeded') {
        // Payment succeeded
        await this.notifyPaymentSuccess(tier, userName);
        return {
          success: true,
          message: 'Payment successful!',
          userName: userName
        };
      }
    } catch (error) {
      console.error('Payment error:', error);
      return {
        success: false,
        message: error.message || 'Payment failed',
        cancelled: false
      };
    }
  }

  /**
   * Simulate a payment (for testing)
   * @param {number} tier - Payment tier
   * @param {string} userName - User name
   * @returns {Promise<Object>} - Simulated payment result
   */
  simulatePayment(tier, userName) {
    return new Promise((resolve) => {
      // Simulate payment processing time
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Payment successful (simulated)!',
          userName: userName
        });
      }, 1000);
    });
  }

  /**
   * Create a card element for the payment form
   * @returns {Object} - Stripe card element
   */
  createCardElement() {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }
    
    const elements = this.stripe.elements();
    const card = elements.create('card');
    
    // In a real implementation, this would mount the card to a DOM element
    // card.mount('#card-element');
    
    return card;
  }

  /**
   * Notify the server about a successful payment
   * @param {number} tier - Payment tier
   * @param {string} userName - User name
   */
  async notifyPaymentSuccess(tier, userName) {
    if (this.isTestMode) return; // Skip in test mode
    
    try {
      await fetch('/api/payment-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: tier,
          userName: userName
        }),
      });
    } catch (error) {
      console.error('Failed to notify payment success:', error);
    }
  }
}

// Export payment handler instance
const paymentHandler = new PaymentHandler();
export default paymentHandler; 