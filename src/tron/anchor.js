// anchor.js - Anchor data to Tron
import TronWeb from 'tronweb';
import { TRON_CONFIG, PROTOCOL_ID } from './config.js';

async function anchorToTron(data, chainName, privateKeyHex, customNodes = null) {
  const config = TRON_CONFIG[chainName];
  
  if (!config) {
    throw new Error(`Chain ${chainName} not supported`);
  }
  
  // 1. Canonicalize JSON
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  
  // 2. Add protocol identifier
  const fullData = PROTOCOL_ID + canonical;
  const dataBuffer = Buffer.from(fullData, 'utf8');
  
  // 3. Check size limits
  const dataSize = dataBuffer.length;
  console.log(`Data size: ${dataSize} bytes (${PROTOCOL_ID.length} protocol ID + ${canonical.length} data)`);
  
  if (dataSize > config.maxDataSize) {
    throw new Error(
      `Data too large for Tron. Max: ${config.maxDataSize} bytes, Got: ${dataSize} bytes.`
    );
  }
  
  // 4. Setup TronWeb
  const nodes = customNodes || {
    fullNode: config.fullNode,
    solidityNode: config.solidityNode,
    eventServer: config.eventServer
  };
  
  const tronWeb = new TronWeb(
    nodes.fullNode,
    nodes.solidityNode,
    nodes.eventServer,
    privateKeyHex
  );
  
  console.log(`Connected to ${config.name}`);
  
  const address = tronWeb.address.fromPrivateKey(privateKeyHex);
  console.log(`Using address: ${address}`);
  
  try {
    // 5. Check balance
    const balance = await tronWeb.trx.getBalance(address);
    console.log(`Balance: ${tronWeb.fromSun(balance)} TRX`);
    
    if (balance === 0) {
      throw new Error('Insufficient balance. Fund this address first.');
    }
    
    // 6. Convert data to hex
    const dataHex = dataBuffer.toString('hex');
    
    // 7. Create transaction with data
    // Send 0 TRX to self with data in the 'data' field
    const transaction = await tronWeb.transactionBuilder.sendTrx(
      address,
      0, // 0 TRX
      address,
      { data: dataHex }
    );
    
    // 8. Sign transaction
    const signedTx = await tronWeb.trx.sign(transaction);
    
    // 9. Broadcast transaction
    console.log('\nBroadcasting transaction...');
    const result = await tronWeb.trx.sendRawTransaction(signedTx);
    
    if (!result.result) {
      throw new Error(`Transaction failed: ${result.code || 'Unknown error'}`);
    }
    
    const txid = result.txid || result.transaction.txID;
    console.log('✓ Transaction broadcast');
    console.log(`Transaction ID: ${txid}`);
    
    // 10. Wait for confirmation (optional but recommended)
    console.log('Waiting for confirmation...');
    await waitForConfirmation(tronWeb, txid);
    console.log('✓ Transaction confirmed');
    
    // 11. Return proof
    return {
      proof: {
        protocol: 'LARP',
        version: '1',
        chain: chainName,
        txid: txid,
        timestamp: new Date().toISOString(),
        explorer: config.explorer + txid
      }
    };
    
  } catch (error) {
    throw new Error(`Failed to anchor: ${error.message}`);
  }
}

// Helper: Wait for transaction confirmation
async function waitForConfirmation(tronWeb, txid, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const tx = await tronWeb.trx.getTransaction(txid);
      if (tx && tx.ret && tx.ret[0].contractRet === 'SUCCESS') {
        return true;
      }
    } catch (e) {
      // Transaction not found yet
    }
    
    // Wait 1 second before next attempt
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Transaction confirmation timeout');
}

export { anchorToTron };
