import { ethers } from 'ethers';
import crypto from 'crypto';

async function verifyProof(proof, customRpc = null) {
  const { data, proof: proofData } = proof;
  const { hash, chain, chainId, txid, block } = proofData;
  
  // 1. Verify hash matches data
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  const computedHash = crypto.createHash('sha256').update(canonical).digest('hex');
  
  if (computedHash !== hash) {
    return { valid: false, reason: 'Hash mismatch' };
  }
  
  // 2. Verify transaction exists on chain
  const rpcUrl = customRpc || DEFAULT_RPCS[chain];
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  try {
    const tx = await provider.getTransaction(txid);
    if (!tx) {
      return { valid: false, reason: 'Transaction not found' };
    }
    
    // 3. Verify hash is in transaction data
    const txHash = tx.data.slice(2); // remove '0x'
    if (txHash !== hash) {
      return { valid: false, reason: 'Hash not in transaction' };
    }
    
    // 4. Verify block matches
    if (tx.blockNumber !== block) {
      return { valid: false, reason: 'Block number mismatch' };
    }
    
    return { valid: true };
    
  } catch (error) {
    return { valid: false, reason: error.message };
  }
}

export { verifyProof };
