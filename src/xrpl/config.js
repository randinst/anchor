// config.js - XRP configuration

export const XRP_CONFIG = {
  xrp: {
    name: 'XRP Ledger',
    network: 'mainnet',
    maxMemoSize: 1024, // 1KB limit for memo field
    explorer: 'https://xrpscan.com/tx/',
    rpcUrl: 'wss://xrplcluster.com' // Public WebSocket endpoint
  },
  xrptest: {
    name: 'XRP Testnet',
    network: 'testnet',
    maxMemoSize: 1024,
    explorer: 'https://testnet.xrpl.org/transactions/',
    rpcUrl: 'wss://s.altnet.rippletest.net:51233'
  }
};

// Protocol identifier: "PRP1" (same as others)
export const PROTOCOL_ID = 'PRP1';
