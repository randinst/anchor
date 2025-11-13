// verify.js - Verify Bitcoin proofs
import axios from 'axios';
import { BITCOIN_NETWORKS, PROTOCOL_ID } from './chains.js';

/**
 * Verifies a LARP-anchored transaction on Bitcoin forks.
 *
 * @param {object} proof - Proof object with chain and txid
 * @param {string} [customRpc] - Optional custom RPC
 * @returns {Promise<object>} { valid, data?, explorer?, error? }
 */
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
    let opReturnHex = null;
    for (const vout of tx.vout) {
      if (vout.scriptPubKey?.type === 'nulldata') {
        opReturnHex = vout.scriptPubKey.hex;
        break;
      }
    }

    if (!opReturnHex) {
      return { valid: false, reason: 'No OP_RETURN output found' };
    }

    // Parse OP_RETURN: skip 0x6a (OP_RETURN) and length byte
    const dataHex = opReturnHex.substring(4); // Remove first 2 bytes (e.g., "6a14")
    const dataBuffer = Buffer.from(dataHex, 'hex');

    // Check protocol ID
    const protocolIdFromTx = dataBuffer.slice(0, PROTOCOL_ID.length);
    if (!protocolIdFromTx.equals(PROTOCOL_ID)) {
      return { valid: false, reason: 'Missing or invalid LARP protocol ID' };
    }

    // Extract and parse JSON
    const jsonBuffer = dataBuffer.slice(PROTOCOL_ID.length);
    const jsonString = jsonBuffer.toString('utf8');

    try {
      const data = JSON.parse(jsonString);
      return {
        valid: true,
        data,
        txid,
        protocol: 'LARP v1',
        explorer: config.explorer + txid
      };
    } catch (e) {
      return { valid: false, reason: 'Invalid JSON in data' };
    }

  } catch (error) {
    return { valid: false, reason: error.message };
  }
}

export { verifyBitcoinProof };
