// verify.js - Verify proofs by reading from chain
import { ethers } from 'ethers';
import { DEFAULT_RPCS } from './chains.js';
import { PROTOCOL_ID } from './anchor.js';

/**
 * Verifies a LARP proof or raw transaction ID.
 *
 * @param {object|string} input - Either proof object or txid string
 * @param {string} [customRpc] - Optional RPC override
 * @returns {Promise<object>} Result with valid/data/error
 */
async function verifyEVMProof(input, customRpc = null) {
  let chain, txid;

  if (typeof input === 'string') {
    // Raw txid passed — chain required
    throw new Error("Must pass proof object or { txid, chain }");
  } else if (input.proof) {
    ({ chain, txid } = input.proof);
  } else {
    ({ chain, txid } = input);
  }

  if (!chain || !txid) {
    return { valid: false, reason: 'Missing chain or txid' };
  }

  const rpcUrl = customRpc || DEFAULT_RPCS[chain];
  if (!rpcUrl) {
    return { valid: false, reason: `Chain ${chain} not supported` };
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  try {
    const tx = await provider.getTransaction(txid);
    if (!tx) {
      return { valid: false, reason: 'Transaction not found on chain' };
    }

    if (!tx.data || tx.data === '0x') {
      return { valid: false, reason: 'No data in transaction' };
    }

    const dataHex = tx.data.slice(2); // remove 0x
    if (!dataHex.startsWith(PROTOCOL_ID)) {
      return { valid: false, reason: 'Not a LARP transaction (missing protocol ID)' };
    }

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

export { verifyEVMProof };
