// The Grass Parable - Payment Integration
import paymentHandler from './payment.js';

/**
 * Initialize payment handler and add listeners to paywalls
 */
export function initializePayments() {
    // Initialize payment handler
    if (window.Stripe) {
        paymentHandler.init(window.stripePublishableKey || null);
    }
    
    // Set up payment handlers for all paywalls
    const paywallTiers = [2, 5, 10, 1000];
    
    paywallTiers.forEach(tier => {
        const paywall = document.querySelector(`.paywall-${tier}`);
        if (paywall) {
            const payButton = paywall.querySelector('.paywall-pay-button');
            if (payButton) {
                // Replace existing event listener
                const newPayButton = payButton.cloneNode(true);
                payButton.parentNode.replaceChild(newPayButton, payButton);
                
                // Add our payment handler
                newPayButton.addEventListener('click', () => {
                    let userName = '';
                    if (tier === 1000) {
                        const nameInput = paywall.querySelector('.name-input');
                        if (nameInput) {
                            userName = nameInput.value.trim();
                        }
                    }
                    processPayment(tier, userName);
                });
            }
        }
    });
}

/**
 * Process a payment for a specific tier
 * @param {number} tier - Payment tier
 * @param {string} userName - User name for $1000 tier
 */
export function processPayment(tier, userName = '') {
    // Show loading indicator
    const paywall = document.querySelector(`.paywall-${tier}`);
    if (paywall) {
        const payButton = paywall.querySelector('.paywall-pay-button');
        if (payButton) {
            payButton.textContent = 'Processing...';
            payButton.disabled = true;
        }
    }
    
    // Process payment
    paymentHandler.handlePayment(tier, userName)
        .then(result => {
            if (result.success) {
                // Hide the paywall UI
                hidePaywall();
                
                // Call the original makePayment function in the Grass Parable game
                if (window.grassParable) {
                    // The original game logic for successful payment
                    const originalMakePayment = window.grassParable.makePayment;
                    if (typeof originalMakePayment === 'function') {
                        originalMakePayment(tier, result.userName);
                    }
                }
            } else if (result.cancelled) {
                // Payment was cancelled by user
                if (window.grassParable) {
                    // The original game logic for cancelled payment
                    const originalCancelPayment = window.grassParable.cancelPayment;
                    if (typeof originalCancelPayment === 'function') {
                        originalCancelPayment(tier);
                    }
                }
            } else {
                // Payment failed for some other reason
                alert(`Payment failed: ${result.message}`);
                
                // Reset button
                const payButton = paywall?.querySelector('.paywall-pay-button');
                if (payButton) {
                    payButton.textContent = `Pay $${tier}`;
                    payButton.disabled = false;
                }
            }
        })
        .catch(error => {
            console.error('Payment error:', error);
            alert('An error occurred while processing your payment.');
            
            // Reset button
            const payButton = paywall?.querySelector('.paywall-pay-button');
            if (payButton) {
                payButton.textContent = `Pay $${tier}`;
                payButton.disabled = false;
            }
        });
}

/**
 * Hide all paywalls and reset buttons
 */
export function hidePaywall() {
    const paywalls = document.querySelectorAll('.paywall');
    paywalls.forEach(paywall => {
        paywall.classList.remove('active');
        
        // Reset buttons
        const payButton = paywall.querySelector('.paywall-pay-button');
        if (payButton) {
            const tier = payButton.getAttribute('data-tier');
            payButton.textContent = `Pay $${tier}`;
            payButton.disabled = false;
        }
    });
    
    // Notify the main app
    window.dispatchEvent(new CustomEvent('hidePaywall'));
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializePayments); 