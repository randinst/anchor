// verify.js - Verify proofs by reading from chain
import { ethers } from 'ethers';
import { DEFAULT_RPCS } from './chains.js';
import { PROTOCOL_ID } from './anchor.js';

async function verifyProof(proof, customRpc = null) {
  const { chain, txid, block } = proof;
  
  if (!chain || !txid) {
    return { valid: false, reason: 'Missing chain or txid in proof' };
  }
  
  // Connect to chain
  const rpcUrl = customRpc || DEFAULT_RPCS[chain];
  if (!rpcUrl) {
    return { valid: false, reason: `Chain ${chain} not supported` };
  }
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  try {
    // Get transaction from chain
    const tx = await provider.getTransaction(txid);
    
    if (!tx) {
      return { valid: false, reason: 'Transaction not found on chain' };
    }
    
    // Verify block number matches
    if (block && tx.blockNumber !== block) {
      return { valid: false, reason: 'Block number mismatch' };
    }
    
    // Decode data from transaction
    if (!tx.data || tx.data === '0x') {
      return { valid: false, reason: 'No data in transaction' };
    }
    
    // Check for protocol identifier
    const dataHex = tx.data.slice(2); // Remove '0x'
    
    if (!dataHex.startsWith(PROTOCOL_ID)) {
      return { valid: false, reason: 'Not a LARP transaction (missing protocol identifier)' };
    }
    
    // Remove protocol ID and decode hex back to JSON string
    const jsonHex = dataHex.slice(PROTOCOL_ID.length);
    const jsonString = Buffer.from(jsonHex, 'hex').toString('utf8');
    
    try {
      const data = JSON.parse(jsonString);
      return { 
        valid: true, 
        data: data,
        txid: txid,
        block: tx.blockNumber,
        protocol: 'LARP v1'
      };
    } catch (e) {
      return { valid: false, reason: 'Data is not valid JSON' };
    }
    
  } catch (error) {
    return { valid: false, reason: error.message };
  }
}

export { verifyProof };
