// verify.js - Verify Solana proofs
import { Connection, PublicKey } from '@solana/web3.js';
import { SOLANA_CONFIG, PROTOCOL_ID } from './config.js';

async function verifySolanaProof(proof, customRpc = null) {
  const { chain, txid } = proof;
  
  if (!chain || !txid) {
    return { valid: false, reason: 'Missing chain or txid in proof' };
  }
  
  const config = SOLANA_CONFIG[chain];
  if (!config) {
    return { valid: false, reason: `Chain ${chain} not supported` };
  }
  
  // Connect to Solana
  const rpcUrl = customRpc || config.rpcUrl;
  const connection = new Connection(rpcUrl, 'confirmed');
  
  try {
    // Fetch transaction
    const tx = await connection.getTransaction(txid, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });
    
    if (!tx) {
      return { valid: false, reason: 'Transaction not found' };
    }
    
    // Check transaction succeeded
    if (tx.meta?.err) {
      return { valid: false, reason: 'Transaction failed on-chain' };
    }
    
    // Find memo instruction
    const memoProgramId = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    let memoData = null;
    
    // Check each instruction
    for (const ix of tx.transaction.message.instructions) {
      const programId = tx.transaction.message.accountKeys[ix.programIdIndex];
      
      if (programId.equals(memoProgramId)) {
        // Found memo instruction - data is in the instruction data
        memoData = Buffer.from(ix.data);
        break;
      }
    }
    
    if (!memoData) {
      return { valid: false, reason: 'No memo data found in transaction' };
    }
    
    // Decode data
    const fullData = memoData.toString('utf8');
    
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
        slot: tx.slot,
        protocol: 'LARP v1',
        explorer: config.explorer + txid
      };
    } catch (e) {
      return { valid: false, reason: 'Data is not valid JSON' };
    }
    
  } catch (error) {
    return { valid: false, reason: error.message };
  }
}

export { verifySolanaProof };
