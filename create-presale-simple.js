/**
 * XtraRichPeople (XRP) Token - Create Presale Script for Solana (Simplified Version)
 * 
 * This script demonstrates how to set up a presale for the XRP token on Solana.
 * This is a simplified version that works with local data instead of making network calls.
 * 
 * NOTE: This is a demonstration script. In production, you would need to:
 * 1. Securely manage your private keys
 * 2. Add proper error handling
 * 3. Implement user feedback
 */

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// Load configuration
const loadConfig = () => {
  try {
    const configData = fs.readFileSync('./presale-info.json', 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error loading configuration:', error);
    return null;
  }
};

// Initialize presale data storage
const initializeDataStorage = () => {
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
  }
  
  if (!fs.existsSync('./data/registrations.json')) {
    fs.writeFileSync('./data/registrations.json', JSON.stringify([]));
  }
};

// Save registration
const saveRegistration = (registration) => {
  const registrations = JSON.parse(fs.readFileSync('./data/registrations.json', 'utf8'));
  registrations.push(registration);
  fs.writeFileSync('./data/registrations.json', JSON.stringify(registrations, null, 2));
};

// Get presale status
const getPresaleStatus = () => {
  const config = loadConfig();
  if (!config) return { success: false, error: 'Failed to load configuration' };
  
  const now = new Date();
  const startDate = new Date(config.startDate);
  const endDate = new Date(config.endDate);
  
  let status = 'upcoming';
  if (now >= startDate && now <= endDate) {
    status = 'active';
  } else if (now > endDate) {
    status = 'ended';
  }
  
  // Calculate total tokens sold
  const registrations = JSON.parse(fs.readFileSync('./data/registrations.json', 'utf8'));
  const totalSold = registrations.reduce((sum, reg) => sum + parseFloat(reg.tokenAmount), 0);
  const percentageSold = (totalSold / config.hardCap) * 100;
  
  return {
    success: true,
    status,
    totalSold,
    percentageSold,
    hardCap: config.hardCap,
    startDate: config.startDate,
    endDate: config.endDate
  };
};

// Start the presale server
const startPresaleServer = () => {
  const app = express();
  const port = process.env.PORT || 3000;
  
  // Middleware
  app.use(cors());
  app.use(bodyParser.json());
  app.use(express.static('public'));
  
  // Initialize data storage
  initializeDataStorage();
  
  // API endpoints
  
  // Get presale status
  app.get('/api/status', (req, res) => {
    const status = getPresaleStatus();
    res.json(status);
  });
  
  // Register for presale
  app.post('/api/register', (req, res) => {
    const config = loadConfig();
    if (!config) {
      return res.status(500).json({ success: false, error: 'Failed to load configuration' });
    }
    
    const { walletAddress, tokenAmount, usdcAmount } = req.body;
    
    // Validate inputs
    if (!walletAddress || !tokenAmount || !usdcAmount) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    // Check if presale is active
    const status = getPresaleStatus();
    if (status.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Presale is not active' });
    }
    
    // Validate token amount
    const tokenAmountNum = parseFloat(tokenAmount);
    if (tokenAmountNum < config.minPurchase || tokenAmountNum > config.maxPurchase) {
      return res.status(400).json({ 
        success: false, 
        error: `Token amount must be between ${config.minPurchase} and ${config.maxPurchase}` 
      });
    }
    
    // Check if wallet has already registered
    const registrations = JSON.parse(fs.readFileSync('./data/registrations.json', 'utf8'));
    const existingReg = registrations.find(reg => reg.walletAddress === walletAddress);
    if (existingReg) {
      return res.status(400).json({ success: false, error: 'Wallet already registered' });
    }
    
    // Create registration
    const registration = {
      id: Date.now().toString(),
      walletAddress,
      tokenAmount: tokenAmountNum,
      usdcAmount: parseFloat(usdcAmount),
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    // Save registration
    saveRegistration(registration);
    
    // Return success response
    res.json({
      success: true,
      registrationId: registration.id,
      presaleAddress: config.presaleAddress,
      message: `Please send ${usdcAmount} USDC to the presale address`
    });
  });
  
  // Start server
  app.listen(port, () => {
    console.log(`Presale server running on port ${port}`);
    console.log(`Presale status: ${getPresaleStatus().status}`);
  });
};

// Uncomment to run the server
// startPresaleServer();

module.exports = { startPresaleServer };
