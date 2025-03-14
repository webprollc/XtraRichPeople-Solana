/**
 * XtraRichPeople (XRP) Token - Create Token Script for Solana
 * 
 * This script demonstrates how to create the XRP token on the Solana blockchain.
 * NOTE: This is a demonstration script. In production, you would need to:
 * 1. Securely manage your private keys
 * 2. Add proper error handling
 * 3. Implement user feedback
 */

const { 
  Connection, 
  Keypair, 
  PublicKey, 
  clusterApiUrl, 
  LAMPORTS_PER_SOL 
} = require('@solana/web3.js');
const { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo 
} = require('@solana/spl-token');
const fs = require('fs');

async function createToken() {
  // Connection to Solana network
  const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
  
  console.log('Creating XRP token on Solana mainnet...');
  
  try {
    // Load keypair from file
    // NEVER hardcode keypairs or private keys in production code
    // This is just for demonstration purposes
    console.log('Loading wallet keypair...');
    const walletKeypairData = JSON.parse(fs.readFileSync('./keypair.json', 'utf8'));
    const walletKeypair = Keypair.fromSecretKey(new Uint8Array(walletKeypairData));
    
    // Token parameters
    const decimals = 9;
    const totalSupply = 10_000_000_000 * (10 ** decimals);
    
    console.log('Creating token mint...');
    // Create new token mint
    const tokenMint = await createMint(
      connection,
      walletKeypair,
      walletKeypair.publicKey,
      walletKeypair.publicKey,
      decimals
    );
    
    console.log(`Token mint created: ${tokenMint.toBase58()}`);
    
    // Create associated token account for the owner
    console.log('Creating token account...');
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      walletKeypair,
      tokenMint,
      walletKeypair.publicKey
    );
    
    console.log(`Token account created: ${tokenAccount.address.toBase58()}`);
    
    // Mint the total supply to the owner's token account
    console.log(`Minting ${totalSupply / (10 ** decimals)} tokens...`);
    await mintTo(
      connection,
      walletKeypair,
      tokenMint,
      tokenAccount.address,
      walletKeypair,
      totalSupply
    );
    
    console.log('Token minting completed successfully!');
    
    // Save token info to file
    const tokenInfo = {
      tokenMint: tokenMint.toBase58(),
      tokenAccount: tokenAccount.address.toBase58(),
      owner: walletKeypair.publicKey.toBase58(),
      decimals: decimals,
      totalSupply: totalSupply / (10 ** decimals)
    };
    
    fs.writeFileSync('./token-info.json', JSON.stringify(tokenInfo, null, 2));
    console.log('Token information saved to token-info.json');
    
    return tokenInfo;
    
  } catch (error) {
    console.error('Error creating token:', error);
  }
}

// Uncomment to run the function
// createToken();

module.exports = { createToken };
