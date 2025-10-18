// index.js - Main library exports
import { anchorToEVM, verifyEVMProof } from './evm/anchor.js';
import { anchorToBitcoin, verifyBitcoinProof } from './bitcoin/anchor.js';
import { anchorToXRP, verifyXRPProof } from './xrp/anchor.js';
import { anchorToSolana, verifySolanaProof } from './solana/anchor.js';
import { anchorToTron, verifyTronProof } from './tron/anchor.js';
import { DEFAULT_RPCS, CHAIN_IDS } from './evm/chains.js';
import { BITCOIN_NETWORKS } from './bitcoin/chains.js';
import { XRP_CONFIG } from './xrp/config.js';
import { SOLANA_CONFIG } from './solana/config.js';
import { TRON_CONFIG } from './tron/config.js';

export {
  // EVM
  anchorToEVM,
  verifyEVMProof,
  DEFAULT_RPCS,
  CHAIN_IDS,
  
  // Bitcoin
  anchorToBitcoin,
  verifyBitcoinProof,
  BITCOIN_NETWORKS,
  
  // XRP
  anchorToXRP,
  verifyXRPProof,
  XRP_CONFIG,
  
  // Solana
  anchorToSolana,
  verifySolanaProof,
  SOLANA_CONFIG,
  
  // Tron
  anchorToTron,
  verifyTronProof,
  TRON_CONFIG
};
