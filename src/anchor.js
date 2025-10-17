// anchor.js - Anchor full data to EVM chains
import { ethers } from 'ethers';
import { DEFAULT_RPCS, CHAIN_IDS } from './chains.js';

async function anchorToEVM(data, chainName, privateKey, customRpc = null) {
  const rpcUrl = customRpc || DEFAULT_RPCS[chainName];
  const chainId = CHAIN_IDS[chainName];
  
  if (!rpcUrl) throw new Error(`Chain ${chainName} not supported`);
  if (!chainId) throw new Error(`Chain ID not found for ${chainName}`);
  
  // 1. Canonicalize JSON (sorted keys, no whitespace)
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  
  // 2. Convert to hex for transaction data
  const dataHex = '0x' + Buffer.from(canonical, 'utf8').toString('hex');
  
  // 3. Connect to chain
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // 4. Send transaction with full data
  const tx = await wallet.sendTransaction({
    to: wallet.address,
    value: 0,
    data: dataHex,
    chainId: chainId
  });
  
  // 5. Wait for confirmation
  const receipt = await tx.wait();
  
  // 6. Return proof
  return {
    proof: {
      chain: chainName,
      chainId: chainId,
      txid: receipt.hash,
      block: receipt.blockNumber,
      timestamp: new Date().toISOString()
    }
  };
}

export { anchorToEVM };
