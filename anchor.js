// anchor.js
import { ethers } from 'ethers';
import crypto from 'crypto';

async function anchorToEVM(data, chainName, privateKey, customRpc = null) {
  const rpcUrl = customRpc || DEFAULT_RPCS[chainName];
  const chainId = CHAIN_IDS[chainName];
  
  if (!rpcUrl) throw new Error(`Chain ${chainName} not supported`);
  if (!chainId) throw new Error(`Chain ID not found for ${chainName}`);
  
  // 1. Hash the data canonically
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  const hash = crypto.createHash('sha256').update(canonical).digest('hex');
  
  // 2. Connect to chain
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // 3. Send transaction with hash
  const tx = await wallet.sendTransaction({
    to: wallet.address,
    value: 0,
    data: '0x' + hash,
    chainId: chainId
  });
  
  // 4. Wait for confirmation
  const receipt = await tx.wait();
  
  // 5. Return proof
  return {
    data: data,
    proof: {
      hash: hash,
      chain: chainName,
      chainId: chainId,
      txid: receipt.hash,
      block: receipt.blockNumber,
      timestamp: new Date().toISOString()
    }
  };
}

export { anchorToEVM };
