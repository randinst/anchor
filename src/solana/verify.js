// verify.js - Verify Solana proofs
import { Connection, PublicKey } from '@solana/web3.js';
import { SOLANA_CONFIG, PROTOCOL_ID } from './config.js';

async function verifySolanaProof(proof, customRpc = null) {
  const { chain, txid } = proof;
  if (!chain || !txid) return { valid: false, reason: 'Missing chain or txid' };
  
  const config = SOLANA_CONFIG[chain];
  if (!config) return { valid: false, reason: `Chain ${chain} not supported` };
  
  // Connect to Solana
  const rpcUrl = customRpc || config.rpcUrl;
  const connection = new Connection(rpcUrl, 'confirmed');
  
  try {
    // Fetch transaction
    const tx = await connection.getTransaction(txid, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });
    
    if (!tx) return { valid: false, reason: 'Transaction not found' };
    if (tx.meta?.err) return { valid: false, reason: 'Transaction failed on-chain' };
    
    // Find memo instruction
    const memoProgramId = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
    let memoData = null;
    
    for (const ix of tx.transaction.message.instructions) {
      const programId = tx.transaction.message.accountKeys[ix.programIdIndex];
      if (programId.equals(memoProgramId)) {
        memoData = Buffer.from(ix.data);
        break;
      }
    }
    
    if (!memoData) return { valid: false, reason: 'No memo data found' };
    
    // Decode and verify
    const fullData = memoData.toString('utf8');
    if (!fullData.startsWith(PROTOCOL_ID)) {
      return { valid: false, reason: 'Not a LARP transaction (missing protocol identifier)' };
    }
    
    // Parse JSON
    const jsonString = fullData.slice(PROTOCOL_ID.length);
    const data = JSON.parse(jsonString);
    
    return {
      valid: true,
      data: data,
      txid: txid,
      slot: tx.slot,
      protocol: 'LARP v1',
      explorer: config.explorer + txid
    };
    
  } catch (error) {
    return { valid: false, reason: error.message };
  }
}

export { verifySolanaProof };
