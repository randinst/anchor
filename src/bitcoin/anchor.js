// anchor.js - Anchor data to Bitcoin forks
import * as bitcoin from 'bitcoinjs-lib';
import axios from 'axios';
import { BITCOIN_NETWORKS, PROTOCOL_ID } from './chains.js';

async function anchorToBitcoin(data, chainName, privateKeyHex, customRpc = null) {
  const config = BITCOIN_NETWORKS[chainName];
  
  if (!config) {
    throw new Error(`Chain ${chainName} not supported`);
  }
  
  // 1. Canonicalize JSON
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  
  // 2. Create data buffer with protocol ID
  const jsonBuffer = Buffer.from(canonical, 'utf8');
  const dataBuffer = Buffer.concat([PROTOCOL_ID, jsonBuffer]);
  
  // 3. Check size limits
  const totalSize = dataBuffer.length;
  console.log(`Data size: ${totalSize} bytes (${PROTOCOL_ID.length} protocol ID + ${jsonBuffer.length} data)`);
  
  if (totalSize > config.maxDataSize) {
    throw new Error(
      `Data too large for ${config.name}. ` +
      `Max: ${config.maxDataSize} bytes, Got: ${totalSize} bytes. ` +
      `Try BSV for unlimited data size.`
    );
  }
  
  // 4. Setup key pair and address
  const keyPair = bitcoin.ECPair.fromPrivateKey(
    Buffer.from(privateKeyHex.replace('0x', ''), 'hex'),
    { network: config.network }
  );
  
  const { address } = bitcoin.payments.p2pkh({
    pubkey: keyPair.publicKey,
    network: config.network
  });
  
  console.log(`Using address: ${address}`);
  
  // 5. Get UTXOs for this address
  const rpcUrl = customRpc || config.rpcUrl;
  const utxos = await getUTXOs(address, chainName, rpcUrl);
  
  if (utxos.length === 0) {
    throw new Error(`No UTXOs found for address ${address}. Fund this address first.`);
  }
  
  // 6. Build transaction
  const psbt = new bitcoin.Psbt({ network: config.network });
  
  // Add inputs (UTXOs)
  let totalInput = 0;
  for (const utxo of utxos) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: Buffer.from(utxo.hex, 'hex')
    });
    totalInput += utxo.value;
  }
  
  // Add OP_RETURN output with data
  const embed = bitcoin.payments.embed({ data: [dataBuffer] });
  psbt.addOutput({
    script: embed.output,
    value: 0
  });
  
  // Add change output (send remaining back to self)
  const fee = 1000; // 1000 satoshis (~$0.50 depending on BTC price)
  const change = totalInput - fee;
  
  if (change > 546) { // Dust limit
    psbt.addOutput({
      address: address,
      value: change
    });
  }
  
  // 7. Sign transaction
  psbt.signAllInputs(keyPair);
  psbt.finalizeAllInputs();
  
  // 8. Extract and broadcast
  const tx = psbt.extractTransaction();
  const txHex = tx.toHex();
  const txid = tx.getId();
  
  console.log(`\nBroadcasting transaction...`);
  await broadcastTransaction(txHex, chainName, rpcUrl);
  
  // 9. Return proof
  return {
    proof: {
      protocol: 'LARP',
      version: '1',
      chain: chainName,
      txid: txid,
      timestamp: new Date().toISOString(),
      explorer: config.explorer + txid
    }
  };
}

// Helper: Get UTXOs for address
async function getUTXOs(address, chainName, rpcUrl) {
  try {
    let url;
    
    if (chainName === 'btc') {
      url = `${rpcUrl}/address/${address}/utxo`;
    } else if (chainName === 'bch') {
      url = `${rpcUrl}/address/utxo/${address}`;
    } else if (chainName === 'bsv') {
      url = `${rpcUrl}/address/${address}/unspent`;
    }
    
    const response = await axios.get(url);
    const utxos = response.data;
    
    // Format UTXOs consistently
    return utxos.map(utxo => ({
      txid: utxo.txid,
      vout: utxo.vout,
      value: utxo.value,
      hex: utxo.hex || '' // Some APIs don't provide this
    }));
    
  } catch (error) {
    throw new Error(`Failed to fetch UTXOs: ${error.message}`);
  }
}

// Helper: Broadcast transaction
async function broadcastTransaction(txHex, chainName, rpcUrl) {
  try {
    let url;
    
    if (chainName === 'btc') {
      url = `${rpcUrl}/tx`;
      await axios.post(url, txHex, { headers: { 'Content-Type': 'text/plain' } });
    } else if (chainName === 'bch') {
      url = `${rpcUrl}/rawtransactions/sendRawTransaction`;
      await axios.post(url, { hexes: [txHex] });
    } else if (chainName === 'bsv') {
      url = `${rpcUrl}/tx/raw`;
      await axios.post(url, { txhex: txHex });
    }
    
    console.log('✓ Transaction broadcast successfully');
    
  } catch (error) {
    throw new Error(`Failed to broadcast: ${error.message}`);
  }
}

export { anchorToBitcoin };
