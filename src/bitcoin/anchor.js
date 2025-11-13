// anchor.js - Anchor data to Bitcoin forks
import * as bitcoin from 'bitcoinjs-lib';
import axios from 'axios';
import { BITCOIN_NETWORKS, PROTOCOL_ID } from './chains.js';

/**
 * Anchors canonical JSON data to Bitcoin, BCH, or BSV.
 *
 * @param {object} data - JSON-LD record (Schema.org)
 * @param {string} chainName - 'btc', 'bch', or 'bsv'
 * @param {string} privateKeyHex - 0x-prefixed or raw hex private key
 * @param {string} [customRpc] - Optional custom RPC URL
 * @returns {Promise<{proof: object}>}
 */
async function anchorToBitcoin(data, chainName, privateKeyHex, customRpc = null) {
  const config = BITCOIN_NETWORKS[chainName];
  if (!config) throw new Error(`Chain ${chainName} not supported`);

  // 1. Canonicalize JSON
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  const jsonBuffer = Buffer.from(canonical, 'utf8');
  const dataBuffer = Buffer.concat([PROTOCOL_ID, jsonBuffer]);

  // 2. Check size limit
  const totalSize = dataBuffer.length;
  console.log(`Data size: ${totalSize} bytes (${PROTOCOL_ID.length} protocol ID + ${jsonBuffer.length} data)`);

  if (totalSize > config.maxDataSize && config.maxDataSize !== Infinity) {
    throw new Error(
      `Data too large for ${config.name}. Max: ${config.maxDataSize} bytes, Got: ${totalSize} bytes. ` +
      (chainName !== 'bsv' ? 'Try BSV for unlimited data size.' : '')
    );
  }

  // 3. Derive key pair and address
  const keyPair = bitcoin.ECPair.fromPrivateKey(
    Buffer.from(privateKeyHex.replace('0x', ''), 'hex'),
    { network: config.network }
  );

  const { address } = bitcoin.payments.p2pkh({
    pubkey: keyPair.publicKey,
    network: config.network
  });

  console.log(`Using address: ${address}`);

  // 4. Fetch UTXOs
  const rpcUrl = customRpc || config.rpcUrl;
  const utxos = await getUTXOs(address, chainName, rpcUrl);

  if (utxos.length === 0) {
    throw new Error(`No UTXOs found for address ${address}. Fund this address first.`);
  }

  // 5. Build PSBT
  const psbt = new bitcoin.Psbt({ network: config.network });

  let totalInput = 0;
  for (const utxo of utxos) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: Buffer.from(utxo.hex, 'hex')
    });
    totalInput += utxo.value;
  }

  // 6. Add OP_RETURN output
  const embed = bitcoin.payments.embed({ data: [dataBuffer] });
  psbt.addOutput({
    script: embed.output,
    value: 0
  });

  // 7. Add change output (if sufficient)
  const fee = 1000; // 1000 satoshis
  const change = totalInput - fee;

  if (change > 546) { // Dust threshold
    psbt.addOutput({
      address,
      value: change
    });
  }

  // 8. Sign and finalize
  psbt.signAllInputs(keyPair);
  psbt.finalizeAllInputs();

  // 9. Extract and broadcast
  const tx = psbt.extractTransaction();
  const txHex = tx.toHex();
  const txid = tx.getId();

  console.log(`\nBroadcasting transaction...`);
  await broadcastTransaction(txHex, chainName, rpcUrl);

  // 10. Return proof
  return {
    proof: {
      protocol: 'LARP',
      version: '1',
      chain: chainName,
      txid,
      timestamp: new Date().toISOString(),
      explorer: config.explorer + txid
    }
  };
}

// Helper: Fetch UTXOs
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
    return response.data.map(utxo => ({
      txid: utxo.txid,
      vout: utxo.vout,
      value: utxo.value,
      hex: utxo.hex || ''
    }));
  } catch (error) {
    throw new Error(`Failed to fetch UTXOs: ${error.message}`);
  }
}

// Helper: Broadcast transaction
async function broadcastTransaction(txHex, chainName, rpcUrl) {
  try {
    let url, data, headers = {};

    if (chainName === 'btc') {
      url = `${rpcUrl}/tx`;
      data = txHex;
      headers = { 'Content-Type': 'text/plain' };
    } else if (chainName === 'bch') {
      url = `${rpcUrl}/rawtransactions/sendRawTransaction`;
      data = { hexes: [txHex] };
    } else if (chainName === 'bsv') {
      url = `${rpcUrl}/tx/raw`;
      data = { txhex: txHex };
    }

    await axios.post(url, data, { headers });
    console.log('✓ Transaction broadcast successfully');
  } catch (error) {
    throw new Error(`Failed to broadcast: ${error.message}`);
  }
}

export { anchorToBitcoin };
