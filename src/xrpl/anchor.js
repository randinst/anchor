// anchor.js - Anchor data to XRP Ledger
import { Client, Wallet } from 'xrpl';
import { XRP_CONFIG, PROTOCOL_ID } from './config.js';

async function anchorToXRP(data, chainName, secretKey, customRpc = null) {
  const config = XRP_CONFIG[chainName];
  
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
  
  if (dataSize > config.maxMemoSize) {
    throw new Error(
      `Data too large for XRP. Max: ${config.maxMemoSize} bytes, Got: ${dataSize} bytes.`
    );
  }
  
  // 4. Connect to XRP network
  const rpcUrl = customRpc || config.rpcUrl;
  const client = new Client(rpcUrl);
  await client.connect();
  
  console.log(`Connected to ${config.name}`);
  
  try {
    // 5. Setup wallet
    const wallet = Wallet.fromSecret(secretKey);
    console.log(`Using address: ${wallet.address}`);
    
    // 6. Convert data to hex for memo
    const memoData = dataBuffer.toString('hex').toUpperCase();
    
    // 7. Prepare payment transaction
    // Send 1 drop (0.000001 XRP) to self with data in memo
    const prepared = await client.autofill({
      TransactionType: 'Payment',
      Account: wallet.address,
      Destination: wallet.address,
      Amount: '1', // 1 drop
      Memos: [
        {
          Memo: {
            MemoData: memoData,
            MemoType: Buffer.from('PRP', 'utf8').toString('hex').toUpperCase(),
            MemoFormat: Buffer.from('json', 'utf8').toString('hex').toUpperCase()
          }
        }
      ]
    });
    
    // 8. Sign transaction
    const signed = wallet.sign(prepared);
    
    // 9. Submit to network
    console.log('\nSubmitting transaction...');
    const result = await client.submitAndWait(signed.tx_blob);
    
    await client.disconnect();
    
    if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
      throw new Error(`Transaction failed: ${result.result.meta.TransactionResult}`);
    }
    
    console.log('✓ Transaction confirmed');
    
    // 10. Return proof
    return {
      proof: {
        protocol: 'PRP',
        version: '1',
        chain: chainName,
        txid: signed.hash,
        ledger: result.result.ledger_index,
        timestamp: new Date().toISOString(),
        explorer: config.explorer + signed.hash
      }
    };
    
  } catch (error) {
    await client.disconnect();
    throw error;
  }
}

export { anchorToXRP };
