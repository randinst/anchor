// chains.js - Bitcoin fork configurations
import * as bitcoin from 'bitcoinjs-lib';

export const BITCOIN_NETWORKS = {
  btc: {
    name: 'Bitcoin',
    network: bitcoin.networks.bitcoin,
    maxDataSize: 76, // 80 bytes total, 4 for protocol ID
    explorer: 'https://blockstream.info/tx/',
    rpcUrl: 'https://blockstream.info/api' // Public API
  },
  bch: {
    name: 'Bitcoin Cash',
    network: bitcoin.networks.bitcoin,
    maxDataSize: 216, // 220 bytes total, 4 for protocol ID
    explorer: 'https://blockchair.com/bitcoin-cash/transaction/',
    rpcUrl: 'https://rest.bch.actorforth.org/v2' // Public API
  },
  bsv: {
    name: 'Bitcoin SV',
    network: bitcoin.networks.bitcoin,
    maxDataSize: Infinity, // No practical limit
    explorer: 'https://whatsonchain.com/tx/',
    rpcUrl: 'https://api.whatsonchain.com/v1/bsv/main'
  }
};

// Protocol identifier: "LARP1" (same as EVM)
export const PROTOCOL_ID = Buffer.from('LARP1', 'utf8');
