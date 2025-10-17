#!/usr/bin/env node
// cli/prp.js - Command line interface for Permanent Record Protocol

import { Command } from 'commander';
import fs from 'fs';
import { anchorToEVM, verifyProof } from '../src/index.js';

const program = new Command();

program
  .name('prp')
  .description('Permanent Record Protocol - Anchor data to blockchains')
  .version('0.1.0');

program
  .command('anchor')
  .description('Anchor data to blockchain')
  .argument('<file>', 'JSON file to anchor')
  .requiredOption('--chain <chain>', 'Chain name (ethereum, polygon, base, etc)')
  .requiredOption('--key <key>', 'Private key (0x...)')
  .option('--rpc <url>', 'Custom RPC URL (optional)')
  .action(async (file, options) => {
    try {
      // Read data file
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      
      console.log(`Anchoring to ${options.chain}...`);
      console.log(`Data size: ${JSON.stringify(data).length} bytes`);
      
      // Anchor to chain
      const result = await anchorToEVM(data, options.chain, options.key, options.rpc);
      
      // Save proof
      const proofFile = file.replace('.json', '-proof.json');
      fs.writeFileSync(proofFile, JSON.stringify(result.proof, null, 2));
      
      console.log(`\n✓ Successfully anchored to ${options.chain}`);
      console.log(`  Transaction: ${result.proof.txid}`);
      console.log(`  Block: ${result.proof.block}`);
      console.log(`  Proof saved: ${proofFile}`);
      console.log(`\nData is permanently readable on-chain at txid: ${result.proof.txid}`);
      
    } catch (error) {
      console.error(`\n✗ Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('verify')
  .description('Verify a proof by reading from chain')
  .argument('<file>', 'Proof file to verify')
  .option('--rpc <url>', 'Custom RPC URL (optional)')
  .action(async (file, options) => {
    try {
      // Read proof file
      const proof = JSON.parse(fs.readFileSync(file, 'utf8'));
      
      console.log(`Verifying proof on ${proof.chain}...`);
      console.log(`Transaction: ${proof.txid}`);
      
      // Verify proof
      const result = await verifyProof(proof, options.rpc);
      
      if (result.valid) {
        console.log(`\n✓ Proof is valid!`);
        console.log(`  Block: ${result.block}`);
        console.log(`  Data type: ${result.data['@type'] || 'unknown'}`);
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

program.parse();
