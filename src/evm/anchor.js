// anchor.js - Anchor full data to EVM chains with protocol identifier
import { ethers } from 'ethers';
import { DEFAULT_RPCS, CHAIN_IDS } from './chains.js';

// Protocol identifier: "LARP1" (Ledger-Anchored Record Protocol v1)
const PROTOCOL_ID = '4C41525031'; // Hex for "LARP1"

/**
 * Anchors canonical JSON data to an EVM-compatible blockchain.
 *
 * @param {object} data - JSON-LD record (Schema.org format)
 * @param {string} chainName - Name of the chain (must match DEFAULT_RPCS)
 * @param {string} privateKey - Hex private key (with 0x prefix)
 * @param {string} [customRpc] - Optional custom RPC endpoint
 * @returns {Promise<object>} Proof object containing txid, block, etc.
 */
async function anchorToEVM(data, chainName, privateKey, customRpc = null) {
  const rpcUrl = customRpc || DEFAULT_RPCS[chainName];
  const chainId = CHAIN_IDS[chainName];

  if (!rpcUrl) throw new Error(`Chain ${chainName} not supported`);
  if (!chainId) throw new Error(`Chain ID not found for ${chainName}`);

  // 1. Canonicalize JSON (sorted keys, no extra whitespace)
  const canonical = JSON.stringify(data, Object.keys(data).sort());

  // 2. Log size warning for large data (EVM gas cost consideration)
  const dataSize = Buffer.from(canonical, 'utf8').length;
  console.log(`Data size: ${dataSize} bytes (+ 5 bytes protocol ID)`);

  if (dataSize > 9500) {
    console.warn(`⚠️ Warning: Large data size. This will be expensive on EVM chains.`);
  }

  // 3. Prefix with protocol ID and encode to hex
  const dataHex = Buffer.from(canonical, 'utf8').toString('hex');
  const fullDataHex = '0x' + PROTOCOL_ID + dataHex;

  // 4. Initialize provider and wallet
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  // 5. Broadcast transaction with data field
  const tx = await wallet.sendTransaction({
    to: wallet.address, // Self-send to avoid ETH transfer
    value: 0,
    data: fullDataHex,
    chainId: chainId
  });

  // 6. Wait for confirmation
  const receipt = await tx.wait();

  // 7. Return standardized proof object
  return {
    proof: {
      protocol: 'LARP',
      version: '1',
      chain: chainName,
      chainId: chainId,
      txid: receipt.hash,
      block: receipt.blockNumber,
      timestamp: new Date().toISOString()
    }
  };
}

export { anchorToEVM, PROTOCOL_ID };
