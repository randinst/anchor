// verify.js - Verify XRP proofs
import { Client } from 'xrpl';
import { XRP_CONFIG, PROTOCOL_ID } from './config.js';

async function verifyXRPProof(proof, customRpc = null) {
  const { chain, txid } = proof;
  
  if (!chain || !txid) {
    return { valid: false, reason: 'Missing chain or txid in proof' };
  }
  
  const config = XRP_CONFIG[chain];
  if (!config) {
    return { valid: false, reason: `Chain ${chain} not supported` };
  }
  
  // Connect to XRP network
  const rpcUrl = customRpc || config.rpcUrl;
  const client = new Client(rpcUrl);
  
  try {
    await client.connect();
    
    // Fetch transaction
    const response = await client.request({
      command: 'tx',
      transaction: txid
    });
    
    await client.disconnect();
    
    const tx = response.result;
    
    // Check if transaction was successful
    if (tx.meta.TransactionResult !== 'tesSUCCESS') {
      return { valid: false, reason: 'Transaction failed on ledger' };
    }
    
    // Extract memo data
    if (!tx.Memos || tx.Memos.length === 0) {
      return { valid: false, reason: 'No memo data found in transaction' };
    }
    
    const memo = tx.Memos[0].Memo;
    const memoDataHex = memo.MemoData;
    
    if (!memoDataHex) {
      return { valid: false, reason: 'Memo data is empty' };
    }
    
    // Decode memo data
    const dataBuffer = Buffer.from(memoDataHex, 'hex');
    const fullData = dataBuffer.toString('utf8');
    
    // Check protocol identifier
    if (!fullData.startsWith(PROTOCOL_ID)) {
      return { valid: false, reason: 'Not a LARP transaction (missing protocol identifier)' };
    }
    
    // Extract and parse JSON
    const jsonString = fullData.slice(PROTOCOL_ID.length);
    
    try {
      const data = JSON.parse(jsonString);
      return {
        valid: true,
        data: data,
        txid: txid,
        ledger: tx.ledger_index,
        protocol: 'LARP v1',
        explorer: config.explorer + txid
      };
    } catch (e) {
      return { valid: false, reason: 'Data is not valid JSON' };
    }
    
  } catch (error) {
    await client.disconnect().catch(() => {});
    return { valid: false, reason: error.message };
  }
}

export { verifyXRPProof };
