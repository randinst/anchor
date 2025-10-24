// config.js - Solana configuration

export const SOLANA_CONFIG = {
  solana: {
    name: 'Solana Mainnet',
    network: 'mainnet-beta',
    maxMemoSize: 566, // Memo instruction limit
    explorer: 'https://explorer.solana.com/tx/',
    rpcUrl: 'https://api.mainnet-beta.solana.com'
  },
  solanadev: {
    name: 'Solana Devnet',
    network: 'devnet',
    maxMemoSize: 566,
    explorer: 'https://explorer.solana.com/tx/?cluster=devnet',
    rpcUrl: 'https://api.devnet.solana.com'
  },
  solanatest: {
    name: 'Solana Testnet',
    network: 'testnet',
    maxMemoSize: 566,
    explorer: 'https://explorer.solana.com/tx/?cluster=testnet',
    rpcUrl: 'https://api.testnet.solana.com'
  }
};

// Protocol identifier: "LARP1" (same as others)
export const PROTOCOL_ID = 'LARP1';
