// verify.js - Verify Tron proofs
import TronWeb from 'tronweb';
import { TRON_CONFIG, PROTOCOL_ID } from './config.js';

async function verifyTronProof(proof, customNodes = null) {
  const { chain, txid } = proof;
  
  if (!chain || !txid) {
    return { valid: false, reason: 'Missing chain or txid in proof' };
  }
  
  const config = TRON_CONFIG[chain];
  if (!config) {
    return { valid: false, reason: `Chain ${chain} not supported` };
  }
  
  // Setup TronWeb (no private key needed for reading)
  const nodes = customNodes || {
    fullNode: config.fullNode,
    solidityNode: config.solidityNode,
    eventServer: config.eventServer
  };
  
  const tronWeb = new TronWeb(
    nodes.fullNode,
    nodes.solidityNode,
    nodes.eventServer
  );
  
  try {
    // Fetch transaction
    const tx = await tronWeb.trx.getTransaction(txid);
    
    if (!tx || !tx.txID) {
      return { valid: false, reason: 'Transaction not found' };
    }
    
    // Check transaction succeeded
    if (!tx.ret || tx.ret[0].contractRet !== 'SUCCESS') {
      return { valid: false, reason: 'Transaction failed on-chain' };
    }
    
    // Extract data from transaction
    // Data is in raw_data.data field (hex encoded)
    const dataHex = tx.raw_data?.data;
    
    if (!dataHex) {
      return { valid: false, reason: 'No data found in transaction' };
    }
    
    // Decode data
    const dataBuffer = Buffer.from(dataHex, 'hex');
    const fullData = dataBuffer.toString('utf8');
    
    // Check protocol identifier
    if (!fullData.startsWith(PROTOCOL_ID)) {
      return { valid: false, reason: 'Not a PRP transaction (missing protocol identifier)' };
    }
    
    // Extract and parse JSON
    const jsonString = fullData.slice(PROTOCOL_ID.length);
    
    try {
      const data = JSON.parse(jsonString);
      return {
        valid: true,
        data: data,
        txid: txid,
        blockNumber: tx.blockNumber,
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

export { verifyTronProof };
