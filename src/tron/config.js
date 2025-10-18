// config.js - Tron configuration

export const TRON_CONFIG = {
  tron: {
    name: 'Tron Mainnet',
    network: 'mainnet',
    maxDataSize: 1024, // Conservative limit for data field
    explorer: 'https://tronscan.org/#/transaction/',
    fullNode: 'https://api.trongrid.io',
    solidityNode: 'https://api.trongrid.io',
    eventServer: 'https://api.trongrid.io'
  },
  trontest: {
    name: 'Tron Shasta Testnet',
    network: 'shasta',
    maxDataSize: 1024,
    explorer: 'https://shasta.tronscan.org/#/transaction/',
    fullNode: 'https://api.shasta.trongrid.io',
    solidityNode: 'https://api.shasta.trongrid.io',
    eventServer: 'https://api.shasta.trongrid.io'
  },
  tronnile: {
    name: 'Tron Nile Testnet',
    network: 'nile',
    maxDataSize: 1024,
    explorer: 'https://nile.tronscan.org/#/transaction/',
    fullNode: 'https://api.nileex.io',
    solidityNode: 'https://api.nileex.io',
    eventServer: 'https://api.nileex.io'
  }
};

// Protocol identifier: "PRP1" (same as others)
export const PROTOCOL_ID = 'PRP1';
