// anchor.js - Anchor full data to EVM chains with protocol identifier
import { ethers } from 'ethers';
import { DEFAULT_RPCS, CHAIN_IDS } from './chains.js';

// Protocol identifier: "PRP1" (Permanent Record Protocol v1)
const PROTOCOL_ID = '50525031'; // "PRP1" in hex

async function anchorToEVM(data, chainName, privateKey, customRpc = null) {
  const rpcUrl = customRpc || DEFAULT_RPCS[chainName];
  const chainId = CHAIN_IDS[chainName];
  
  if (!rpcUrl) throw new Error(`Chain ${chainName} not supported`);
  if (!chainId) throw new Error(`Chain ID not found for ${chainName}`);
  
  // 1. Canonicalize JSON (sorted keys, no whitespace)
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  
  // 2. Check size and warn
  const dataSize = Buffer.from(canonical, 'utf8').length;
  console.log(`Data size: ${dataSize} bytes (+ 4 bytes protocol ID)`);
  
  if (dataSize > 10000) {
    console.warn(`⚠️  Warning: Large data size. This will be expensive on EVM chains.`);
  }
  
  // 3. Convert to hex with protocol identifier prefix
  const dataHex = Buffer.from(canonical, 'utf8').toString('hex');
  const fullDataHex = '0x' + PROTOCOL_ID + dataHex;
  
  // 4. Connect to chain
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // 5. Send transaction with protocol ID + full data
  const tx = await wallet.sendTransaction({
    to: wallet.address,
    value: 0,
    data: fullDataHex,
    chainId: chainId
  });
  
  // 6. Wait for confirmation
  const receipt = await tx.wait();
  
  // 7. Return proof
  return {
    proof: {
      protocol: 'PRP',
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
