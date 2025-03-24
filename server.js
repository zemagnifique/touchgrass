// server.js - The Grass Parable Server
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_key_here');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static('dist')); // Serve built app
app.use(express.json());

// Sky names storage
const SKY_NAMES_FILE = path.join(__dirname, 'sky-names.json');

// Initialize sky names file if it doesn't exist
if (!fs.existsSync(SKY_NAMES_FILE)) {
  fs.writeFileSync(SKY_NAMES_FILE, JSON.stringify({ names: [] }));
}

// Read sky names
function getSkyNames() {
  try {
    const data = fs.readFileSync(SKY_NAMES_FILE, 'utf8');
    return JSON.parse(data).names || [];
  } catch (error) {
    console.error('Error reading sky names:', error);
    return [];
  }
}

// Save sky name
function saveSkyName(name) {
  try {
    const skyNames = getSkyNames();
    if (!skyNames.includes(name)) {
      skyNames.push(name);
      fs.writeFileSync(SKY_NAMES_FILE, JSON.stringify({ names: skyNames }));
    }
    return true;
  } catch (error) {
    console.error('Error saving sky name:', error);
    return false;
  }
}

// API Endpoints
app.get('/api/sky-names', (req, res) => {
  const names = getSkyNames();
  res.json({ names });
});

// Create a Stripe payment intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, userName } = req.body;
    
    // Validate amount (must be one of our predefined tiers)
    const validAmounts = [2, 5, 10, 1000];
    if (!validAmounts.includes(amount)) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        userName: userName || '',
        gamePayment: 'true',
        tier: amount.toString()
      }
    });
    
    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Payment successful webhook
app.post('/api/payment-success', (req, res) => {
  try {
    const { userName, tier } = req.body;
    
    // Save sky name for $1000 payments
    if (tier === 1000 && userName) {
      saveSkyName(userName);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error processing payment success:', error);
    res.status(500).json({ error: 'Failed to process payment success' });
  }
});

// Serve the main app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`The Grass Parable server running on port ${port}`);
}); 