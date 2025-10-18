// verify.js - Verify Bitcoin proofs
import axios from 'axios';
import { BITCOIN_NETWORKS, PROTOCOL_ID } from './chains.js';

async function verifyBitcoinProof(proof, customRpc = null) {
  const { chain, txid } = proof;
  
  if (!chain || !txid) {
    return { valid: false, reason: 'Missing chain or txid in proof' };
  }
  
  const config = BITCOIN_NETWORKS[chain];
  if (!config) {
    return { valid: false, reason: `Chain ${chain} not supported` };
  }
  
  const rpcUrl = customRpc || config.rpcUrl;
  
  try {
    // Fetch transaction
    let url;
    if (chain === 'btc') {
      url = `${rpcUrl}/tx/${txid}`;
    } else if (chain === 'bch') {
      url = `${rpcUrl}/transaction/details/${txid}`;
    } else if (chain === 'bsv') {
      url = `${rpcUrl}/tx/hash/${txid}`;
    }
    
    const response = await axios.get(url);
    const tx = response.data;
    
    // Find OP_RETURN output
    let opReturnData = null;
    
    for (const vout of tx.vout) {
      if (vout.scriptPubKey && vout.scriptPubKey.type === 'nulldata') {
        // Extract hex data from OP_RETURN
        const hex = vout.scriptPubKey.hex;
        // Remove OP_RETURN opcode (0x6a) and push byte
        opReturnData = hex.substring(4); // Skip first 2 bytes
        break;
      }
    }
    
    if (!opReturnData) {
      return { valid: false, reason: 'No OP_RETURN data found in transaction' };
    }
    
    // Decode data
    const dataBuffer = Buffer.from(opReturnData, 'hex');
    
    // Check protocol ID
    const protocolIdFromTx = dataBuffer.slice(0, PROTOCOL_ID.length);
    if (!protocolIdFromTx.equals(PROTOCOL_ID)) {
      return { valid: false, reason: 'Not a PRP transaction (missing protocol identifier)' };
    }
    
    // Extract and parse JSON
    const jsonBuffer = dataBuffer.slice(PROTOCOL_ID.length);
    const jsonString = jsonBuffer.toString('utf8');
    
    try {
      const data = JSON.parse(jsonString);
      return {
        valid: true,
        data: data,
        txid: txid,
        protocol: 'PRP v1',
        explorer: config.explorer + txid
      };
    } catch (e) {
      return { valid: false, reason: 'Data is not valid JSON' };
    }
    
  } catch (error) {
    return { valid: false, reason: error.message };
  }
}

export { verifyBitcoinProof };
