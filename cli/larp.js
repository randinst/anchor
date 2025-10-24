#!/usr/bin/env node
// cli/larp.js - Command line interface for Permanent Record Protocol

import { Command } from 'commander';
import fs from 'fs';
import {
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
} from '../src/index.js';

const program = new Command();

program
  .name('larp')
  .description('Permanent Record Protocol - Anchor data to blockchains')
  .version('0.1.0');

// Helper: Determine chain type
function getChainType(chain) {
  if (CHAIN_IDS[chain]) return 'evm';
  if (BITCOIN_NETWORKS[chain]) return 'bitcoin';
  if (XRP_CONFIG[chain]) return 'xrp';
  if (SOLANA_CONFIG[chain]) return 'solana';
  if (TRON_CONFIG[chain]) return 'tron';
  return null;
}

// ANCHOR command
program
  .command('anchor')
  .description('Anchor data to blockchain')
  .argument('<file>', 'JSON file to anchor')
  .requiredOption('--chain <chain>', 'Chain name (ethereum, polygon, btc, bsv, xrp, solana, tron, etc)')
  .requiredOption('--key <key>', 'Private key (format depends on chain)')
  .option('--rpc <url>', 'Custom RPC URL (optional)')
  .action(async (file, options) => {
    try {
      // Read data file
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      
      const chainType = getChainType(options.chain);
      
      if (!chainType) {
        console.error(`✗ Unknown chain: ${options.chain}`);
        console.log('\nSupported chains:');
        console.log('  EVM:', Object.keys(CHAIN_IDS).join(', '));
        console.log('  Bitcoin:', Object.keys(BITCOIN_NETWORKS).join(', '));
        console.log('  XRP:', Object.keys(XRP_CONFIG).join(', '));
        console.log('  Solana:', Object.keys(SOLANA_CONFIG).join(', '));
        console.log('  Tron:', Object.keys(TRON_CONFIG).join(', '));
        process.exit(1);
      }
      
      console.log(`Anchoring to ${options.chain}...`);
      
      let result;
      
      // Route to appropriate function
      switch (chainType) {
        case 'evm':
          result = await anchorToEVM(data, options.chain, options.key, options.rpc);
          break;
          
        case 'bitcoin':
          result = await anchorToBitcoin(data, options.chain, options.key, options.rpc);
          break;
          
        case 'xrp':
          result = await anchorToXRP(data, options.chain, options.key, options.rpc);
          break;
          
        case 'solana':
          result = await anchorToSolana(data, options.chain, options.key, options.rpc);
          break;
          
        case 'tron':
          result = await anchorToTron(data, options.chain, options.key);
          break;
      }
      
      // Save proof
      const proofFile = file.replace('.json', '-proof.json');
      fs.writeFileSync(proofFile, JSON.stringify(result.proof, null, 2));
      
      console.log(`\n✓ Successfully anchored to ${options.chain}`);
      console.log(`  Transaction: ${result.proof.txid}`);
      if (result.proof.block) console.log(`  Block: ${result.proof.block}`);
      if (result.proof.ledger) console.log(`  Ledger: ${result.proof.ledger}`);
      if (result.proof.slot) console.log(`  Slot: ${result.proof.slot}`);
      console.log(`  Proof saved: ${proofFile}`);
      console.log(`  Explorer: ${result.proof.explorer || 'N/A'}`);
      console.log(`\nData is permanently readable on-chain at: ${result.proof.txid}`);
      
    } catch (error) {
      console.error(`\n✗ Error: ${error.message}`);
      process.exit(1);
    }
  });

// VERIFY command
program
  .command('verify')
  .description('Verify a proof by reading from chain')
  .argument('<file>', 'Proof file to verify')
  .option('--rpc <url>', 'Custom RPC URL (optional)')
  .action(async (file, options) => {
    try {
      // Read proof file
      const proof = JSON.parse(fs.readFileSync(file, 'utf8'));
      
      const chainType = getChainType(proof.chain);
      
      if (!chainType) {
        console.error(`✗ Unknown chain in proof: ${proof.chain}`);
        process.exit(1);
      }
      
      console.log(`Verifying proof on ${proof.chain}...`);
      console.log(`Transaction: ${proof.txid}`);
      
      let result;
      
      // Route to appropriate verify function
      switch (chainType) {
        case 'evm':
          result = await verifyEVMProof(proof, options.rpc);
          break;
          
        case 'bitcoin':
          result = await verifyBitcoinProof(proof, options.rpc);
          break;
          
        case 'xrp':
          result = await verifyXRPProof(proof, options.rpc);
          break;
          
        case 'solana':
          result = await verifySolanaProof(proof, options.rpc);
          break;
          
        case 'tron':
          result = await verifyTronProof(proof);
          break;
      }
      
      if (result.valid) {
        console.log(`\n✓ Proof is valid!`);
        console.log(`  Protocol: ${result.protocol}`);
        if (result.block) console.log(`  Block: ${result.block}`);
        if (result.ledger) console.log(`  Ledger: ${result.ledger}`);
        if (result.slot) console.log(`  Slot: ${result.slot}`);
        console.log(`  Data type: ${result.data['@type'] || 'unknown'}`);
        if (result.explorer) console.log(`  Explorer: ${result.explorer}`);
        console.log(`\nFull data retrieved from chain:`);
        console.log(JSON.stringify(result.data, null, 2));
      } else {
        console.log(`\n✗ Proof is invalid: ${result.reason}`);
        process.exit(1);
      }
      
    } catch (error) {
      console.error(`\n✗ Error: ${error.message}`);
      process.exit(1);
    }
  });

// LIST command - show supported chains
program
  .command('list')
  .description('List all supported chains')
  .action(() => {
    console.log('\n📋 Supported Chains:\n');
    
    console.log('EVM Chains:');
    Object.keys(CHAIN_IDS).forEach(chain => {
      console.log(`  - ${chain}`);
    });
    
    console.log('\nBitcoin Networks:');
    Object.entries(BITCOIN_NETWORKS).forEach(([key, config]) => {
      console.log(`  - ${key} (${config.name}, max ${config.maxDataSize} bytes)`);
    });
    
    console.log('\nXRP:');
    Object.entries(XRP_CONFIG).forEach(([key, config]) => {
      console.log(`  - ${key} (${config.name})`);
    });
    
    console.log('\nSolana:');
    Object.entries(SOLANA_CONFIG).forEach(([key, config]) => {
      console.log(`  - ${key} (${config.name})`);
    });
    
    console.log('\nTron:');
    Object.entries(TRON_CONFIG).forEach(([key, config]) => {
      console.log(`  - ${key} (${config.name})`);
    });
    
    console.log('\nKey Formats:');
    console.log('  EVM: 0x... (hex)');
    console.log('  Bitcoin: 0x... (hex) or WIF format');
    console.log('  XRP: s... (secret key)');
    console.log('  Solana: Base58 private key');
    console.log('  Tron: Hex private key');
  });

program.parse();
